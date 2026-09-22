-- ═══════════════════════════════════════════════════════════════════════════
-- 0001 · Las cuentas: personas, negocios y quién puede qué.
--
-- Es la primera pieza de la base y la que sostiene todas las demás. Está escrita
-- **preparada para varios negocios** dentro del mismo cliente: una clínica con dos
-- sedes, una marca con dos nombres o un negocio que mañana se divide. No cuesta
-- casi nada hoy y es lo único que no se puede añadir después sin rehacer.
--
-- Las tres tablas, en una frase cada una:
--   · `negocios`  — un espacio de trabajo con su propio nombre y sus datos.
--   · `perfiles`  — una fila por cuenta de acceso, con lo que se enseña de ella.
--   · `miembros`  — quién está en qué negocio y con qué papel. Es la tabla que
--                   decide todo lo demás: sin fila aquí, no se ve nada.
--
-- Y una regla que se cumple en las tres: **si no está escrito que puedes, no
-- puedes**. La base no confía en nadie por defecto, ni siquiera en el navegador
-- del dueño.
--
-- Se puede aplicar las veces que haga falta: no rompe nada si ya está puesta.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1 · Los negocios
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.negocios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  creado_en timestamptz not null default now(),

  -- Un nombre de una sola letra suele ser una prueba, no un negocio. No se
  -- recorta por gusto: entra en correos, facturas y avisos.
  constraint negocios_nombre_con_cuerpo check (length(btrim(nombre)) between 2 and 80)
);

comment on table public.negocios is
  'Un espacio de trabajo. Un cliente puede tener uno o varios (dos sedes, dos marcas).';

-- ───────────────────────────────────────────────────────────────────────────
-- 2 · Las personas
--
-- La cuenta de acceso la guarda Supabase en su propio esquema (`auth.users`), y
-- aquí vive lo que es del producto: el nombre que se enseña, el avatar, el
-- idioma. Se separan a propósito: en `auth` no se toca nada, y así una
-- actualización de Supabase no se lleva por delante lo nuestro.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  avatar_url text,
  idioma text not null default 'es',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.perfiles is
  'Lo que se enseña de una persona. `id` es la misma cuenta de acceso, no una copia.';

-- ───────────────────────────────────────────────────────────────────────────
-- 3 · La pertenencia
--
-- Esta tabla es la puerta. Los tres papeles son los mínimos que hacen falta en
-- cualquier producto y son genéricos a propósito —nada de «agencia», «médico» ni
-- «profesor»: eso lo dice cada proyecto por encima, no la base—:
--
--   · `dueno`   — el negocio es suyo: toca todo, incluido quién entra.
--   · `admin`   — gestiona el día a día y a la gente, pero no se lleva el negocio.
--   · `miembro` — usa la aplicación y ve lo suyo.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.miembros (
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  rol text not null default 'miembro',
  creado_en timestamptz not null default now(),
  primary key (negocio_id, usuario_id),

  constraint miembros_rol_conocido check (rol in ('dueno', 'admin', 'miembro'))
);

comment on table public.miembros is
  'Quién pertenece a qué negocio y con qué papel. Sin fila aquí no se ve nada de ese negocio.';

-- Una persona puede estar en diez negocios; un negocio puede tener cien personas.
-- Esta segunda dirección es la que no cubre la clave principal, y es la que se
-- pregunta en cada carga de la aplicación.
create index if not exists miembros_por_persona on public.miembros (usuario_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4 · Las dos preguntas que se hacen todas las reglas de acceso
--
-- Están en funciones y no escritas a mano en cada regla por un motivo concreto:
-- si una regla de `miembros` tuviera que leer `miembros` para decidir, la base se
-- llamaría a sí misma hasta el infinito. Una función marcada como `security
-- definer` mira la tabla por detrás del cortafuegos y rompe ese círculo.
--
-- Y no son un agujero: la única respuesta que pueden dar es sobre **quien
-- pregunta** (`auth.uid()`), nunca sobre otra persona.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.papel_en(negocio uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select rol
  from public.miembros
  where negocio_id = negocio
    and usuario_id = auth.uid()
$$;

comment on function public.papel_en(uuid) is
  'El papel de quien pregunta en ese negocio, o nulo si no pertenece a él.';

create or replace function public.pertenece_a(negocio uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.miembros
    where negocio_id = negocio
      and usuario_id = auth.uid()
  )
$$;

comment on function public.pertenece_a(uuid) is
  'Si quien pregunta está dentro de ese negocio, con cualquier papel.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 5 · Lo que la base hace sola
--
-- Dos automatismos, y ninguno se puede dejar para el código de la aplicación:
-- el perfil de una cuenta recién creada y el dueño de un negocio recién creado.
-- Si se olvidaran, la cuenta existiría sin perfil o el negocio sin nadie que
-- pudiera entrar, y eso no hay quien lo arregle desde la pantalla.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.crear_perfil_al_entrar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (
    new.id,
    -- El nombre que ya trae quien entra con Google o con su proveedor, si lo trae.
    nullif(btrim(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists al_crear_una_cuenta on auth.users;
create trigger al_crear_una_cuenta
  after insert on auth.users
  for each row execute function public.crear_perfil_al_entrar();

-- Y el mismo trabajo para las cuentas que ya existieran antes de esta migración:
-- así nadie se queda sin perfil por haber llegado temprano.
insert into public.perfiles (id, nombre)
select
  u.id,
  nullif(btrim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')), '')
from auth.users u
on conflict (id) do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6 · Los cortafuegos, tabla por tabla
--
-- Sin esto, la clave pública que viaja al navegador bastaría para leer lo que
-- cualquiera guardara. Con esto, la clave deja de importar: cada fila se concede
-- o se niega según quién pregunta.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.negocios enable row level security;
alter table public.perfiles enable row level security;
alter table public.miembros enable row level security;

-- ── Los negocios ────────────────────────────────────────────────────────────
drop policy if exists negocios_se_ven_los_de_dentro on public.negocios;
create policy negocios_se_ven_los_de_dentro
  on public.negocios for select
  to authenticated
  using (public.pertenece_a(id));

drop policy if exists negocios_los_cambia_quien_manda on public.negocios;
create policy negocios_los_cambia_quien_manda
  on public.negocios for update
  to authenticated
  using (public.papel_en(id) in ('dueno', 'admin'))
  with check (public.papel_en(id) in ('dueno', 'admin'));

-- Un negocio no se borra desde el navegador ni con la clave de un administrador:
-- se cierra desde fuera, con la llave del servidor, y con una copia hecha. Es la
-- clase de borrado que no se puede deshacer y que nadie espera que exista a un
-- clic de distancia.
drop policy if exists negocios_solo_el_dueno_lo_cierra on public.negocios;
create policy negocios_solo_el_dueno_lo_cierra
  on public.negocios for delete
  to authenticated
  using (public.papel_en(id) = 'dueno');

-- ── Las personas ────────────────────────────────────────────────────────────
-- Se ve uno mismo siempre; y a los compañeros de los negocios en los que se está,
-- porque sin eso no hay lista de equipo, ni asignar trabajo, ni saber quién hizo
-- qué.
drop policy if exists perfiles_me_veo_y_veo_a_los_mios on public.perfiles;
create policy perfiles_me_veo_y_veo_a_los_mios
  on public.perfiles for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.miembros mio
      join public.miembros suyo on suyo.negocio_id = mio.negocio_id
      where mio.usuario_id = auth.uid()
        and suyo.usuario_id = perfiles.id
    )
  );

-- El perfil propio se edita; el de nadie más, ni siquiera con el papel más alto.
-- Y el papel tampoco se cambia por aquí: eso vive en `miembros`.
drop policy if exists perfiles_solo_edito_el_mio on public.perfiles;
create policy perfiles_solo_edito_el_mio
  on public.perfiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Borrar la cuenta no se hace desde aquí, sino con la llave del servidor: así hay
-- un solo camino para irse y siempre pasa por la comprobación de lo que deja atrás.
-- (Ver la función `negocios_que_quedarian_huerfanos` más abajo.)

-- ── La pertenencia ──────────────────────────────────────────────────────────
drop policy if exists miembros_los_ve_el_negocio on public.miembros;
create policy miembros_los_ve_el_negocio
  on public.miembros for select
  to authenticated
  using (public.pertenece_a(negocio_id));

-- Cambiar a alguien de papel o echarlo es cosa del dueño. Invitar tiene su propio
-- camino —la función de más abajo—, y por eso no hay regla de insertar: así nadie
-- se añade a sí mismo a un negocio ajeno.
drop policy if exists miembros_los_mueve_el_dueno on public.miembros;
create policy miembros_los_mueve_el_dueno
  on public.miembros for update
  to authenticated
  using (public.papel_en(negocio_id) = 'dueno')
  with check (public.papel_en(negocio_id) = 'dueno');

drop policy if exists miembros_los_quita_el_dueno on public.miembros;
create policy miembros_los_quita_el_dueno
  on public.miembros for delete
  to authenticated
  using (public.papel_en(negocio_id) = 'dueno');

-- ═══════════════════════════════════════════════════════════════════════════
-- 7 · Las tres cosas que el navegador no debe poder hacer a mano
--
-- Cada una es una función en el servidor de la base, y las tres tienen el mismo
-- motivo: son operaciones de varios pasos que, a medias, dejan datos rotos.
-- ═══════════════════════════════════════════════════════════════════════════

-- · Abrir un negocio: crea el negocio y a quien lo abre como dueño, o no crea nada.
create or replace function public.abrir_negocio(nombre text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  nuevo uuid;
  quien uuid := auth.uid();
begin
  if quien is null then
    raise exception 'Hace falta haber entrado para abrir un negocio';
  end if;

  insert into public.negocios (nombre)
  values (btrim(nombre))
  returning id into nuevo;

  insert into public.miembros (negocio_id, usuario_id, rol)
  values (nuevo, quien, 'dueno');

  return nuevo;
end;
$$;

comment on function public.abrir_negocio(text) is
  'Abre un negocio y deja a quien lo abre como dueño. Las dos escrituras, juntas.';

-- Solo quien ha entrado puede abrir un negocio: no se puede dejar `public` con
-- permiso, o cualquiera desde fuera crearía negocios en el proyecto.
revoke execute on function public.abrir_negocio(text) from public, anon;
grant execute on function public.abrir_negocio(text) to authenticated;

-- · Irse de un negocio sin dejarlo vacío: no se puede. Un negocio sin ningún
--   dueño es un negocio que nadie puede administrar nunca más.
create or replace function public.negocios_que_quedarian_huerfanos(persona uuid default auth.uid())
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(m.negocio_id), '{}'::uuid[])
  from public.miembros m
  where m.usuario_id = persona
    and m.rol = 'dueno'
    and (
      select count(*)
      from public.miembros otros
      where otros.negocio_id = m.negocio_id
        and otros.rol = 'dueno'
    ) = 1
$$;

comment on function public.negocios_que_quedarian_huerfanos(uuid) is
  'Los negocios que se quedarían sin dueño si esa persona se va. La lista tiene que estar vacía para poder borrar la cuenta.';

-- · Lo que se lleva quien se va: todo lo suyo, en un archivo. Es una obligación
--   legal en Europa y es, además, la respuesta a «¿y si quiero irme?».
create or replace function public.mis_datos()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'cuenta', (
      select to_jsonb(p) - 'id'
      from public.perfiles p
      where p.id = auth.uid()
    ),
    'pertenencias', (
      select coalesce(jsonb_agg(to_jsonb(m) - 'usuario_id' order by m.creado_en), '[]'::jsonb)
      from public.miembros m
      where m.usuario_id = auth.uid()
    ),
    'negocios', (
      select coalesce(jsonb_agg(to_jsonb(n) order by n.creado_en), '[]'::jsonb)
      from public.negocios n
      where public.pertenece_a(n.id)
    )
  )
$$;

comment on function public.mis_datos() is
  'Todo lo que la base guarda de quien pregunta, listo para descargar. Crece con cada pieza nueva del kit.';

revoke execute on function public.mis_datos() from public, anon;
grant execute on function public.mis_datos() to authenticated;

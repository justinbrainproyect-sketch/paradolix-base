-- ═══════════════════════════════════════════════════════════════════════════
-- 0002 · Las funciones de dentro no son puertas.
--
-- La primera migración dejó un aviso del auditor de seguridad, y diez de sus
-- consecuencias. El motivo es cómo funciona Supabase por defecto: **todas las
-- funciones del esquema `public` quedan publicadas como una dirección más de la
-- API** (`/rest/v1/rpc/nombre`). O sea que funciones que escribí para que las
-- usaran las reglas de la base de datos —y no el navegador— estaban, además,
-- disponibles para cualquiera que supiera su nombre.
--
-- No llegaban a filtrar nada (solo contestan sobre quien pregunta), pero una
-- puerta abierta de más tiene dos costes que sí importan: es superficie de ataque
-- y, sobre todo, **tapa los avisos de verdad**. Un auditor con diez avisos fijos
-- deja de leerse.
--
-- La solución es la que usa cualquier base ordenada: **lo de dentro vive en un
-- esquema que no está publicado** (`privado`), y solo se le da permiso a quien lo
-- necesita. Así estas funciones siguen siendo el motor de las reglas de acceso,
-- pero han dejado de ser una puerta.
--
-- Y una se quedó abierta del todo de la primera vez: `negocios_que_quedarian_
-- huerfanos` conservó el permiso de fábrica porque me faltó quitárselo. Se cierra
-- aquí.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ───────────────────────────────────────────────────────────────────────────
-- 1 · El cuarto de dentro
--
-- Fuera del esquema `public`, la API no publica nada de aquí. Importa que quede
-- escrito lo que es, porque dentro de seis meses la tentación será mover algo
-- aquí «para que no se vea» sin entender por qué.
-- ───────────────────────────────────────────────────────────────────────────
create schema if not exists privado;

comment on schema privado is
  'Funciones de uso interno (motor de las reglas de acceso, disparadores). No está publicado en la API a propósito: lo que vive aquí no es una puerta.';

-- El esquema nace sin permiso para nadie, y así se queda: se concede caso por
-- caso, solo lo imprescindible.
revoke all on schema privado from public;

-- ───────────────────────────────────────────────────────────────────────────
-- 2 · Las dos preguntas de las reglas, en su sitio definitivo
--
-- Tienen que poder ejecutarse como quien pregunta, porque las evalúan las reglas
-- de acceso en cada lectura. Por eso se les concede a `authenticated` y a `anon`:
-- sin el permiso, una consulta fallaría con un error en lugar de devolver nada, y
-- un error en el sitio equivocado se convierte en una pantalla rota.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function privado.papel_en(negocio uuid)
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

create or replace function privado.pertenece_a(negocio uuid)
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

grant usage on schema privado to anon, authenticated;
grant execute on function privado.papel_en(uuid) to anon, authenticated;
grant execute on function privado.pertenece_a(uuid) to anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 3 · El disparador de las cuentas nuevas, también dentro
--
-- Es el que crea el perfil cuando alguien se registra. No lo llama nadie a mano
-- —lo llama la base al crear la cuenta—, así que no tiene ningún sentido que
-- estuviera publicado.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function privado.crear_perfil_al_entrar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (
    new.id,
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
  for each row execute function privado.crear_perfil_al_entrar();

-- ───────────────────────────────────────────────────────────────────────────
-- 4 · Las reglas, apuntando al sitio nuevo
--
-- Se rehacen una a una porque una regla guarda el nombre completo de la función
-- que usa. Sin esto, al borrar las de `public` dejarían de encontrar a nadie y
-- **toda lectura pasaría a estar prohibida**, incluida la tuya.
-- ───────────────────────────────────────────────────────────────────────────
drop policy if exists negocios_se_ven_los_de_dentro on public.negocios;
create policy negocios_se_ven_los_de_dentro
  on public.negocios for select
  to authenticated
  using (privado.pertenece_a(id));

drop policy if exists negocios_los_cambia_quien_manda on public.negocios;
create policy negocios_los_cambia_quien_manda
  on public.negocios for update
  to authenticated
  using (privado.papel_en(id) in ('dueno', 'admin'))
  with check (privado.papel_en(id) in ('dueno', 'admin'));

drop policy if exists negocios_solo_el_dueno_lo_cierra on public.negocios;
create policy negocios_solo_el_dueno_lo_cierra
  on public.negocios for delete
  to authenticated
  using (privado.papel_en(id) = 'dueno');

drop policy if exists miembros_los_ve_el_negocio on public.miembros;
create policy miembros_los_ve_el_negocio
  on public.miembros for select
  to authenticated
  using (privado.pertenece_a(negocio_id));

drop policy if exists miembros_los_mueve_el_dueno on public.miembros;
create policy miembros_los_mueve_el_dueno
  on public.miembros for update
  to authenticated
  using (privado.papel_en(negocio_id) = 'dueno')
  with check (privado.papel_en(negocio_id) = 'dueno');

drop policy if exists miembros_los_quita_el_dueno on public.miembros;
create policy miembros_los_quita_el_dueno
  on public.miembros for delete
  to authenticated
  using (privado.papel_en(negocio_id) = 'dueno');

-- La de los perfiles no usa ninguna de las dos: se queda como estaba.

-- ───────────────────────────────────────────────────────────────────────────
-- 5 · Y ahora sí, se cierran las puertas de `public`
-- ───────────────────────────────────────────────────────────────────────────
drop function if exists public.papel_en(uuid);
drop function if exists public.pertenece_a(uuid);
drop function if exists public.crear_perfil_al_entrar();

-- Esta no se mueve: la llama la aplicación para avisar antes de borrar una cuenta
-- («vas a dejar este negocio sin dueño»), así que tiene que estar publicada. Lo
-- que sí se cierra es su permiso de fábrica, que se quedó abierto en la primera
-- migración: solo quien ha entrado puede preguntarlo.
revoke execute on function public.negocios_que_quedarian_huerfanos(uuid) from public, anon;
grant execute on function public.negocios_que_quedarian_huerfanos(uuid) to authenticated;

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- Lo que el auditor seguirá diciendo, y por qué está bien
--
-- Después de esto, sus avisos se reducen a las funciones que la aplicación llama
-- **a propósito** desde el navegador, porque son su forma de pedir algo que la
-- base no deja hacer a mano:
--
--   · `abrir_negocio`  — abrir un negocio y quedar dentro como dueño, en un paso.
--   · `mis_datos`      — lo que la base guarda de quien lo pide, para descargarlo.
--   · `negocios_que_quedarian_huerfanos` — el aviso de antes de borrar la cuenta.
--
-- Son tres avisos intencionados y están escritos aquí para que el día que
-- aparezca un cuarto se note: una lista corta y explicada es un auditor que sirve,
-- una lista larga y sin explicar es un auditor que se ignora.
-- ═══════════════════════════════════════════════════════════════════════════

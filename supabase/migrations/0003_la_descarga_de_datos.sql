-- ═══════════════════════════════════════════════════════════════════════════
-- 0003 · La descarga de datos apuntaba a una puerta que ya no existe.
--
-- La migración anterior movió las dos funciones internas a `privado` y volvió a
-- escribir todas **las reglas** de acceso para que apuntaran al sitio nuevo. Se
-- olvidó una cosa: `mis_datos` también llamaba a una de ellas, y esa llamada no
-- se revisó. Al borrar la de `public`, la descarga se quedó señalando al vacío.
--
-- Es el fallo que menos se nota de todos los posibles, porque no rompe nada hasta
-- que alguien lo usa: la aplicación funciona, las cuentas funcionan, y solo el día
-- que alguien pide sus datos aparece un error. Apareció en la prueba de la
-- migración siguiente, que es exactamente para lo que está: se crean dos cuentas
-- de verdad y se recorre todo lo que hace la gente.
--
-- La lección, que vale para cada migración de este kit: **mover una función es
-- buscar todos los sitios que la llaman**, y no solo los permisos.
--
-- Se puede aplicar las veces que haga falta.
-- ═══════════════════════════════════════════════════════════════════════════

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
      where privado.pertenece_a(n.id)
    )
  )
$$;

comment on function public.mis_datos() is
  'Todo lo que la base guarda de quien pregunta, listo para descargar. Crece con cada pieza nueva del kit.';

-- Y se vuelven a dejar sus permisos como estaban: solo para quien ha entrado,
-- porque `create or replace` no toca los permisos, pero dejarlo escrito aquí evita
-- que la próxima persona tenga que averiguarlo.
revoke execute on function public.mis_datos() from public, anon;
grant execute on function public.mis_datos() to authenticated;

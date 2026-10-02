-- Permitir borrar guiones desde el panel (botón Eliminar en Producción).
-- Solo usuarios autenticados (el proyecto tiene únicamente 2: Jennifer y Paco;
-- anon no tiene ningún permiso sobre guiones). Al borrar un guion se borran
-- también sus publicaciones (on delete cascade).

grant delete on public.guiones to authenticated;

create policy "autenticados borran guiones"
  on public.guiones for delete to authenticated using (true);

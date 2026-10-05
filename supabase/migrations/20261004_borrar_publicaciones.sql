-- Permite al panel (usuario autenticado) quitar publicaciones del calendario.
create policy "autenticados borran publicaciones" on public.publicaciones
  for delete to authenticated using (true);

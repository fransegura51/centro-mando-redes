-- El panel puede marcar a mano una red como publicada creando la fila directamente en
-- estado 'publicado' (antes la regla solo permitía 'pendiente' y 'manual' al insertar).
drop policy if exists "autenticados programan publicaciones" on public.publicaciones;
create policy "autenticados programan publicaciones" on public.publicaciones
  for insert to authenticated
  with check (estado = any (array['pendiente','manual','publicado']));

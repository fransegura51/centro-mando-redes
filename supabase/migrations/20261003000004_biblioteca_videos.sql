-- Biblioteca de vídeos en el panel: los usuarios autenticados (Jennifer y Paco) pueden
-- subir, sobrescribir y borrar vídeos del bucket privado `videos-editados`.
-- (Ya existía la política de lectura.) Los vídeos son G-###.mp4, máximo 50 MB.

create policy "autenticados suben videos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'videos-editados');

create policy "autenticados reemplazan videos"
  on storage.objects for update to authenticated
  using (bucket_id = 'videos-editados')
  with check (bucket_id = 'videos-editados');

create policy "autenticados borran videos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'videos-editados');

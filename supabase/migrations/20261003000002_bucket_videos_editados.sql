-- Fase 2: almacenamiento privado de los vídeos editados (plan Free: 1 GB).
-- Solo usuarios autenticados pueden leerlos (para reproducirlos en el panel con
-- URL firmada); solo la service role (script local) escribe.

insert into storage.buckets (id, name, public, file_size_limit)
values ('videos-editados', 'videos-editados', false, 52428800)
on conflict (id) do nothing;

create policy "autenticados ven videos editados"
  on storage.objects for select to authenticated
  using (bucket_id = 'videos-editados');

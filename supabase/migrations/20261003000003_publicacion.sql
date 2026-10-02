-- Fases 3-6: programar y publicar desde el panel.
-- El panel (usuarios autenticados) puede crear publicaciones pendientes/manuales
-- y marcar las manuales (TikTok) como publicadas. Publicar de verdad lo hace
-- solo la función `publicar` con la service role.

-- Estado intermedio para que dos ejecuciones del cron no publiquen lo mismo.
alter table public.publicaciones drop constraint if exists publicaciones_estado_check;
alter table public.publicaciones add constraint publicaciones_estado_check
  check (estado in ('pendiente','publicando','publicado','error','manual'));

create policy "autenticados programan publicaciones"
  on public.publicaciones for insert to authenticated
  with check (estado in ('pendiente','manual'));

create policy "autenticados actualizan publicaciones"
  on public.publicaciones for update to authenticated
  using (estado in ('pendiente','manual','error'))
  with check (estado in ('pendiente','manual','publicado'));

grant insert (guion_id, plataforma, ruta_video, programado_para, estado)
  on public.publicaciones to authenticated;
grant update (estado, publicado_en, url_publicada, programado_para)
  on public.publicaciones to authenticated;

-- Permite al panel crear la ficha de un guion cuando se sube un vídeo suelto
-- (el panel le asigna el siguiente código G-### libre).
create policy "autenticados crean guiones" on public.guiones
  for insert to authenticated with check (true);

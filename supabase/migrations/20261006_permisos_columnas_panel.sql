-- Permisos por columna que el panel necesita:
--  * marcar a mano una red como publicada crea la fila con publicado_en
--  * subir un vídeo suelto crea la ficha del guion
grant insert (publicado_en) on public.publicaciones to authenticated;
--  * quitar una marca o eliminar una fila del calendario borra la publicación
grant delete on public.publicaciones to authenticated;
grant insert (codigo, titulo, guion, prompt_flow, personajes, fotogramas_notas, hashtags, texto_publicacion, estado)
  on public.guiones to authenticated;

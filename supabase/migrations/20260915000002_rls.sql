-- Centro de Mando Redes — paso 1: seguridad (RLS)
-- Regla: solo usuarios autenticados leen; solo la service role escribe.
-- La service role salta RLS, así que no necesita políticas.
-- Sin política de insert/update/delete, ningún cliente puede escribir.

alter table public.cuentas          enable row level security;
alter table public.tokens           enable row level security;
alter table public.metricas_diarias enable row level security;
alter table public.videos           enable row level security;

-- Lectura para usuarios autenticados (Jennifer y Paco).
create policy "autenticados leen cuentas"
  on public.cuentas for select
  to authenticated
  using (true);

create policy "autenticados leen metricas_diarias"
  on public.metricas_diarias for select
  to authenticated
  using (true);

create policy "autenticados leen videos"
  on public.videos for select
  to authenticated
  using (true);

-- tokens: sin políticas. Además se retiran los permisos a los roles del cliente
-- para que ni siquiera aparezca en la API aunque alguien añadiera una política por error.
revoke all on table public.tokens from anon, authenticated;

-- anon (sin sesión) no debe ver nada en ninguna tabla.
revoke all on table public.cuentas, public.metricas_diarias, public.videos from anon;

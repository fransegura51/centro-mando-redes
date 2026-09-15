-- Centro de Mando Redes — paso 3: cron diario que llama a sync-youtube
-- Pegar en el SQL Editor del dashboard DESPUÉS de desplegar la función sync-youtube
-- y de crear el secreto CRON_SECRET en Edge Functions → Secrets.
--
-- ANTES DE EJECUTAR: sustituye PEGA_AQUI_EL_CRON_SECRET por el mismo valor
-- que pusiste en el secreto CRON_SECRET de las Edge Functions.

begin;

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- El secreto se guarda cifrado en Vault, no en texto plano dentro del cron.
select vault.create_secret('PEGA_AQUI_EL_CRON_SECRET', 'cron_secret', 'Cabecera x-cron-secret de las Edge Functions');

-- Todos los días a las 05:00 UTC (06:00 en invierno, 07:00 en verano, hora de España).
-- YouTube Analytics cierra los datos del día con 2-3 días de retraso, así que la
-- función pide siempre los últimos 10 días y va rellenando.
select cron.schedule(
  'sync-youtube-diario',
  '0 5 * * *',
  $$
  select net.http_post(
    url := 'https://hahszmdfblcvljzanvoq.supabase.co/functions/v1/sync-youtube',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{"origen":"cron"}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Registro en el historial de migraciones.
insert into supabase_migrations.schema_migrations (version, name) values
  ('20260915000003', 'cron_youtube')
on conflict (version) do nothing;

commit;

-- Comprobación (ejecutar aparte): debe salir una fila con jobname = sync-youtube-diario
-- select jobid, jobname, schedule, active from cron.job;

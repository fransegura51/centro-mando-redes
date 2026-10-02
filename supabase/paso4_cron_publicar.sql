-- Cron que llama a la función `publicar` cada 5 minutos.
-- Pegar en el SQL Editor DESPUÉS de desplegar la función `publicar`.
-- Reutiliza el secreto `cron_secret` que ya está en Vault (paso3_cron.sql).

select cron.schedule(
  'publicar-cada-5-min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://hahszmdfblcvljzanvoq.supabase.co/functions/v1/publicar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{"origen":"cron"}'::jsonb,
    timeout_milliseconds := 150000
  );
  $$
);

-- Comprobación (aparte): debe salir una fila con jobname = publicar-cada-5-min
-- select jobid, jobname, schedule, active from cron.job;

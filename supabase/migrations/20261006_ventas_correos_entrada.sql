alter table public.ventas_correos
  add column if not exists direccion text not null default 'salida',
  add column if not exists message_id text,
  add column if not exists remitente_email text;
create unique index if not exists ventas_correos_message_id_uidx on public.ventas_correos (message_id) where message_id is not null;
-- estado: borrador | enviado | respondido | pendiente_ti (necesita respuesta del dueño) | recibido

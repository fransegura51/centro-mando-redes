-- Centro de mando de ventas (Pepo): contactos y correos
create table if not exists public.ventas_contactos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nicho text not null default 'otros',          -- ampa | familias_numerosas | crianza | custodia | otros
  email text,
  web text,
  fuente text,                                  -- de dónde sale el contacto (URL pública)
  estado text not null default 'por_contactar', -- por_contactar | contactado | respondio | interesado | no_interesa | baja
  notas text,
  creado_en timestamptz not null default now()
);
create table if not exists public.ventas_correos (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid references public.ventas_contactos(id) on delete set null,
  para_nombre text,
  para_email text,
  remitente text,
  asunto text not null,
  cuerpo text,
  estado text not null default 'borrador',      -- borrador | enviado | respondido
  enviado_en timestamptz,
  respuesta text,
  respuesta_en timestamptz,
  creado_en timestamptz not null default now()
);
alter table public.ventas_contactos enable row level security;
alter table public.ventas_correos enable row level security;
create policy "autenticados gestionan ventas contactos" on public.ventas_contactos for all to authenticated using (true) with check (true);
create policy "autenticados gestionan ventas correos" on public.ventas_correos for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.ventas_contactos, public.ventas_correos to authenticated;

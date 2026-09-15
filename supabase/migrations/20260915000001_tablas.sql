-- Centro de Mando Redes — paso 1: tablas base
-- Una fila por red conectada (youtube, instagram, facebook, tiktok).

create table public.cuentas (
  id            uuid primary key default gen_random_uuid(),
  red           text not null check (red in ('youtube', 'instagram', 'facebook', 'tiktok')),
  nombre_cuenta text,
  id_externo    text,
  activa        boolean not null default true,
  ultima_sync   timestamptz,
  error_sync    text,
  creado        timestamptz not null default now(),
  -- Solo una cuenta por red
  constraint cuentas_red_unica unique (red)
);

comment on table public.cuentas is 'Cuentas conectadas, una fila por red social.';

-- Tokens OAuth. Solo la service role los lee y escribe (ver migración de RLS).
create table public.tokens (
  cuenta_id     uuid primary key references public.cuentas (id) on delete cascade,
  access_token  text,
  refresh_token text,
  expira        timestamptz,
  actualizado   timestamptz not null default now()
);

comment on table public.tokens is 'Tokens OAuth por cuenta. Nunca accesibles desde el cliente.';

-- Foto diaria de cada cuenta.
create table public.metricas_diarias (
  cuenta_id       uuid not null references public.cuentas (id) on delete cascade,
  fecha           date not null,
  seguidores      integer,
  visitas         integer,
  visualizaciones integer,
  likes           integer,
  comentarios     integer,
  compartidos     integer,
  alcance         integer,
  extra           jsonb,
  primary key (cuenta_id, fecha)
);

comment on table public.metricas_diarias is 'Métricas agregadas por cuenta y día.';
comment on column public.metricas_diarias.extra is 'Campos propios de cada red (ingresos, guardados, etc.).';

-- Contenido publicado (vídeo, reel, post).
create table public.videos (
  id              uuid primary key default gen_random_uuid(),
  cuenta_id       uuid not null references public.cuentas (id) on delete cascade,
  id_externo      text not null,
  titulo          text,
  url             text,
  miniatura       text,
  publicado       timestamptz,
  tipo            text,
  visualizaciones integer,
  likes           integer,
  comentarios     integer,
  compartidos     integer,
  retencion_pct   numeric,
  extra           jsonb,
  actualizado     timestamptz not null default now(),
  constraint videos_cuenta_externo_unico unique (cuenta_id, id_externo)
);

comment on table public.videos is 'Contenidos publicados en cada cuenta con sus métricas actuales.';

-- Índices para las consultas del panel (evolución por fecha y ranking por visualizaciones).
create index metricas_diarias_fecha_idx on public.metricas_diarias (fecha desc);
create index videos_publicado_idx on public.videos (cuenta_id, publicado desc);
create index videos_visualizaciones_idx on public.videos (visualizaciones desc nulls last);

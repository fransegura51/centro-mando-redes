-- Estudio de contenido, fase 1: guiones y publicaciones.
-- Lectura para usuarios autenticados. En guiones solo se pueden actualizar
-- columnas concretas desde el panel (aprobar/rechazar/editar); insertar y
-- borrar lo hace únicamente la service role (Claude por SQL, scripts).

create table public.guiones (
  id                 uuid primary key default gen_random_uuid(),
  codigo             text not null unique,            -- G-001, G-002…
  titulo             text not null,
  guion              text not null,
  prompt_flow        text not null,
  personajes         text[] not null default '{}',
  fotogramas_notas   text,
  hashtags           text,
  texto_publicacion  text,
  estado             text not null default 'borrador'
    check (estado in ('borrador','aprobado_guion','video_subido',
      'pendiente_revision','aprobado_publicar','publicado','rechazado')),
  motivo_rechazo     text,
  creado_en          timestamptz not null default now()
);

create table public.publicaciones (
  id               uuid primary key default gen_random_uuid(),
  guion_id         uuid not null references public.guiones(id) on delete cascade,
  ruta_video       text,                               -- ruta en Storage
  programado_para  timestamptz,                        -- se muestra en Europe/Madrid
  plataforma       text not null
    check (plataforma in ('youtube','instagram','facebook','tiktok')),
  estado           text not null default 'pendiente'
    check (estado in ('pendiente','publicado','error','manual')),
  id_externo       text,
  url_publicada    text,
  error_texto      text,
  publicado_en     timestamptz
);

create index on public.publicaciones (guion_id);
create index on public.publicaciones (estado, programado_para);

alter table public.guiones        enable row level security;
alter table public.publicaciones  enable row level security;

revoke all on table public.guiones, public.publicaciones from anon;

create policy "autenticados leen guiones"
  on public.guiones for select to authenticated using (true);

create policy "autenticados actualizan guiones"
  on public.guiones for update to authenticated using (true) with check (true);

create policy "autenticados leen publicaciones"
  on public.publicaciones for select to authenticated using (true);

-- Solo estas columnas son editables desde el panel.
revoke insert, update, delete on public.guiones from authenticated;
grant update (titulo, guion, prompt_flow, hashtags, texto_publicacion,
              estado, motivo_rechazo) on public.guiones to authenticated;
revoke insert, update, delete on public.publicaciones from authenticated;

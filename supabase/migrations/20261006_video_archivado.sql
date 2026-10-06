alter table public.guiones add column if not exists video_archivado boolean not null default false;
grant update (video_archivado) on public.guiones to authenticated;

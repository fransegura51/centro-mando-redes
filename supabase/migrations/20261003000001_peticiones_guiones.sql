-- Botón "Generar guiones" de Producción: el panel solo deja una petición
-- (cuántos guiones quiere el usuario). Claude las atiende en una sesión de
-- Claude Code (coste cero: no hay llamadas a ninguna API de IA de pago).

create table public.peticiones_guiones (
  id         uuid primary key default gen_random_uuid(),
  cantidad   int not null check (cantidad between 1 and 14),
  estado     text not null default 'pendiente' check (estado in ('pendiente','atendida')),
  creada_en  timestamptz not null default now(),
  atendida_en timestamptz
);

alter table public.peticiones_guiones enable row level security;

revoke all on table public.peticiones_guiones from anon;
revoke all on table public.peticiones_guiones from authenticated;

create policy "autenticados leen peticiones"
  on public.peticiones_guiones for select to authenticated using (true);

create policy "autenticados crean peticiones"
  on public.peticiones_guiones for insert to authenticated
  with check (estado = 'pendiente');

grant select on public.peticiones_guiones to authenticated;
grant insert (cantidad) on public.peticiones_guiones to authenticated;

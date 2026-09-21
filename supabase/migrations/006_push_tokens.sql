-- Push-tokenit omaan tauluun. Aiemmin users.push_token oli luettavissa kaikille
-- kirjautuneille (laaja select-policy), mikä vuoti tokenit. Nyt token näkyy vain
-- omistajalle, ja lähetys tapahtuu palvelimella (send-push Edge Function).

create table if not exists public.user_devices (
  user_id    uuid primary key references public.users(id) on delete cascade,
  push_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.user_devices enable row level security;

-- Vain omistaja näkee ja hallitsee oman tokeninsa. Muut eivät näe mitään;
-- send-push lukee tokenit service_rolella ohittaen RLS:n.
drop policy if exists "Manage own device" on public.user_devices;
create policy "Manage own device" on public.user_devices for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Siirrä olemassa olevat tokenit ja poista sarake users-taulusta.
insert into public.user_devices (user_id, push_token)
  select id, push_token from public.users
  where push_token is not null and push_token <> ''
on conflict (user_id) do update set push_token = excluded.push_token;

alter table public.users drop column if exists push_token;

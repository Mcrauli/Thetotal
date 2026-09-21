-- HUOM: Tämä migraatio on REKONSTRUOITU koodin käytöstä, ei tuotannon skeemasta.
-- Sarakkeiden tyypit, oletukset ja rajoitteet ovat parhaita arvauksia.
-- VALIDOI elävää kantaa vasten ennen kuin luotat tähän puhtaan projektin pohjana:
--   npx supabase link --project-ref iixxsojjeaebhwsnzskl
--   npx supabase db diff --linked --schema public
-- Jos diff näyttää eroja users-/friend_challenges-tauluissa, korjaa ne tähän.

-- --- users: Dashboardissa lisätyt sarakkeet ---
alter table public.users
  add column if not exists bodyweight_kg numeric,
  add column if not exists gender        text,
  add column if not exists sbd_rank      text,
  add column if not exists sbd_total     numeric not null default 0,
  add column if not exists hide_sbd      boolean not null default false,
  add column if not exists hide_weight   boolean not null default false,
  add column if not exists onboarded     boolean not null default false;

-- --- friend_challenges: kaverihaasteet (paino / volyymi / treenimäärä) ---
create table if not exists public.friend_challenges (
  id               uuid primary key default gen_random_uuid(),
  challenger_id    uuid not null references public.users(id) on delete cascade,
  challenged_id    uuid not null references public.users(id) on delete cascade,
  exercise_name    text,
  target_weight    numeric,
  message          text,
  challenge_type   text,
  duration_days    int,
  challenger_value numeric,
  challenged_value numeric,
  status           text not null default 'pending',
  created_at       timestamptz not null default now(),
  check (challenger_id <> challenged_id)
);
create index if not exists idx_friend_challenges_challenger on public.friend_challenges(challenger_id);
create index if not exists idx_friend_challenges_challenged on public.friend_challenges(challenged_id);

alter table public.friend_challenges enable row level security;

drop policy if exists "Read own challenges" on public.friend_challenges;
create policy "Read own challenges" on public.friend_challenges for select
  to authenticated using (auth.uid() = challenger_id or auth.uid() = challenged_id);

drop policy if exists "Insert own challenge" on public.friend_challenges;
create policy "Insert own challenge" on public.friend_challenges for insert
  to authenticated with check (auth.uid() = challenger_id);

drop policy if exists "Update involved challenge" on public.friend_challenges;
create policy "Update involved challenge" on public.friend_challenges for update
  to authenticated
  using (auth.uid() = challenger_id or auth.uid() = challenged_id)
  with check (auth.uid() = challenger_id or auth.uid() = challenged_id);

drop policy if exists "Delete involved challenge" on public.friend_challenges;
create policy "Delete involved challenge" on public.friend_challenges for delete
  to authenticated using (auth.uid() = challenger_id or auth.uid() = challenged_id);

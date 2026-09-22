-- Sarakkeet jotka lisättiin tuotantoon Dashboardin kautta 001:n jälkeen.
-- Koottu tähän jotta puhdas projekti saa saman skeeman. Idempotentti.

-- exercises: lihasryhmä (suomeksi)
alter table public.exercises
  add column if not exists muscle_group text;

-- workout_sets: vapaaehtoinen RPE 1-10
alter table public.workout_sets
  add column if not exists rpe smallint check (rpe is null or (rpe >= 1 and rpe <= 10));

-- personal_records: kaverin vahvistama vs. itse ilmoitettu
alter table public.personal_records
  add column if not exists verified boolean not null default true;

-- users: push-token
alter table public.users
  add column if not exists push_token text;

-- Korvaa 001:n väljä update-policy.
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- muut käyttäjät näkevät profiilit (kaverit, leaderboard, PR-feed)
drop policy if exists "Users can read own profile" on public.users;
create policy "Authenticated can read profiles" on public.users for select
  to authenticated using (true);

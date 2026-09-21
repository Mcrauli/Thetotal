-- Kaverit, treenipohjat ja haasteet. Luotu alun perin Dashboardissa; koottu tähän.

-- Kaverisuhteet (pending/accepted)
create table if not exists public.friendships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  friend_id  uuid not null references public.users(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique(user_id, friend_id),
  check (user_id <> friend_id)
);
create index if not exists idx_friendships_user on public.friendships(user_id);
create index if not exists idx_friendships_friend on public.friendships(friend_id);

alter table public.friendships enable row level security;

drop policy if exists "Read own friendships" on public.friendships;
create policy "Read own friendships" on public.friendships for select
  to authenticated using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "Insert own friend request" on public.friendships;
create policy "Insert own friend request" on public.friendships for insert
  to authenticated with check (auth.uid() = user_id);

drop policy if exists "Update involved friendship" on public.friendships;
create policy "Update involved friendship" on public.friendships for update
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id)
  with check (auth.uid() = user_id or auth.uid() = friend_id);

-- Lukitse identiteettisarakkeet ja salli vain pending -> accepted -siirto,
-- jonka tekee vain pyynnön vastaanottaja (friend_id).
create or replace function public.guard_friendship_update()
returns trigger language plpgsql as $$
begin
  if new.user_id <> old.user_id or new.friend_id <> old.friend_id then
    raise exception 'Cannot change friendship identity columns';
  end if;
  if new.status <> old.status
     and not (old.status = 'pending' and new.status = 'accepted' and auth.uid() = old.friend_id) then
    raise exception 'Invalid friendship status transition';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_friendship_update on public.friendships;
create trigger trg_guard_friendship_update
  before update on public.friendships
  for each row execute function public.guard_friendship_update();

drop policy if exists "Delete involved friendship" on public.friendships;
create policy "Delete involved friendship" on public.friendships for delete
  to authenticated using (auth.uid() = user_id or auth.uid() = friend_id);

-- Treenipohjat
create table if not exists public.workout_templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_workout_templates_user on public.workout_templates(user_id);

alter table public.workout_templates enable row level security;

drop policy if exists "Read templates" on public.workout_templates;
create policy "Read templates" on public.workout_templates for select
  to authenticated using (true);

drop policy if exists "Manage own templates" on public.workout_templates;
create policy "Manage own templates" on public.workout_templates for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Pohjan liikkeet
create table if not exists public.template_exercises (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  order_index int not null default 0
);
create index if not exists idx_template_exercises_template on public.template_exercises(template_id);

alter table public.template_exercises enable row level security;

drop policy if exists "Read template exercises" on public.template_exercises;
create policy "Read template exercises" on public.template_exercises for select
  to authenticated using (true);

drop policy if exists "Manage own template exercises" on public.template_exercises;
create policy "Manage own template exercises" on public.template_exercises for all
  to authenticated using (
    auth.uid() = (select user_id from public.workout_templates where id = template_id)
  ) with check (
    auth.uid() = (select user_id from public.workout_templates where id = template_id)
  );

-- Viikkohaasteisiin liittyminen
create table if not exists public.user_challenges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  challenge_id text not null,
  created_at   timestamptz not null default now(),
  unique(user_id, challenge_id)
);
create index if not exists idx_user_challenges_user on public.user_challenges(user_id);

alter table public.user_challenges enable row level security;

drop policy if exists "Read challenges" on public.user_challenges;
create policy "Read challenges" on public.user_challenges for select
  to authenticated using (true);

drop policy if exists "Manage own challenges" on public.user_challenges;
create policy "Manage own challenges" on public.user_challenges for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

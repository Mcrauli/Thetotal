create extension if not exists "pgcrypto";

create table public.users (
  id                uuid primary key references auth.users(id) on delete cascade,
  username          text unique not null,
  bio               text default '',
  avatar_url        text default '',
  xp                int not null default 0,
  rank              text not null default 'Iron',
  streak            int not null default 0,
  last_workout_date date,
  created_at        timestamptz not null default now()
);

alter table public.users enable row level security;
create policy "Users can read own profile"   on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

create table public.exercises (
  id       uuid primary key default gen_random_uuid(),
  name     text unique not null,
  category text not null check (category in ('powerlifting', 'accessory')),
  is_sbd   boolean not null default false
);

alter table public.exercises enable row level security;
create policy "Anyone can read exercises" on public.exercises for select using (true);

create table public.workouts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  name             text not null default 'Workout',
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  total_volume_kg  numeric not null default 0
);

alter table public.workouts enable row level security;
create policy "Users manage own workouts" on public.workouts for all using (auth.uid() = user_id);

create table public.workout_sets (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  set_number  int not null,
  weight_kg   numeric not null,
  reps        int not null,
  is_pr       boolean not null default false
);

alter table public.workout_sets enable row level security;
create policy "Users manage own sets" on public.workout_sets for all
  using (auth.uid() = (select user_id from public.workouts where id = workout_id));

create table public.personal_records (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  weight_kg   numeric not null,
  reps        int not null,
  recorded_at timestamptz not null default now(),
  unique(user_id, exercise_id)
);

alter table public.personal_records enable row level security;
create policy "Users manage own PRs" on public.personal_records for all using (auth.uid() = user_id);

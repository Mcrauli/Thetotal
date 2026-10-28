alter table public.workout_sets
  add column if not exists duration_s numeric check (duration_s is null or duration_s >= 0),
  add column if not exists distance_m numeric check (distance_m is null or distance_m >= 0),
  add column if not exists form smallint check (form is null or form between 1 and 5);

insert into public.exercises (name, muscle_group, is_sbd)
select v.name, 'Voimamies', false
from (values
  ('Super Yoke'), ('Truck Pull'), ('Arm Over Arm Pull'),
  ('Farmers Hold'), ('Frame Hold'), ('Axle Hold'), ('Dinnie Stones Hold'),
  ('Fingal''s Fingers'), ('Sandbag Load Series'), ('Keg Load Series')
) as v(name)
where not exists (select 1 from public.exercises e where e.name = v.name);

create table if not exists public.exercise_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  note text not null check (char_length(note) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists exercise_notes_user_ex_idx on public.exercise_notes (user_id, exercise_id, created_at desc);
alter table public.exercise_notes enable row level security;
drop policy if exists exercise_notes_own on public.exercise_notes;
create policy exercise_notes_own on public.exercise_notes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.exercise_notes from anon;
grant select, insert, update, delete on public.exercise_notes to authenticated;

create table if not exists public.strength_seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  start_date date not null default current_date,
  target_date date not null,
  goal_squat numeric check (goal_squat is null or goal_squat > 0),
  goal_bench numeric check (goal_bench is null or goal_bench > 0),
  goal_deadlift numeric check (goal_deadlift is null or goal_deadlift > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (target_date >= start_date)
);
create unique index if not exists strength_seasons_one_active on public.strength_seasons (user_id) where active;
alter table public.strength_seasons enable row level security;
drop policy if exists strength_seasons_own on public.strength_seasons;
create policy strength_seasons_own on public.strength_seasons for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.strength_seasons from anon;
grant select, insert, update, delete on public.strength_seasons to authenticated;

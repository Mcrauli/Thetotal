-- Moderointi: ilmiannot ja estot (Apple Guideline 1.2 UGC-vaatimus).

-- Ilmiannot
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_type text not null check (target_type in ('comment', 'user', 'pr')),
  target_id   uuid not null,
  reason      text not null check (length(reason) > 0 and length(reason) <= 500),
  status      text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at  timestamptz default now()
);
create index if not exists idx_reports_target on public.reports(target_type, target_id);
create index if not exists idx_reports_status on public.reports(status);

alter table public.reports enable row level security;
drop policy if exists "Insert own reports" on public.reports;
create policy "Insert own reports" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
drop policy if exists "Read own reports" on public.reports;
create policy "Read own reports" on public.reports for select to authenticated using (auth.uid() = reporter_id);

-- Estot
create table if not exists public.blocks (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists idx_blocks_blocker on public.blocks(blocker_id);
create index if not exists idx_blocks_blocked on public.blocks(blocked_id);

alter table public.blocks enable row level security;
drop policy if exists "Read own blocks" on public.blocks;
create policy "Read own blocks" on public.blocks for select to authenticated using (auth.uid() = blocker_id);
drop policy if exists "Insert own blocks" on public.blocks;
create policy "Insert own blocks" on public.blocks for insert to authenticated with check (auth.uid() = blocker_id);
drop policy if exists "Delete own blocks" on public.blocks;
create policy "Delete own blocks" on public.blocks for delete to authenticated using (auth.uid() = blocker_id);

-- Kun käyttäjä estää toisen, poistetaan mahdollinen ystävyys
create or replace function public.remove_friendship_on_block()
returns trigger language plpgsql security definer as $$
begin
  delete from public.friendships
  where (user_id = new.blocker_id and friend_id = new.blocked_id)
     or (user_id = new.blocked_id and friend_id = new.blocker_id);
  return new;
end;
$$;

drop trigger if exists trg_block_removes_friendship on public.blocks;
create trigger trg_block_removes_friendship
  after insert on public.blocks
  for each row execute function public.remove_friendship_on_block();

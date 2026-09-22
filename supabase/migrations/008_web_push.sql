create table if not exists public.web_push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists web_push_subscriptions_user_idx on public.web_push_subscriptions (user_id);

alter table public.web_push_subscriptions enable row level security;

drop policy if exists "Manage own web push" on public.web_push_subscriptions;
create policy "Manage own web push" on public.web_push_subscriptions for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

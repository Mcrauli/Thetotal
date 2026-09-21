-- PR-feedin kommentit, reaktiot ja kaverivahvistukset.

-- Kommentit
create table if not exists public.pr_comments (
  id         uuid primary key default gen_random_uuid(),
  pr_id      uuid not null references public.personal_records(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  body       text not null check (length(body) > 0 and length(body) <= 500),
  created_at timestamptz default now()
);
create index if not exists idx_pr_comments_pr_id on public.pr_comments(pr_id);
create index if not exists idx_pr_comments_created_at on public.pr_comments(created_at);

alter table public.pr_comments enable row level security;
drop policy if exists "Read all comments" on public.pr_comments;
create policy "Read all comments" on public.pr_comments for select to authenticated using (true);
drop policy if exists "Insert own comments" on public.pr_comments;
create policy "Insert own comments" on public.pr_comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Delete own comments" on public.pr_comments;
create policy "Delete own comments" on public.pr_comments for delete to authenticated using (auth.uid() = user_id);

-- Reaktiot
create table if not exists public.pr_reactions (
  id         uuid primary key default gen_random_uuid(),
  pr_id      uuid not null references public.personal_records(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  emoji      text not null check (emoji in ('fire', 'muscle', 'clap', 'eyes')),
  created_at timestamptz default now(),
  unique(pr_id, user_id, emoji)
);
create index if not exists idx_pr_reactions_pr_id on public.pr_reactions(pr_id);
create index if not exists idx_pr_reactions_user_id on public.pr_reactions(user_id);

alter table public.pr_reactions enable row level security;
drop policy if exists "Read all reactions" on public.pr_reactions;
create policy "Read all reactions" on public.pr_reactions for select to authenticated using (true);
drop policy if exists "Insert own reactions" on public.pr_reactions;
create policy "Insert own reactions" on public.pr_reactions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Delete own reactions" on public.pr_reactions;
create policy "Delete own reactions" on public.pr_reactions for delete to authenticated using (auth.uid() = user_id);

-- Kaverivahvistukset (verified-sarake lisätty 002:ssa)
create table if not exists public.pr_verifications (
  id          uuid primary key default gen_random_uuid(),
  pr_id       uuid not null references public.personal_records(id) on delete cascade,
  verifier_id uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(pr_id, verifier_id)
);
create index if not exists idx_pr_verifications_pr_id on public.pr_verifications(pr_id);
create index if not exists idx_pr_verifications_verifier_id on public.pr_verifications(verifier_id);

alter table public.pr_verifications enable row level security;
drop policy if exists "Read all verifications" on public.pr_verifications;
create policy "Read all verifications" on public.pr_verifications for select to authenticated using (true);
drop policy if exists "Insert own verifications" on public.pr_verifications;
create policy "Insert own verifications" on public.pr_verifications for insert to authenticated with check (
  auth.uid() = verifier_id
  and not exists (
    select 1 from public.personal_records pr
    where pr.id = pr_id and pr.user_id = auth.uid()
  )
);
drop policy if exists "Delete own verifications" on public.pr_verifications;
create policy "Delete own verifications" on public.pr_verifications for delete to authenticated using (auth.uid() = verifier_id);

-- Kun joku vahvistaa PR:n, merkitse se vahvistetuksi
create or replace function public.verify_pr_on_insert()
returns trigger language plpgsql security definer as $$
begin
  update public.personal_records set verified = true where id = new.pr_id;
  return new;
end;
$$;

drop trigger if exists trg_verify_pr on public.pr_verifications;
create trigger trg_verify_pr
  after insert on public.pr_verifications
  for each row execute function public.verify_pr_on_insert();

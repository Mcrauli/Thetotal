-- Supporter-kertaosto. Aja Supabase SQL Editorissa.
-- is_supporter näkyy myös muille (badge), joten se on luettavissa kaikille.

alter table public.users
  add column if not exists is_supporter boolean not null default false;

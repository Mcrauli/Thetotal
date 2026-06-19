-- Supporter-kertaosto. Aja Supabase SQL Editorissa.
-- is_supporter näkyy myös muille (badge), joten se on luettavissa kaikille.

alter table public.users
  add column if not exists is_supporter boolean not null default false;

-- Estä asiakasta muuttamasta is_supporter-arvoa omalla rivillään.
-- Vain service_role (RevenueCat-webhook) saa muuttaa sitä.
-- Korvaa olemassa olevan update-policyn (permissiiviset policyt OR:ataan, joten
-- vanha väljä policy pitää pudottaa, muuten tämä ei rajoita mitään).
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_supporter is not distinct from
        (select u.is_supporter from public.users u where u.id = auth.uid())
  );

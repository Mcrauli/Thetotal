-- Kutsulinkit: jokaisella käyttäjällä on salainen kutsukoodi. Linkin avaaja
-- tulee suoraan kutsujan kaveriksi. Koodi vaaditaan, jotta kukaan ei voi
-- lisätä itseään kenenkään kaveriksi pelkän käyttäjä-id:n perusteella.

alter table public.users add column if not exists invite_code text unique;

create or replace function public.my_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select invite_code into code from public.users where id = auth.uid();
  if code is not null then
    return code;
  end if;
  loop
    code := substr(md5(random()::text || clock_timestamp()::text || auth.uid()::text), 1, 10);
    begin
      update public.users set invite_code = code where id = auth.uid();
      return code;
    exception when unique_violation then
      -- törmäys: yritä uutta koodia
    end;
  end loop;
end;
$$;

create or replace function public.invite_owner(p_code text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select username from public.users where invite_code = p_code;
$$;

create or replace function public.accept_invite(p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  inviter public.users%rowtype;
  me uuid := auth.uid();
  existing_id uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  select * into inviter from public.users where invite_code = p_code;
  if inviter.id is null then
    raise exception 'invalid invite';
  end if;
  if inviter.id = me then
    return inviter.username;
  end if;
  if exists (
    select 1 from public.blocks
    where (blocker_id = me and blocked_id = inviter.id)
       or (blocker_id = inviter.id and blocked_id = me)
  ) then
    raise exception 'blocked';
  end if;

  select id into existing_id from public.friendships
  where (user_id = inviter.id and friend_id = me)
     or (user_id = me and friend_id = inviter.id)
  limit 1;

  if existing_id is not null then
    update public.friendships set status = 'accepted' where id = existing_id;
  else
    insert into public.friendships (user_id, friend_id, status)
    values (inviter.id, me, 'accepted');
  end if;
  return inviter.username;
end;
$$;

revoke all on function public.my_invite_code() from public;
revoke all on function public.invite_owner(text) from public;
revoke all on function public.accept_invite(text) from public;
grant execute on function public.my_invite_code() to authenticated;
grant execute on function public.invite_owner(text) to anon, authenticated;
grant execute on function public.accept_invite(text) to authenticated;

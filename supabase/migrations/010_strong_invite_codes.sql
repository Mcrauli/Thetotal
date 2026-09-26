-- Kutsukoodit vahvalla satunnaisuudella (gen_random_uuid, 122 bittiä).
-- Vanhat, heikosti arvotut koodit nollataan; uusi luodaan seuraavalla jakamisella.

update public.users set invite_code = null where invite_code is not null;

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
    code := replace(gen_random_uuid()::text, '-', '');
    begin
      update public.users set invite_code = code where id = auth.uid();
      return code;
    exception when unique_violation then
    end;
  end loop;
end;
$$;

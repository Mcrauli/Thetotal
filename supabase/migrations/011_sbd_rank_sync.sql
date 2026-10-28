create or replace function public.sbd_rank_for(p_total numeric, p_bw numeric)
returns text language sql immutable as $$
  select case
    when coalesce(p_bw, 0) <= 0 or coalesce(p_total, 0) <= 0 then 'Aloittelija'
    when p_total / p_bw >= 8.75 then 'Legenda'
    when p_total / p_bw >= 8.0  then 'Maailmaluokka'
    when p_total / p_bw >= 7.5  then 'Mestari'
    when p_total / p_bw >= 6.75 then 'Eliitti'
    when p_total / p_bw >= 6.0  then 'Kansainvälinen'
    when p_total / p_bw >= 5.0  then 'Kansallinen'
    when p_total / p_bw >= 4.0  then 'Alueellinen'
    when p_total / p_bw >= 3.0  then 'Kilpailija'
    when p_total / p_bw >= 2.0  then 'Harrastaja'
    else 'Aloittelija'
  end
$$;

create or replace function public.sbd_total_for(p_user uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(m), 0) from (
    select max(pr.weight_kg) m
    from personal_records pr join exercises e on e.id = pr.exercise_id
    where pr.user_id = p_user and e.is_sbd
      and (e.name ilike '%squat%' or e.name ilike '%bench%' or e.name ilike '%deadlift%')
    group by case when e.name ilike '%squat%' then 1 when e.name ilike '%bench%' then 2 else 3 end
  ) x
$$;

create or replace function public.sync_sbd(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update users set sbd_total = public.sbd_total_for(p_user) where id = p_user;
end $$;

create or replace function public.trg_pr_sync_sbd()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_sbd(old.user_id);
    return old;
  end if;
  perform public.sync_sbd(new.user_id);
  if tg_op = 'UPDATE' and old.user_id <> new.user_id then perform public.sync_sbd(old.user_id); end if;
  return new;
end $$;

create or replace function public.trg_user_sync_sbd()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  t numeric := public.sbd_total_for(new.id);
begin
  new.sbd_total := t;
  new.sbd_rank := public.sbd_rank_for(t, new.bodyweight_kg);
  return new;
end $$;

drop trigger if exists trg_pr_sync_sbd on public.personal_records;
create trigger trg_pr_sync_sbd after insert or update or delete on public.personal_records
  for each row execute function public.trg_pr_sync_sbd();

drop trigger if exists trg_user_sync_sbd on public.users;
create trigger trg_user_sync_sbd before insert or update of bodyweight_kg, sbd_total, sbd_rank on public.users
  for each row execute function public.trg_user_sync_sbd();

revoke execute on function public.sync_sbd(uuid), public.sbd_total_for(uuid),
  public.trg_pr_sync_sbd(), public.trg_user_sync_sbd() from public, anon, authenticated;

update public.users set sbd_total = sbd_total;

-- Ajasta viikkokooste-push joka sunnuntai.
-- Aja tämä Supabase SQL Editorissa KERRAN.
--
-- VAIHE 1: Tallenna service_role-avain Vaultiin (hae se: Project Settings → API → service_role).
--          Korvaa <SERVICE_ROLE_KEY> oikealla avaimella ja aja tämä rivi ensin:
--
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
--
-- VAIHE 2: Aja loput.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Poista vanha ajastus jos olemassa (idempotentti)
select cron.unschedule('weekly-recap')
where exists (select 1 from cron.job where jobname = 'weekly-recap');

-- Sunnuntai 16:00 UTC (~18–19 Suomen aikaa)
select cron.schedule(
  'weekly-recap',
  '0 16 * * 0',
  $$
  select net.http_post(
    url := 'https://iixxsojjeaebhwsnzskl.supabase.co/functions/v1/weekly-recap',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

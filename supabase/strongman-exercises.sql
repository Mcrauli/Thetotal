-- Voimamies/strongman-liikkeet. Aja Supabase SQL Editorissa.
-- Idempotentti: ei lisää liikettä jos samanniminen on jo olemassa.

insert into public.exercises (name, muscle_group, category, is_sbd)
select v.name, 'Voimamies', 'accessory', false
from (values
  ('Log Press'),
  ('Axle Press'),
  ('Axle Deadlift'),
  ('Atlas Stone to Shoulder'),
  ('Atlas Stone over Bar'),
  ('Stone Load Series'),
  ('Sandbag Carry'),
  ('Sandbag to Shoulder'),
  ('Yoke Walk'),
  ('Frame Carry'),
  ('Keg Carry'),
  ('Keg Toss'),
  ('Tire Flip'),
  ('Circus Dumbbell Press'),
  ('Viking Press'),
  ('Husafell Carry'),
  ('Sled Drag'),
  ('Hercules Hold'),
  ('Conan''s Walk'),
  ('Duck Walk'),
  ('Car Deadlift'),
  ('18-inch Deadlift')
) as v(name)
where not exists (
  select 1 from public.exercises e where e.name = v.name
);

-- Ryhmitä myös olemassa olevat voimamieslajit samaan "Voimamies"-ryhmään
update public.exercises set muscle_group = 'Voimamies'
where name in ('Farmers Walk', 'Farmers Carry', 'Sled Push');

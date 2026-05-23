-- 1. Päivitä alkuperäiset seed-liikkeet suomalaisilla lihasyhmillä
UPDATE exercises SET muscle_group = 'Jalat'      WHERE name = 'Squat';
UPDATE exercises SET muscle_group = 'Rinta'      WHERE name = 'Bench Press';
UPDATE exercises SET muscle_group = 'Takareidet' WHERE name = 'Deadlift';
UPDATE exercises SET muscle_group = 'Hartiat'    WHERE name = 'Overhead Press';
UPDATE exercises SET muscle_group = 'Takareidet' WHERE name = 'Romanian Deadlift';
UPDATE exercises SET muscle_group = 'Selkä'      WHERE name = 'Barbell Row';
UPDATE exercises SET muscle_group = 'Selkä'      WHERE name = 'Pull-Up';
UPDATE exercises SET muscle_group = 'Rinta'      WHERE name = 'Dip';
UPDATE exercises SET muscle_group = 'Jalat'      WHERE name = 'Leg Press';
UPDATE exercises SET muscle_group = 'Selkä'      WHERE name = 'Lat Pulldown';
UPDATE exercises SET muscle_group = 'Ojentajat'  WHERE name = 'Tricep Pushdown';
UPDATE exercises SET muscle_group = 'Hauikset'   WHERE name = 'Bicep Curl';
UPDATE exercises SET muscle_group = 'Hartiat'    WHERE name = 'Face Pull';

-- 2. Poista duplikaatti (seedissä Pull-Up, minä lisäsin Pull-up)
DELETE FROM exercises WHERE name = 'Pull-up';

-- 3. Vaihda Cardio → Kardio
UPDATE exercises SET muscle_group = 'Kardio' WHERE muscle_group = 'Cardio';

-- 4. Tyhjät muscle_group → Muut
UPDATE exercises SET muscle_group = 'Muut' WHERE muscle_group IS NULL;

-- 5. Lisää puuttuvat liikkeet (powerlifting-spesifiset)
INSERT INTO exercises (name, category, muscle_group, is_sbd) VALUES
('Safety Bar Squat',     'accessory', 'Jalat',      false),
('Zercher Squat',        'accessory', 'Jalat',      false),
('Paused Squat',         'accessory', 'Jalat',      false),
('Trap Bar Deadlift',    'accessory', 'Takareidet', false),
('Rack Pull',            'accessory', 'Takareidet', false),
('Block Pull',           'accessory', 'Takareidet', false),
('Stiff Leg Deadlift',   'accessory', 'Takareidet', false),
('GHR',                  'accessory', 'Takareidet', false),
('Reverse Hyper',        'accessory', 'Takareidet', false),
('Nordic Hamstring Curl','accessory', 'Takareidet', false),
('Floor Press',          'accessory', 'Rinta',      false),
('Spoto Press',          'accessory', 'Rinta',      false),
('Slingshot Bench',      'accessory', 'Rinta',      false),
('JM Press',             'accessory', 'Ojentajat',  false),
('Pendlay Row',          'accessory', 'Selkä',      false),
('Meadows Row',          'accessory', 'Selkä',      false),
('Seal Row',             'accessory', 'Selkä',      false),
('Cable Row (Wide)',     'accessory', 'Selkä',      false),
('Dumbbell Shrug',       'accessory', 'Selkä',      false),
('Reverse Curl',         'accessory', 'Hauikset',   false),
('Zottman Curl',         'accessory', 'Hauikset',   false),
('Pec Deck',             'accessory', 'Rinta',      false),
('Chest Supported Row',  'accessory', 'Selkä',      false),
('Sissy Squat',          'accessory', 'Jalat',      false),
('Step Up',              'accessory', 'Jalat',      false),
('Glute Bridge',         'accessory', 'Pakarat',    false),
('Side Lateral Raise',   'accessory', 'Hartiat',    false),
('Arnold Press',         'accessory', 'Hartiat',    false),
('Dead Hang',            'accessory', 'Selkä',      false),
('Farmers Walk',         'accessory', 'Muut',       false),
('Sled Push',            'accessory', 'Kardio',     false),
('Battle Ropes',         'accessory', 'Kardio',     false)
ON CONFLICT (name) DO NOTHING;

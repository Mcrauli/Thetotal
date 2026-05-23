-- Lisää liikkeet, ohittaa duplikaatit automaattisesti
INSERT INTO exercises (name, category, muscle_group, is_sbd) VALUES

-- Powerlifting accessories
('Front Squat',               'accessory',      'Jalat',      false),
('Box Squat',                 'accessory',      'Jalat',      false),
('Pause Squat',               'accessory',      'Jalat',      false),
('Hack Squat',                'accessory',      'Jalat',      false),
('Leg Press',                 'accessory',      'Jalat',      false),
('Leg Extension',             'accessory',      'Jalat',      false),
('Bulgarian Split Squat',     'accessory',      'Jalat',      false),
('Sumo Deadlift',             'accessory',      'Takareidet', false),
('Romanian Deadlift',         'accessory',      'Takareidet', false),
('Deficit Deadlift',          'accessory',      'Takareidet', false),
('Pause Deadlift',            'accessory',      'Takareidet', false),
('Leg Curl',                  'accessory',      'Takareidet', false),
('Good Morning',              'accessory',      'Takareidet', false),
('Hip Thrust',                'accessory',      'Pakarat',    false),
('Cable Kickback',            'accessory',      'Pakarat',    false),
('Calf Raise',                'accessory',      'Pohjelihas', false),

-- Bench accessories & upper push
('Close Grip Bench Press',    'accessory',      'Rinta',      false),
('Pause Bench Press',         'accessory',      'Rinta',      false),
('Incline Bench Press',       'accessory',      'Rinta',      false),
('Dumbbell Bench Press',      'accessory',      'Rinta',      false),
('Incline Dumbbell Press',    'accessory',      'Rinta',      false),
('Cable Fly',                 'accessory',      'Rinta',      false),
('Dip',                       'accessory',      'Rinta',      false),
('Push-up',                   'accessory',      'Rinta',      false),
('Overhead Press',            'accessory',      'Hartiat',    false),
('Push Press',                'accessory',      'Hartiat',    false),
('Dumbbell Shoulder Press',   'accessory',      'Hartiat',    false),
('Lateral Raise',             'accessory',      'Hartiat',    false),
('Front Raise',               'accessory',      'Hartiat',    false),
('Rear Delt Fly',             'accessory',      'Hartiat',    false),
('Tricep Pushdown',           'accessory',      'Ojentajat',  false),
('Skull Crusher',             'accessory',      'Ojentajat',  false),
('Overhead Tricep Extension', 'accessory',      'Ojentajat',  false),
('Tricep Dip',                'accessory',      'Ojentajat',  false),

-- Pull / back
('Pull-up',                   'accessory',      'Selkä',      false),
('Chin-up',                   'accessory',      'Selkä',      false),
('Barbell Row',               'accessory',      'Selkä',      false),
('Dumbbell Row',              'accessory',      'Selkä',      false),
('Cable Row',                 'accessory',      'Selkä',      false),
('Lat Pulldown',              'accessory',      'Selkä',      false),
('T-Bar Row',                 'accessory',      'Selkä',      false),
('Face Pull',                 'accessory',      'Hartiat',    false),
('Barbell Shrug',             'accessory',      'Selkä',      false),
('Bicep Curl',                'accessory',      'Hauikset',   false),
('Hammer Curl',               'accessory',      'Hauikset',   false),
('Preacher Curl',             'accessory',      'Hauikset',   false),
('Cable Curl',                'accessory',      'Hauikset',   false),

-- Core
('Plank',                     'accessory',      'Vatsa',      false),
('Ab Wheel',                  'accessory',      'Vatsa',      false),
('Crunch',                    'accessory',      'Vatsa',      false),
('Leg Raise',                 'accessory',      'Vatsa',      false),
('Cable Crunch',              'accessory',      'Vatsa',      false),
('Russian Twist',             'accessory',      'Vatsa',      false),

-- Cardio (kirjaa kesto minuutteina tai matka km "painoksi")
('Running',                   'accessory',      'Cardio',     false),
('Cycling',                   'accessory',      'Cardio',     false),
('Rowing Machine',            'accessory',      'Cardio',     false),
('Jump Rope',                 'accessory',      'Cardio',     false),
('Walking',                   'accessory',      'Cardio',     false),
('Assault Bike',              'accessory',      'Cardio',     false),
('Elliptical',                'accessory',      'Cardio',     false),
('Stair Climber',             'accessory',      'Cardio',     false),
('Swimming',                  'accessory',      'Cardio',     false)

ON CONFLICT (name) DO NOTHING;

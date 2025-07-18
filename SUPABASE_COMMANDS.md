# Supabase SQL Commands - Copy & Run

**Instructions:** Copy each SQL block below and paste into Supabase SQL Editor (Database → SQL Editor)

## 1. Enable Extensions and Security

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
```

## 2. Create Profiles Table

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('consumer', 'doctor')),
  full_name TEXT,
  avatar_url TEXT,
  location TEXT,
  phone TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 3. Create Specialties Table

```sql
-- Create specialties table
CREATE TABLE specialties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default specialties
INSERT INTO specialties (name, icon) VALUES
  ('Cardiology', 'heart'),
  ('Dermatology', 'skin'),
  ('Neurology', 'brain'),
  ('Orthopedics', 'bone'),
  ('Pediatrics', 'child'),
  ('Psychiatry', 'mind'),
  ('General Medicine', 'stethoscope'),
  ('Gynecology', 'female'),
  ('Ophthalmology', 'eye'),
  ('ENT', 'ear');

-- Enable public read access
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view specialties" ON specialties
  FOR SELECT TO PUBLIC USING (true);
```

## 4. Create Clinics Table

```sql
-- Create clinics table
CREATE TABLE clinics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and public read access
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clinics" ON clinics
  FOR SELECT TO PUBLIC USING (true);
```

## 5. Create Doctors Table

```sql
-- Create doctors table
CREATE TABLE doctors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty_id UUID REFERENCES specialties(id),
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  fee INTEGER DEFAULT 0,
  photo_url TEXT,
  bio TEXT,
  verified BOOLEAN DEFAULT false,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and policies
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified doctors" ON doctors
  FOR SELECT TO PUBLIC USING (verified = true);

CREATE POLICY "Doctors can update own profile" ON doctors
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Doctors can insert own profile" ON doctors
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

## 6. Create Doctor-Clinic Junction Table

```sql
-- Create doctor_clinics junction table
CREATE TABLE doctor_clinics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, clinic_id)
);

-- Enable RLS and policies
ALTER TABLE doctor_clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view doctor-clinic associations" ON doctor_clinics
  FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Doctors can manage own clinic associations" ON doctor_clinics
  FOR ALL USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );
```

## 7. Create Available Slots Table

```sql
-- Create available_slots table
CREATE TABLE available_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, clinic_id, date, start_time)
);

-- Enable RLS and policies
ALTER TABLE available_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available slots" ON available_slots
  FOR SELECT TO PUBLIC USING (is_available = true);

CREATE POLICY "Doctors can manage own slots" ON available_slots
  FOR ALL USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );
```

## 8. Create Appointments Table

```sql
-- Create appointments table
CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id),
  slot_id UUID REFERENCES available_slots(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Doctors can view own appointments" ON appointments
  FOR SELECT USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create appointments" ON appointments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Doctors can update own appointments" ON appointments
  FOR UPDATE USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );
```

## 9. Create Update Triggers

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 10. Insert Sample Clinics

```sql
INSERT INTO clinics (name, address, latitude, longitude, phone) VALUES
  ('City Medical Center', '123 Main St, Downtown, New York', 40.7128, -74.0060, '+1-555-0001'),
  ('Northside Clinic', '456 Oak Ave, Northside, New York', 40.7589, -73.9851, '+1-555-0002'),
  ('Westside Health Center', '789 Pine Rd, Westside, New York', 40.7831, -73.9712, '+1-555-0003'),
  ('Eastside Medical Plaza', '321 Elm St, Eastside, New York', 40.7505, -73.9934, '+1-555-0004'),
  ('Central Hospital', '654 Maple Dr, Central, New York', 40.7282, -73.9942, '+1-555-0005');
```

## 11. Insert Sample Doctors

```sql
INSERT INTO doctors (id, name, specialty_id, experience_years, rating, fee, photo_url, bio, verified) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440000',
    'Dr. Sarah Johnson',
    (SELECT id FROM specialties WHERE name = 'Cardiology'),
    12,
    4.8,
    200,
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
    'Dr. Johnson is a board-certified cardiologist with over 12 years of experience in treating heart conditions.',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'Dr. Michael Chen',
    (SELECT id FROM specialties WHERE name = 'Neurology'),
    8,
    4.7,
    250,
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
    'Specialist in neurological disorders with expertise in stroke treatment and brain surgery.',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'Dr. Emily Rodriguez',
    (SELECT id FROM specialties WHERE name = 'Dermatology'),
    6,
    4.9,
    150,
    'https://images.unsplash.com/photo-1594824815526-87fa8230fdbb?w=400',
    'Dermatologist specializing in skin cancer prevention and cosmetic dermatology.',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    'Dr. Robert Wilson',
    (SELECT id FROM specialties WHERE name = 'Orthopedics'),
    15,
    4.6,
    300,
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400',
    'Orthopedic surgeon with expertise in joint replacement and sports medicine.',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440004',
    'Dr. Lisa Patel',
    (SELECT id FROM specialties WHERE name = 'Pediatrics'),
    10,
    4.8,
    180,
    'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=400',
    'Pediatrician dedicated to providing comprehensive care for children and adolescents.',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440005',
    'Dr. James Thompson',
    (SELECT id FROM specialties WHERE name = 'General Medicine'),
    20,
    4.5,
    120,
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400',
    'Family medicine physician with two decades of experience in primary care.',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440006',
    'Dr. Maria Santos',
    (SELECT id FROM specialties WHERE name = 'Gynecology'),
    9,
    4.7,
    200,
    'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400',
    'OB/GYN specialist focused on women''s health and reproductive medicine.',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440007',
    'Dr. David Kim',
    (SELECT id FROM specialties WHERE name = 'Ophthalmology'),
    7,
    4.6,
    220,
    'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400',
    'Eye specialist with expertise in cataract surgery and retinal disorders.',
    true
  );
```

## 12. Associate Doctors with Clinics

```sql
INSERT INTO doctor_clinics (doctor_id, clinic_id) VALUES
  -- Dr. Sarah Johnson (Cardiology) - works at 2 clinics
  ('660e8400-e29b-41d4-a716-446655440000', (SELECT id FROM clinics WHERE name = 'City Medical Center')),
  ('660e8400-e29b-41d4-a716-446655440000', (SELECT id FROM clinics WHERE name = 'Central Hospital')),
  
  -- Dr. Michael Chen (Neurology) - works at 1 clinic
  ('660e8400-e29b-41d4-a716-446655440001', (SELECT id FROM clinics WHERE name = 'Central Hospital')),
  
  -- Dr. Emily Rodriguez (Dermatology) - works at 3 clinics
  ('660e8400-e29b-41d4-a716-446655440002', (SELECT id FROM clinics WHERE name = 'Northside Clinic')),
  ('660e8400-e29b-41d4-a716-446655440002', (SELECT id FROM clinics WHERE name = 'Westside Health Center')),
  ('660e8400-e29b-41d4-a716-446655440002', (SELECT id FROM clinics WHERE name = 'Eastside Medical Plaza')),
  
  -- Dr. Robert Wilson (Orthopedics) - works at 2 clinics
  ('660e8400-e29b-41d4-a716-446655440003', (SELECT id FROM clinics WHERE name = 'City Medical Center')),
  ('660e8400-e29b-41d4-a716-446655440003', (SELECT id FROM clinics WHERE name = 'Eastside Medical Plaza')),
  
  -- Dr. Lisa Patel (Pediatrics) - works at 2 clinics
  ('660e8400-e29b-41d4-a716-446655440004', (SELECT id FROM clinics WHERE name = 'Northside Clinic')),
  ('660e8400-e29b-41d4-a716-446655440004', (SELECT id FROM clinics WHERE name = 'Westside Health Center')),
  
  -- Dr. James Thompson (General Medicine) - works at all clinics
  ('660e8400-e29b-41d4-a716-446655440005', (SELECT id FROM clinics WHERE name = 'City Medical Center')),
  ('660e8400-e29b-41d4-a716-446655440005', (SELECT id FROM clinics WHERE name = 'Northside Clinic')),
  ('660e8400-e29b-41d4-a716-446655440005', (SELECT id FROM clinics WHERE name = 'Westside Health Center')),
  ('660e8400-e29b-41d4-a716-446655440005', (SELECT id FROM clinics WHERE name = 'Eastside Medical Plaza')),
  ('660e8400-e29b-41d4-a716-446655440005', (SELECT id FROM clinics WHERE name = 'Central Hospital')),
  
  -- Dr. Maria Santos (Gynecology) - works at 2 clinics
  ('660e8400-e29b-41d4-a716-446655440006', (SELECT id FROM clinics WHERE name = 'Westside Health Center')),
  ('660e8400-e29b-41d4-a716-446655440006', (SELECT id FROM clinics WHERE name = 'Central Hospital')),
  
  -- Dr. David Kim (Ophthalmology) - works at 2 clinics
  ('660e8400-e29b-41d4-a716-446655440007', (SELECT id FROM clinics WHERE name = 'Northside Clinic')),
  ('660e8400-e29b-41d4-a716-446655440007', (SELECT id FROM clinics WHERE name = 'Eastside Medical Plaza'));
```

## 13. Create Available Slots for Next 30 Days

```sql
DO $$
DECLARE
    doc_record RECORD;
    clinic_record RECORD;
    current_date DATE;
    slot_time TIME;
    end_date DATE := CURRENT_DATE + INTERVAL '30 days';
BEGIN
    -- Loop through each doctor
    FOR doc_record IN SELECT id FROM doctors WHERE verified = true LOOP
        -- Loop through each clinic for this doctor
        FOR clinic_record IN 
            SELECT c.id 
            FROM clinics c 
            JOIN doctor_clinics dc ON c.id = dc.clinic_id 
            WHERE dc.doctor_id = doc_record.id 
        LOOP
            -- Create slots for the next 30 days
            current_date := CURRENT_DATE + 1; -- Start from tomorrow
            
            WHILE current_date <= end_date LOOP
                -- Skip weekends (optional - remove this if doctors work weekends)
                IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
                    -- Morning slots: 9:00 AM to 12:00 PM
                    slot_time := '09:00:00';
                    WHILE slot_time < '12:00:00' LOOP
                        INSERT INTO available_slots (doctor_id, clinic_id, date, start_time, end_time, is_available)
                        VALUES (
                            doc_record.id,
                            clinic_record.id,
                            current_date,
                            slot_time,
                            slot_time + INTERVAL '30 minutes',
                            true
                        );
                        slot_time := slot_time + INTERVAL '30 minutes';
                    END LOOP;
                    
                    -- Afternoon slots: 2:00 PM to 6:00 PM
                    slot_time := '14:00:00';
                    WHILE slot_time < '18:00:00' LOOP
                        INSERT INTO available_slots (doctor_id, clinic_id, date, start_time, end_time, is_available)
                        VALUES (
                            doc_record.id,
                            clinic_record.id,
                            current_date,
                            slot_time,
                            slot_time + INTERVAL '30 minutes',
                            true
                        );
                        slot_time := slot_time + INTERVAL '30 minutes';
                    END LOOP;
                END IF;
                
                current_date := current_date + 1;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
```

## 14. Add Performance Indexes (Optional)

```sql
-- Add indexes for better performance
CREATE INDEX idx_doctors_specialty ON doctors(specialty_id);
CREATE INDEX idx_doctors_rating ON doctors(rating DESC);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_available_slots_doctor_date ON available_slots(doctor_id, date);
```

---

## 🎯 Quick Setup Steps:

1. **Create Supabase Project** at https://app.supabase.com
2. **Copy your Project URL and Anon Key** from Settings → API
3. **Run Commands 1-14** above in Supabase SQL Editor (one by one)
4. **Update your .env file** with Supabase credentials
5. **Test your app**

Done! Your database is ready with sample data. 🚀

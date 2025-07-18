# Supabase Setup Guide for Doctor Booking App

This guide will walk you through setting up Supabase for the Doctor Booking App with all necessary tables, policies, and configurations.

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Install Supabase CLI (optional but recommended)

```bash
npm install -g supabase
```

## Step 1: Create a New Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `doctor-booking-app`
   - **Database Password**: (choose a strong password)
   - **Region**: (choose closest to your users)
5. Click "Create new project"

## Step 2: Get Project Credentials

After project creation, go to **Settings** → **API** and copy:
- **Project URL**: `https://your-project-id.supabase.co`
- **Anon/Public Key**: `eyJ...` (starts with eyJ)

## Step 3: Configure Environment Variables

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Database Schema Setup

Execute these SQL commands in the Supabase SQL Editor (**Database** → **SQL Editor**):

### 1. Enable Row Level Security and UUID Extension

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
```

### 2. Create Profiles Table

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

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 3. Create Specialties Table

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

### 4. Create Clinics Table

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

-- Enable RLS
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Public read access for clinics
CREATE POLICY "Anyone can view clinics" ON clinics
  FOR SELECT TO PUBLIC USING (true);
```

### 5. Create Doctors Table

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

-- Enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Policies for doctors
CREATE POLICY "Anyone can view verified doctors" ON doctors
  FOR SELECT TO PUBLIC USING (verified = true);

CREATE POLICY "Doctors can update own profile" ON doctors
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Doctors can insert own profile" ON doctors
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

### 6. Create Doctor-Clinic Junction Table

```sql
-- Create doctor_clinics junction table
CREATE TABLE doctor_clinics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, clinic_id)
);

-- Enable RLS
ALTER TABLE doctor_clinics ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view doctor-clinic associations" ON doctor_clinics
  FOR SELECT TO PUBLIC USING (true);

-- Only doctors can manage their clinic associations
CREATE POLICY "Doctors can manage own clinic associations" ON doctor_clinics
  FOR ALL USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );
```

### 7. Create Available Slots Table

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

-- Enable RLS
ALTER TABLE available_slots ENABLE ROW LEVEL SECURITY;

-- Public read access for available slots
CREATE POLICY "Anyone can view available slots" ON available_slots
  FOR SELECT TO PUBLIC USING (is_available = true);

-- Doctors can manage their own slots
CREATE POLICY "Doctors can manage own slots" ON available_slots
  FOR ALL USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );
```

### 8. Create Appointments Table

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

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Users can view their own appointments
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (user_id = auth.uid());

-- Doctors can view their appointments
CREATE POLICY "Doctors can view own appointments" ON appointments
  FOR SELECT USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- Users can create appointments
CREATE POLICY "Users can create appointments" ON appointments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own appointments
CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (user_id = auth.uid());

-- Doctors can update their appointments
CREATE POLICY "Doctors can update own appointments" ON appointments
  FOR UPDATE USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );
```

### 9. Create Triggers for Updated_at

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

## Step 5: Insert Sample Data

### Sample Clinics

```sql
INSERT INTO clinics (name, address, latitude, longitude, phone) VALUES
  ('City Medical Center', '123 Main St, Downtown', 40.7128, -74.0060, '+1234567890'),
  ('Northside Clinic', '456 Oak Ave, Northside', 40.7589, -73.9851, '+1234567891'),
  ('Westside Health', '789 Pine Rd, Westside', 40.7831, -73.9712, '+1234567892'),
  ('Eastside Medical', '321 Elm St, Eastside', 40.7505, -73.9934, '+1234567893'),
  ('Central Hospital', '654 Maple Dr, Central', 40.7282, -73.9942, '+1234567894');
```

### Sample Doctors (Run after creating doctor accounts)

```sql
-- This will be populated when doctors sign up through the app
-- Or you can manually insert for testing purposes
```

## Step 6: Configure Authentication Settings

1. Go to **Authentication** → **Settings**
2. Configure **Site URL**: `exp://localhost:19000` (for development)
3. Configure **Redirect URLs**: Add your app's custom scheme
4. Enable **Email confirmations** (optional)
5. Configure **Email templates** (optional)

## Step 7: Set Up Storage (Optional - for profile pictures)

1. Go to **Storage**
2. Create a new bucket called `avatars`
3. Set the bucket to **Public**
4. Add storage policies:

```sql
-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Step 8: Test the Setup

1. Update your `.env` file with the actual Supabase credentials
2. Run your app and test the authentication flow
3. Check if data is being stored correctly in the Supabase dashboard

## Commands to Run in Your Project

```bash
# 1. Install dependencies (if not already done)
npm install @supabase/supabase-js @react-native-async-storage/async-storage

# 2. Update environment variables
echo "EXPO_PUBLIC_SUPABASE_URL=your-actual-url" >> .env
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-key" >> .env

# 3. Start the development server
npx expo start

# 4. Clear cache if needed
npx expo start --clear
```

## Database Views (Optional - for complex queries)

```sql
-- View for doctors with their specialty and clinic information
CREATE VIEW doctors_with_details AS
SELECT 
  d.*,
  s.name as specialty_name,
  s.icon as specialty_icon,
  COALESCE(
    json_agg(
      json_build_object(
        'id', c.id,
        'name', c.name,
        'address', c.address,
        'latitude', c.latitude,
        'longitude', c.longitude
      )
    ) FILTER (WHERE c.id IS NOT NULL), 
    '[]'
  ) as clinics
FROM doctors d
LEFT JOIN specialties s ON d.specialty_id = s.id
LEFT JOIN doctor_clinics dc ON d.id = dc.doctor_id
LEFT JOIN clinics c ON dc.clinic_id = c.id
WHERE d.verified = true
GROUP BY d.id, s.name, s.icon;

-- Grant select permission
GRANT SELECT ON doctors_with_details TO PUBLIC;
```

## Troubleshooting

1. **Authentication Issues**: Check if RLS policies are correctly set
2. **Data Not Showing**: Verify the anon key has the right permissions
3. **CORS Issues**: Make sure your app URL is in the allowed origins
4. **Environment Variables**: Restart the Expo dev server after changing .env

## Production Considerations

1. **Environment Variables**: Use different Supabase projects for dev/staging/prod
2. **Database Backup**: Enable automatic backups in Supabase dashboard
3. **Monitoring**: Set up alerts for database performance
4. **Security**: Review and tighten RLS policies before going live
5. **Indexes**: Add database indexes for better performance on large datasets

```sql
-- Recommended indexes for production
CREATE INDEX idx_doctors_specialty ON doctors(specialty_id);
CREATE INDEX idx_doctors_rating ON doctors(rating DESC);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_available_slots_doctor_date ON available_slots(doctor_id, date);
```

This setup provides a complete, production-ready database schema for your Doctor Booking App with proper security policies and relationships.

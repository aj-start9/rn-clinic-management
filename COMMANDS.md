# Quick Start Commands for Supabase Setup

## 🚀 Complete Setup Commands

Copy and paste these commands to quickly set up your Doctor Booking App with Supabase:

### 1. Project Setup
```bash
# Navigate to your project
cd /Users/ankit/Desktop/expo-dr-appointment-app

# Install dependencies (if not already done)
npm install

# Make setup script executable and run it
chmod +x setup.sh
./setup.sh
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your Supabase credentials
# Replace the placeholder values with your actual Supabase URL and keys
nano .env
```

### 3. Supabase Project Creation

1. **Go to Supabase Dashboard:**
   ```
   https://app.supabase.com
   ```

2. **Create New Project:**
   - Click "New Project"
   - Name: `doctor-booking-app`
   - Choose your region
   - Set database password
   - Click "Create project"

3. **Get Credentials:**
   - Go to Settings → API
   - Copy Project URL and Anon Key
   - Update your `.env` file

### 4. Database Schema Setup

**Execute in Supabase SQL Editor** (Settings → SQL Editor):

```sql
-- 1. Enable extensions and RLS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- 2. Create profiles table
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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Create specialties table
CREATE TABLE specialties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view specialties" ON specialties
  FOR SELECT TO PUBLIC USING (true);

-- 4. Create clinics table
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

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clinics" ON clinics
  FOR SELECT TO PUBLIC USING (true);

-- 5. Create doctors table
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

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view verified doctors" ON doctors
  FOR SELECT TO PUBLIC USING (verified = true);
CREATE POLICY "Doctors can update own profile" ON doctors
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Doctors can insert own profile" ON doctors
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 6. Create doctor_clinics junction table
CREATE TABLE doctor_clinics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, clinic_id)
);

ALTER TABLE doctor_clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view doctor-clinic associations" ON doctor_clinics
  FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Doctors can manage own clinic associations" ON doctor_clinics
  FOR ALL USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

-- 7. Create available_slots table
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

ALTER TABLE available_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view available slots" ON available_slots
  FOR SELECT TO PUBLIC USING (is_available = true);
CREATE POLICY "Doctors can manage own slots" ON available_slots
  FOR ALL USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

-- 8. Create appointments table
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

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Doctors can view own appointments" ON appointments
  FOR SELECT USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create appointments" ON appointments
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Doctors can update own appointments" ON appointments
  FOR UPDATE USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

-- 9. Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5. Insert Sample Data

**Execute in Supabase SQL Editor:**

```sql
-- Copy and paste the entire content of sample_data.sql file
-- This includes sample clinics, doctors, and availability slots
```

### 6. Test Your Setup

```bash
# Start the development server
npx expo start

# Test in your preferred platform
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Press 'w' for web browser
```

### 7. Migrate to Supabase (Optional)

If you want to use real Supabase instead of mock data:

```bash
# Backup current Redux files
cp src/redux/authSlice.ts src/redux/authSlice.mock.ts
cp src/redux/doctorSlice.ts src/redux/doctorSlice.mock.ts
cp src/redux/appointmentSlice.ts src/redux/appointmentSlice.mock.ts

# Replace with Supabase versions
cp src/redux/authSlice.supabase.ts src/redux/authSlice.ts
cp src/redux/doctorSlice.supabase.ts src/redux/doctorSlice.ts
cp src/redux/appointmentSlice.supabase.ts src/redux/appointmentSlice.ts
```

## 🔧 Troubleshooting Commands

### Check Environment Variables
```bash
# Verify environment variables are loaded
cat .env

# Check if Expo can read them
npx expo config --type introspect
```

### Clear Cache
```bash
# Clear Expo cache
npx expo start --clear

# Clear npm cache
npm cache clean --force

# Reset Expo project (if needed)
npx expo install --fix
```

### Database Connection Test
```bash
# Install Supabase CLI (optional)
npm install -g supabase

# Test connection (requires CLI setup)
supabase status
```

### Reset Project (if needed)
```bash
# Reset to clean state
rm -rf node_modules
rm package-lock.json
npm install

# Or use the provided reset script
npm run reset-project
```

## 📱 Testing Commands

### Test Authentication
```bash
# Test with demo credentials (see DEMO_CREDENTIALS.md):
# Consumer: consumer@demo.com / password123
# Doctor: doctor@demo.com / password123
```

### Test Database Queries
```sql
-- In Supabase SQL Editor, test these queries:

-- Check if users are created
SELECT * FROM auth.users;

-- Check profiles
SELECT * FROM profiles;

-- Check doctors
SELECT * FROM doctors;

-- Check appointments
SELECT * FROM appointments;
```

## 🚀 Production Deployment Commands

### Environment Setup for Production
```bash
# Create production environment file
cp .env .env.production

# Update with production Supabase credentials
nano .env.production
```

### Build for Production
```bash
# Build for production
npx expo build:web

# Or for mobile app stores
npx expo build:ios
npx expo build:android
```

### Database Optimizations
```sql
-- Add indexes for better performance
CREATE INDEX idx_doctors_specialty ON doctors(specialty_id);
CREATE INDEX idx_doctors_rating ON doctors(rating DESC);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_available_slots_doctor_date ON available_slots(doctor_id, date);
```

## 📚 Documentation Files

- `SUPABASE_SETUP.md` - Detailed Supabase setup guide
- `MIGRATION_GUIDE.md` - How to migrate from mock to real data
- `README.md` - Project overview and features
- `DEMO_CREDENTIALS.md` - Demo login credentials
- `sample_data.sql` - Sample database data

## 🆘 Support

If you encounter issues:

1. Check the Supabase dashboard for errors
2. Review console logs in your browser/simulator
3. Verify your `.env` file has correct credentials
4. Ensure all SQL scripts executed successfully
5. Test individual API calls in Supabase API docs

## ✅ Quick Verification Checklist

- [ ] Supabase project created
- [ ] Environment variables set
- [ ] Database schema created
- [ ] Sample data inserted
- [ ] App starts without errors
- [ ] Can create new account
- [ ] Can sign in with demo credentials
- [ ] Can view doctors list
- [ ] Can book appointment
- [ ] Can view appointments

Your Doctor Booking App is ready! 🎉

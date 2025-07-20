-- =====================================================
-- DOCTOR BOOKING APP - COMPLETE DATABASE SETUP
-- =====================================================
-- 
-- This file contains all SQL commands to set up the complete
-- database schema for the Doctor Booking App from scratch.
-- 
-- EXECUTION ORDER:
-- 1. Run this file first for basic schema setup
-- 2. Then run: rls-policies-complete.sql
-- 3. Then run: triggers-and-functions.sql  
-- 4. Finally run: sample-data-complete.sql (optional)
--
-- IMPORTANT: Execute this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- SECTION 1: EXTENSIONS AND BASIC SETUP
-- =====================================================

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security on auth.users table
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 2: CORE TABLES
-- =====================================================

-- -----------------------------------------------------
-- PROFILES TABLE
-- -----------------------------------------------------
-- Stores user profile information for both consumers and doctors
-- Links to auth.users table for authentication

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('consumer', 'doctor')),
  full_name TEXT,
  avatar_url TEXT,
  location TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- SPECIALTIES TABLE
-- -----------------------------------------------------
-- Medical specialties that doctors can belong to

CREATE TABLE specialties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- CLINICS TABLE
-- -----------------------------------------------------
-- Physical clinic/hospital locations where doctors practice

CREATE TABLE clinics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  website TEXT,
  opening_hours TEXT, -- e.g., "09:00"
  closing_hours TEXT, -- e.g., "17:00"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- DOCTORS TABLE
-- -----------------------------------------------------
-- Doctor-specific information and credentials

CREATE TABLE doctors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  specialty_id UUID REFERENCES specialties(id),
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  fee INTEGER DEFAULT 0, -- consultation fee in cents/smallest currency unit
  photo_url TEXT,
  bio TEXT,
  verified BOOLEAN DEFAULT false,
  license_number TEXT UNIQUE,
  education TEXT, -- medical education details
  certifications TEXT, -- additional certifications
  languages TEXT[], -- languages spoken
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- One doctor profile per user
);

-- Enable Row Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- DOCTOR_CLINICS JUNCTION TABLE
-- -----------------------------------------------------
-- Many-to-many relationship between doctors and clinics
-- A doctor can practice at multiple clinics

CREATE TABLE doctor_clinics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  is_primary BOOLEAN DEFAULT false, -- is this the doctor's primary clinic
  consultation_fee INTEGER, -- specific fee for this clinic (overrides doctor's default)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, clinic_id)
);

-- Enable Row Level Security
ALTER TABLE doctor_clinics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 3: AVAILABILITY AND SCHEDULING
-- =====================================================

-- -----------------------------------------------------
-- AVAILABILITIES TABLE
-- -----------------------------------------------------
-- Doctor availability slots for appointments
-- Renamed from available_slots for clarity

CREATE TABLE availabilities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  max_appointments INTEGER DEFAULT 1, -- how many appointments can be booked in this slot
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no overlapping slots for same doctor at same clinic
  CONSTRAINT no_overlapping_slots EXCLUDE USING gist (
    doctor_id WITH =,
    clinic_id WITH =,
    date WITH =,
    tsrange(start_time::text::time, end_time::text::time) WITH &&
  )
);

-- Enable Row Level Security
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- APPOINTMENTS TABLE
-- -----------------------------------------------------
-- Patient appointments with doctors

CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  availability_id UUID REFERENCES availabilities(id) ON DELETE CASCADE,
  
  -- Appointment timing
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Appointment details
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  appointment_type TEXT DEFAULT 'consultation' CHECK (appointment_type IN ('consultation', 'follow_up', 'emergency', 'telemedicine')),
  
  -- Additional information
  symptoms TEXT, -- patient's reported symptoms
  notes TEXT, -- additional notes
  prescription TEXT, -- doctor's prescription
  diagnosis TEXT, -- doctor's diagnosis
  
  -- Payment information
  fee_charged INTEGER, -- actual fee charged
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_appointment_time CHECK (start_time < end_time),
  CONSTRAINT valid_appointment_date CHECK (date >= CURRENT_DATE)
);

-- Enable Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 4: REVIEWS AND RATINGS
-- =====================================================

-- -----------------------------------------------------
-- REVIEWS TABLE
-- -----------------------------------------------------
-- Patient reviews for doctors

CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Review categories
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  treatment_satisfaction INTEGER CHECK (treatment_satisfaction >= 1 AND treatment_satisfaction <= 5),
  staff_behavior INTEGER CHECK (staff_behavior >= 1 AND staff_behavior <= 5),
  clinic_environment INTEGER CHECK (clinic_environment >= 1 AND clinic_environment <= 5),
  
  -- Metadata
  is_verified BOOLEAN DEFAULT false, -- verified reviews from actual appointments
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One review per appointment
  UNIQUE(appointment_id)
);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 5: NOTIFICATIONS AND MESSAGING
-- =====================================================

-- -----------------------------------------------------
-- NOTIFICATIONS TABLE
-- -----------------------------------------------------
-- System notifications for users

CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('appointment', 'reminder', 'cancellation', 'system', 'promotion')),
  
  -- Notification data (JSON for additional context)
  data JSONB DEFAULT '{}',
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  
  -- Delivery methods
  send_push BOOLEAN DEFAULT true,
  send_email BOOLEAN DEFAULT false,
  send_sms BOOLEAN DEFAULT false,
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 6: AUDIT AND LOGGING
-- =====================================================

-- -----------------------------------------------------
-- AUDIT_LOGS TABLE
-- -----------------------------------------------------
-- Track important system events and changes

CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Event details
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID NOT NULL,
  
  -- User context
  user_id UUID REFERENCES profiles(id),
  user_role TEXT,
  
  -- Change details
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 7: INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_full_name ON profiles(full_name);

-- Doctors indexes
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_specialty ON doctors(specialty_id);
CREATE INDEX idx_doctors_rating ON doctors(rating DESC);
CREATE INDEX idx_doctors_verified ON doctors(verified);
CREATE INDEX idx_doctors_experience ON doctors(experience_years DESC);

-- Appointments indexes
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);

-- Availabilities indexes
CREATE INDEX idx_availabilities_doctor_date ON availabilities(doctor_id, date);
CREATE INDEX idx_availabilities_clinic_date ON availabilities(clinic_id, date);
CREATE INDEX idx_availabilities_available ON availabilities(is_available);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);

-- Reviews indexes
CREATE INDEX idx_reviews_doctor ON reviews(doctor_id);
CREATE INDEX idx_reviews_patient ON reviews(patient_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- =====================================================
-- END OF DATABASE SCHEMA SETUP
-- =====================================================

-- NEXT STEPS:
-- 1. Run rls-policies-complete.sql for security policies
-- 2. Run triggers-and-functions.sql for automation
-- 3. Run sample-data-complete.sql for test data

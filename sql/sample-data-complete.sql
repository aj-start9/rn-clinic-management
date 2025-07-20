-- =====================================================
-- DOCTOR BOOKING APP - SAMPLE DATA
-- =====================================================
-- 
-- This file contains sample data for testing the Doctor Booking App.
-- 
-- PREREQUISITES:
-- - database-schema-complete.sql must be executed first
-- - rls-policies-complete.sql should be executed first
-- - triggers-and-functions.sql should be executed first
-- 
-- WARNING: This file contains test data and should NOT be used
-- in production environments.
--
-- EXECUTION: Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- SECTION 1: SPECIALTIES DATA
-- =====================================================

INSERT INTO specialties (name, icon, description) VALUES
  ('Cardiology', 'heart', 'Heart and cardiovascular system specialists'),
  ('Dermatology', 'skin-care', 'Skin, hair, and nail conditions'),
  ('Neurology', 'brain', 'Brain and nervous system disorders'),
  ('Orthopedics', 'bone', 'Bone, joint, and muscle problems'),
  ('Pediatrics', 'child-care', 'Medical care for infants, children, and adolescents'),
  ('Psychiatry', 'psychology', 'Mental health and behavioral disorders'),
  ('General Medicine', 'stethoscope', 'Primary care and general health issues'),
  ('Gynecology', 'female', 'Women''s reproductive health'),
  ('Ophthalmology', 'eye', 'Eye and vision care'),
  ('ENT', 'ear', 'Ear, nose, and throat conditions'),
  ('Oncology', 'medical', 'Cancer diagnosis and treatment'),
  ('Endocrinology', 'diabetes', 'Hormonal and metabolic disorders'),
  ('Gastroenterology', 'stomach', 'Digestive system disorders'),
  ('Pulmonology', 'lungs', 'Lung and respiratory conditions'),
  ('Urology', 'kidney', 'Urinary system and male reproductive health')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SECTION 2: CLINICS DATA
-- =====================================================

INSERT INTO clinics (id, name, address, latitude, longitude, phone, email, website, opening_hours, closing_hours) VALUES
  (uuid_generate_v4(), 'City Medical Center', '123 Main Street, Downtown, New York, NY 10001', 40.7128, -74.0060, '+1-212-555-0101', 'info@citymedical.com', 'https://citymedical.com', '08:00', '20:00'),
  (uuid_generate_v4(), 'Northside Health Clinic', '456 Oak Avenue, Northside, New York, NY 10025', 40.7589, -73.9851, '+1-212-555-0102', 'contact@northsidehealth.com', 'https://northsidehealth.com', '07:00', '19:00'),
  (uuid_generate_v4(), 'Westside Medical Plaza', '789 Pine Road, Upper West Side, New York, NY 10024', 40.7831, -73.9712, '+1-212-555-0103', 'appointments@westsidemedical.com', 'https://westsidemedical.com', '09:00', '18:00'),
  (uuid_generate_v4(), 'Eastside Family Clinic', '321 Elm Street, Lower East Side, New York, NY 10002', 40.7505, -73.9934, '+1-212-555-0104', 'hello@eastsideclinic.com', 'https://eastsideclinic.com', '08:30', '17:30'),
  (uuid_generate_v4(), 'Central Park Medical', '654 Maple Drive, Central Park East, New York, NY 10065', 40.7682, -73.9632, '+1-212-555-0105', 'info@centralparkmedicalnj.com', 'https://centralparkmedicalnj.com', '09:00', '17:00'),
  (uuid_generate_v4(), 'Brooklyn Heights Clinic', '987 Heights Boulevard, Brooklyn Heights, NY 11201', 40.6962, -73.9956, '+1-718-555-0106', 'care@brooklynheights.com', 'https://brooklynheights.com', '08:00', '19:00'),
  (uuid_generate_v4(), 'Queens Medical Center', '159 Queens Plaza, Long Island City, NY 11101', 40.7505, -73.9408, '+1-718-555-0107', 'contact@queensmedical.com', 'https://queensmedical.com', '07:30', '20:30'),
  (uuid_generate_v4(), 'Bronx Community Health', '753 Bronx River Avenue, Bronx, NY 10451', 40.8176, -73.9182, '+1-718-555-0108', 'info@bronxcommunity.com', 'https://bronxcommunity.com', '08:00', '18:00')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SECTION 3: SAMPLE USERS AND PROFILES
-- =====================================================

-- Note: In a real application, users would be created through the auth system.
-- For testing purposes, we'll create some sample profile records manually.
-- You'll need to replace these UUIDs with actual user IDs from your auth.users table.

-- Sample consumer profiles (patients)
INSERT INTO profiles (id, role, full_name, phone, location) VALUES
  ('11111111-1111-1111-1111-111111111111', 'consumer', 'John Smith', '+1-555-0201', 'Manhattan, NY'),
  ('22222222-2222-2222-2222-222222222222', 'consumer', 'Sarah Johnson', '+1-555-0202', 'Brooklyn, NY'),
  ('33333333-3333-3333-3333-333333333333', 'consumer', 'Michael Brown', '+1-555-0203', 'Queens, NY'),
  ('44444444-4444-4444-4444-444444444444', 'consumer', 'Emily Davis', '+1-555-0204', 'Bronx, NY'),
  ('55555555-5555-5555-5555-555555555555', 'consumer', 'David Wilson', '+1-555-0205', 'Staten Island, NY')
ON CONFLICT (id) DO NOTHING;

-- Sample doctor profiles
INSERT INTO profiles (id, role, full_name, phone, location) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'doctor', 'Dr. Jennifer Martinez', '+1-555-0301', 'Manhattan, NY'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'doctor', 'Dr. Robert Chen', '+1-555-0302', 'Brooklyn, NY'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'doctor', 'Dr. Lisa Thompson', '+1-555-0303', 'Queens, NY'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'doctor', 'Dr. Ahmed Hassan', '+1-555-0304', 'Manhattan, NY'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'doctor', 'Dr. Maria Rodriguez', '+1-555-0305', 'Brooklyn, NY'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'doctor', 'Dr. James Kim', '+1-555-0306', 'Bronx, NY'),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'doctor', 'Dr. Rachel Green', '+1-555-0307', 'Manhattan, NY'),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'doctor', 'Dr. William Taylor', '+1-555-0308', 'Queens, NY')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SECTION 4: DOCTORS DATA
-- =====================================================

-- Get specialty IDs for reference
WITH specialty_ids AS (
  SELECT name, id FROM specialties
)

INSERT INTO doctors (user_id, specialty_id, experience_years, rating, fee, bio, verified, license_number, education, certifications, languages) 
SELECT 
  profile_id,
  specialty_id,
  experience_years,
  rating,
  fee,
  bio,
  verified,
  license_number,
  education,
  certifications,
  languages
FROM (
  VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cardiology', 12, 4.8, 25000, 'Experienced cardiologist specializing in preventive cardiology and heart disease management. Board-certified with over 12 years of experience treating patients with various cardiac conditions.', true, 'MD-NY-12345', 'MD from Harvard Medical School, Cardiology Fellowship at Mayo Clinic', 'Board Certified Cardiologist, FACC', ARRAY['English', 'Spanish']),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Dermatology', 8, 4.6, 20000, 'Dermatologist with expertise in both medical and cosmetic dermatology. Specializes in skin cancer detection, acne treatment, and anti-aging procedures.', true, 'MD-NY-12346', 'MD from Johns Hopkins, Dermatology Residency at NYU', 'Board Certified Dermatologist', ARRAY['English', 'Mandarin']),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Pediatrics', 15, 4.9, 18000, 'Pediatrician dedicated to providing comprehensive healthcare for children from birth through adolescence. Special interest in childhood development and preventive care.', true, 'MD-NY-12347', 'MD from Columbia University, Pediatric Residency at Children''s Hospital of Philadelphia', 'Board Certified Pediatrician, FAAP', ARRAY['English', 'French']),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Neurology', 10, 4.7, 30000, 'Neurologist specializing in the diagnosis and treatment of disorders of the nervous system, including epilepsy, stroke, and movement disorders.', true, 'MD-NY-12348', 'MD from Stanford University, Neurology Residency at UCSF', 'Board Certified Neurologist', ARRAY['English', 'Arabic']),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Gynecology', 9, 4.5, 22000, 'Gynecologist providing comprehensive women''s healthcare including routine checkups, prenatal care, and minimally invasive surgical procedures.', true, 'MD-NY-12349', 'MD from Yale University, OB/GYN Residency at Mount Sinai', 'Board Certified OB/GYN', ARRAY['English', 'Spanish', 'Portuguese']),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Orthopedics', 14, 4.8, 28000, 'Orthopedic surgeon specializing in sports medicine, joint replacement, and trauma surgery. Treating athletes and active individuals for over 14 years.', true, 'MD-NY-12350', 'MD from University of Pennsylvania, Orthopedic Surgery Residency at Hospital for Special Surgery', 'Board Certified Orthopedic Surgeon', ARRAY['English', 'Korean']),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Psychiatry', 11, 4.6, 24000, 'Psychiatrist with expertise in treating anxiety, depression, ADHD, and other mental health conditions. Committed to providing compassionate, evidence-based care.', true, 'MD-NY-12351', 'MD from University of Chicago, Psychiatry Residency at McLean Hospital', 'Board Certified Psychiatrist', ARRAY['English']),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'General Medicine', 7, 4.4, 15000, 'Family medicine physician providing primary care for patients of all ages. Focus on preventive medicine, chronic disease management, and health education.', true, 'MD-NY-12352', 'MD from New York University, Family Medicine Residency at Montefiore', 'Board Certified Family Medicine', ARRAY['English', 'Korean'])
) AS doctor_data(profile_id, specialty_name, experience_years, rating, fee, bio, verified, license_number, education, certifications, languages)
JOIN specialty_ids ON specialty_ids.name = doctor_data.specialty_name
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- SECTION 5: DOCTOR-CLINIC ASSOCIATIONS
-- =====================================================

-- Associate doctors with clinics
WITH doctor_clinic_data AS (
  SELECT 
    d.id as doctor_id,
    c.id as clinic_id,
    is_primary,
    consultation_fee
  FROM doctors d
  JOIN profiles p ON d.user_id = p.id
  CROSS JOIN (
    SELECT id, name FROM clinics
  ) c
  CROSS JOIN (
    VALUES
    -- Dr. Jennifer Martinez (Cardiology) at multiple clinics
    ('Dr. Jennifer Martinez', 'City Medical Center', true, 25000),
    ('Dr. Jennifer Martinez', 'Westside Medical Plaza', false, 27000),
    
    -- Dr. Robert Chen (Dermatology)
    ('Dr. Robert Chen', 'Brooklyn Heights Clinic', true, 20000),
    ('Dr. Robert Chen', 'Northside Health Clinic', false, 22000),
    
    -- Dr. Lisa Thompson (Pediatrics)
    ('Dr. Lisa Thompson', 'Queens Medical Center', true, 18000),
    ('Dr. Lisa Thompson', 'Eastside Family Clinic', false, 19000),
    
    -- Dr. Ahmed Hassan (Neurology)
    ('Dr. Ahmed Hassan', 'City Medical Center', true, 30000),
    ('Dr. Ahmed Hassan', 'Central Park Medical', false, 32000),
    
    -- Dr. Maria Rodriguez (Gynecology)
    ('Dr. Maria Rodriguez', 'Brooklyn Heights Clinic', true, 22000),
    ('Dr. Maria Rodriguez', 'Bronx Community Health', false, 20000),
    
    -- Dr. James Kim (Orthopedics)
    ('Dr. James Kim', 'Bronx Community Health', true, 28000),
    ('Dr. James Kim', 'Queens Medical Center', false, 30000),
    
    -- Dr. Rachel Green (Psychiatry)
    ('Dr. Rachel Green', 'Central Park Medical', true, 24000),
    ('Dr. Rachel Green', 'Westside Medical Plaza', false, 26000),
    
    -- Dr. William Taylor (General Medicine)
    ('Dr. William Taylor', 'Eastside Family Clinic', true, 15000),
    ('Dr. William Taylor', 'Northside Health Clinic', false, 16000)
  ) AS associations(doctor_name, clinic_name, is_primary, consultation_fee)
  WHERE p.full_name = associations.doctor_name
    AND c.name = associations.clinic_name
)

INSERT INTO doctor_clinics (doctor_id, clinic_id, is_primary, consultation_fee)
SELECT doctor_id, clinic_id, is_primary, consultation_fee
FROM doctor_clinic_data
ON CONFLICT (doctor_id, clinic_id) DO NOTHING;

-- =====================================================
-- SECTION 6: AVAILABILITY SLOTS
-- =====================================================

-- Create availability slots for the next 30 days
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    INTERVAL '1 day'
  )::date AS slot_date
),
time_slots AS (
  SELECT unnest(ARRAY[
    '09:00:00'::time, '09:30:00'::time, '10:00:00'::time, '10:30:00'::time,
    '11:00:00'::time, '11:30:00'::time, '14:00:00'::time, '14:30:00'::time,
    '15:00:00'::time, '15:30:00'::time, '16:00:00'::time, '16:30:00'::time
  ]) AS start_time
),
doctor_clinics_data AS (
  SELECT 
    dc.doctor_id,
    dc.clinic_id,
    ROW_NUMBER() OVER (PARTITION BY dc.doctor_id ORDER BY dc.is_primary DESC) as clinic_priority
  FROM doctor_clinics dc
)

INSERT INTO availabilities (doctor_id, clinic_id, date, start_time, end_time, is_available, max_appointments)
SELECT 
  dcd.doctor_id,
  dcd.clinic_id,
  ds.slot_date,
  ts.start_time,
  ts.start_time + INTERVAL '30 minutes' AS end_time,
  true,
  1
FROM date_series ds
CROSS JOIN time_slots ts
CROSS JOIN doctor_clinics_data dcd
WHERE dcd.clinic_priority <= 2  -- Only create slots for primary and one secondary clinic
  AND EXTRACT(DOW FROM ds.slot_date) BETWEEN 1 AND 5  -- Monday to Friday only
  AND ds.slot_date > CURRENT_DATE  -- Only future dates
ON CONFLICT DO NOTHING;

-- =====================================================
-- SECTION 7: SAMPLE APPOINTMENTS
-- =====================================================

-- Create some sample appointments
WITH sample_appointments AS (
  SELECT 
    d.id as doctor_id,
    p.id as patient_id,
    dc.clinic_id,
    av.id as availability_id,
    av.date,
    av.start_time,
    av.end_time,
    status,
    appointment_type,
    fee_charged,
    symptoms,
    notes
  FROM (
    VALUES
    -- Upcoming appointments
    ('Dr. Jennifer Martinez', 'John Smith', 'scheduled', 'consultation', 25000, 'Chest pain and shortness of breath', 'Regular checkup requested'),
    ('Dr. Robert Chen', 'Sarah Johnson', 'confirmed', 'consultation', 20000, 'Skin rash on arms', 'Patient concerned about allergic reaction'),
    ('Dr. Lisa Thompson', 'Michael Brown', 'scheduled', 'consultation', 18000, 'Child with fever and cough', 'Annual pediatric checkup'),
    
    -- Past completed appointments
    ('Dr. Ahmed Hassan', 'Emily Davis', 'completed', 'consultation', 30000, 'Frequent headaches', 'MRI recommended'),
    ('Dr. Maria Rodriguez', 'Sarah Johnson', 'completed', 'follow_up', 22000, 'Follow-up after annual exam', 'All tests normal'),
    ('Dr. James Kim', 'David Wilson', 'completed', 'consultation', 28000, 'Knee pain after sports injury', 'Physical therapy recommended')
  ) AS appt_data(doctor_name, patient_name, status, appointment_type, fee_charged, symptoms, notes)
  JOIN profiles pd ON pd.full_name = appt_data.doctor_name AND pd.role = 'doctor'
  JOIN doctors d ON d.user_id = pd.id
  JOIN profiles pp ON pp.full_name = appt_data.patient_name AND pp.role = 'consumer'
  JOIN doctor_clinics dc ON dc.doctor_id = d.id AND dc.is_primary = true
  JOIN availabilities av ON av.doctor_id = d.id AND av.clinic_id = dc.clinic_id
  WHERE (appt_data.status IN ('scheduled', 'confirmed') AND av.date >= CURRENT_DATE)
     OR (appt_data.status = 'completed' AND av.date < CURRENT_DATE)
  ORDER BY av.date, av.start_time
  LIMIT 1  -- One appointment per doctor-patient combination
)

INSERT INTO appointments (doctor_id, patient_id, clinic_id, availability_id, date, start_time, end_time, status, appointment_type, fee_charged, symptoms, notes)
SELECT 
  doctor_id, patient_id, clinic_id, availability_id, date, start_time, end_time, 
  status, appointment_type, fee_charged, symptoms, notes
FROM sample_appointments
ON CONFLICT DO NOTHING;

-- =====================================================
-- SECTION 8: SAMPLE REVIEWS
-- =====================================================

-- Create reviews for completed appointments
WITH completed_appointments AS (
  SELECT a.id as appointment_id, a.doctor_id, a.patient_id
  FROM appointments a
  WHERE a.status = 'completed'
  LIMIT 10
)

INSERT INTO reviews (appointment_id, doctor_id, patient_id, rating, comment, punctuality_rating, treatment_satisfaction, staff_behavior, clinic_environment, is_verified)
SELECT 
  ca.appointment_id,
  ca.doctor_id,
  ca.patient_id,
  rating,
  comment,
  punctuality_rating,
  treatment_satisfaction,
  staff_behavior,
  clinic_environment,
  true
FROM completed_appointments ca
CROSS JOIN (
  VALUES
  (5, 'Excellent doctor! Very thorough examination and explained everything clearly.', 5, 5, 5, 4),
  (4, 'Good experience overall. Wait time was a bit long but worth it.', 3, 4, 4, 4),
  (5, 'Outstanding care! Highly recommend this doctor.', 5, 5, 5, 5),
  (4, 'Professional and knowledgeable. Comfortable clinic environment.', 4, 4, 4, 4),
  (3, 'Average experience. Doctor was helpful but rushed.', 4, 3, 3, 3)
) AS review_data(rating, comment, punctuality_rating, treatment_satisfaction, staff_behavior, clinic_environment)
LIMIT (SELECT COUNT(*) FROM completed_appointments);

-- =====================================================
-- SECTION 9: SAMPLE NOTIFICATIONS
-- =====================================================

-- Create some sample notifications
INSERT INTO notifications (user_id, title, message, type, data, is_read)
SELECT 
  p.id,
  title,
  message,
  type,
  data::jsonb,
  is_read
FROM profiles p
CROSS JOIN (
  VALUES
  ('Welcome to Doctor Booking App!', 'Start by exploring our verified doctors and booking your first appointment.', 'system', '{}', false),
  ('Appointment Reminder', 'You have an upcoming appointment tomorrow at 2:00 PM', 'reminder', '{"appointment_id": "sample"}', false),
  ('Profile Updated', 'Your profile information has been successfully updated.', 'system', '{}', true)
) AS notif_data(title, message, type, data, is_read)
WHERE p.role = 'consumer'
LIMIT 15;  -- 3 notifications per consumer

-- =====================================================
-- END OF SAMPLE DATA
-- =====================================================

-- Summary of inserted data:
-- - 15 Medical specialties
-- - 8 Clinic locations
-- - 5 Sample consumers (patients)
-- - 8 Sample doctors with full profiles
-- - Doctor-clinic associations
-- - 30 days of availability slots
-- - Sample appointments (scheduled, confirmed, completed)
-- - Reviews for completed appointments
-- - Sample notifications

-- IMPORTANT NOTES:
-- 1. This is TEST DATA ONLY - do not use in production
-- 2. User IDs are hardcoded - replace with actual auth.users IDs
-- 3. Phone numbers and emails are fake
-- 4. All financial amounts are in cents (divide by 100 for dollars)
-- 5. Availability slots are created for weekdays only

-- TESTING SCENARIOS:
-- 1. Login as a consumer and browse doctors
-- 2. Book appointments with available doctors
-- 3. Login as a doctor and manage appointments
-- 4. Test the review and rating system
-- 5. Check notification delivery

-- To customize this data:
-- 1. Update the UUIDs with real user IDs from your auth.users table
-- 2. Modify clinic locations for your target area
-- 3. Adjust doctor specialties and availability
-- 4. Update contact information and fees as needed

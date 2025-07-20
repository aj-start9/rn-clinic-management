-- Sample Data for Doctor Booking App
-- Run this after setting up the main schema

-- Insert sample clinics
INSERT INTO clinics (id, name, address, latitude, longitude, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'City Medical Center', '123 Main St, Downtown, New York', 40.7128, -74.0060, '+1-555-0001'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Northside Clinic', '456 Oak Ave, Northside, New York', 40.7589, -73.9851, '+1-555-0002'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Westside Health Center', '789 Pine Rd, Westside, New York', 40.7831, -73.9712, '+1-555-0003'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Eastside Medical Plaza', '321 Elm St, Eastside, New York', 40.7505, -73.9934, '+1-555-0004'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Central Hospital', '654 Maple Dr, Central, New York', 40.7282, -73.9942, '+1-555-0005');

-- Insert sample doctors (these will need real user IDs when doctors sign up)
-- For demo purposes, you can create these manually or through the app

-- First, let's create some demo doctor profiles
-- You'll need to create these users through the Supabase Auth interface or app signup

-- Sample doctor data (replace user_ids with real ones after creating accounts)
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

-- Associate doctors with clinics
INSERT INTO doctor_clinics (doctor_id, clinic_id) VALUES
  -- Dr. Sarah Johnson (Cardiology) - works at 2 clinics
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'),
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440004'),
  
  -- Dr. Michael Chen (Neurology) - works at 1 clinic
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004'),
  
  -- Dr. Emily Rodriguez (Dermatology) - works at 3 clinics
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'),
  
  -- Dr. Robert Wilson (Orthopedics) - works at 2 clinics
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003'),
  
  -- Dr. Lisa Patel (Pediatrics) - works at 2 clinics
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002'),
  
  -- Dr. James Thompson (General Medicine) - works at all clinics
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004'),
  
  -- Dr. Maria Santos (Gynecology) - works at 2 clinics
  ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002'),
  ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440004'),
  
  -- Dr. David Kim (Ophthalmology) - works at 2 clinics
  ('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003');

-- Create available slots for the next 30 days
-- This is a more complex query that creates time slots for each doctor at their clinics

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

-- Create some sample appointments (optional - for testing)
-- You'll need real user IDs for this to work
-- 
-- INSERT INTO appointments (doctor_id, user_id, clinic_id, slot_id, date, start_time, end_time, status, notes)
-- SELECT 
--     '660e8400-e29b-41d4-a716-446655440000',  -- Dr. Sarah Johnson
--     'user-id-here',  -- Replace with actual user ID
--     '550e8400-e29b-41d4-a716-446655440000',  -- City Medical Center
--     slot.id,
--     slot.date,
--     slot.start_time,
--     slot.end_time,
--     'scheduled',
--     'Regular checkup appointment'
-- FROM available_slots slot
-- WHERE slot.doctor_id = '660e8400-e29b-41d4-a716-446655440000'
--   AND slot.date = CURRENT_DATE + 1
--   AND slot.start_time = '10:00:00'
-- LIMIT 1;

-- Update slot availability after booking
-- UPDATE available_slots SET is_available = false 
-- WHERE id IN (SELECT slot_id FROM appointments WHERE slot_id IS NOT NULL);

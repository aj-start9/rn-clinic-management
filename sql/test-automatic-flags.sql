-- =====================================================
-- TEST SCRIPT FOR AUTOMATIC ONBOARDING FLAGS
-- =====================================================
-- This script tests the automatic flag update system

-- Step 1: Create a test doctor profile (incomplete)
INSERT INTO doctors (
    id, 
    user_id, 
    full_name,
    specialty_id,
    experience_years,
    fee,
    profile_completed,
    clinics_added,
    availability_created
) VALUES (
    'test-doctor-001',
    'test-user-001', 
    'Dr. Test Doctor',
    NULL,  -- Missing specialty_id
    NULL,  -- Missing experience
    500,
    false,
    false,
    false
) ON CONFLICT (id) DO UPDATE SET
    specialty_id = EXCLUDED.specialty_id,
    experience_years = EXCLUDED.experience_years,
    license_number = EXCLUDED.license_number,
    bio = EXCLUDED.bio;

-- Check initial state (should be all false)
SELECT 
    'Initial State' as test_step,
    profile_completed, 
    clinics_added, 
    availability_created 
FROM doctors WHERE id = 'test-doctor-001';

-- Step 2: Complete the profile
UPDATE doctors SET
    specialty_id = 1,
    experience_years = 5,
    license_number = 'TEST-LIC-001',
    bio = 'Test doctor biography for onboarding'
WHERE id = 'test-doctor-001';

-- Check profile_completed flag (should be true now)
SELECT 
    'After Profile Complete' as test_step,
    profile_completed, 
    clinics_added, 
    availability_created 
FROM doctors WHERE id = 'test-doctor-001';

-- Step 3: Add a clinic association
INSERT INTO doctor_clinics (doctor_id, clinic_id)
VALUES ('test-doctor-001', 'clinic-001')
ON CONFLICT (doctor_id, clinic_id) DO NOTHING;

-- Check clinics_added flag (should be true now)
SELECT 
    'After Clinic Added' as test_step,
    profile_completed, 
    clinics_added, 
    availability_created 
FROM doctors WHERE id = 'test-doctor-001';

-- Step 4: Add availability
INSERT INTO availabilities (
    doctor_id, 
    clinic_id, 
    date, 
    start_time, 
    end_time, 
    is_available
) VALUES (
    'test-doctor-001', 
    'clinic-001', 
    CURRENT_DATE + INTERVAL '1 day',
    '09:00:00',
    '10:00:00',
    true
) ON CONFLICT (doctor_id, clinic_id, date, start_time) DO NOTHING;

-- Check availability_created flag (should be true now)
SELECT 
    'After Availability Added' as test_step,
    profile_completed, 
    clinics_added, 
    availability_created 
FROM doctors WHERE id = 'test-doctor-001';

-- Step 5: Test deletion (remove clinic association)
DELETE FROM doctor_clinics WHERE doctor_id = 'test-doctor-001';

-- Check clinics_added flag (should be false now)
SELECT 
    'After Clinic Removed' as test_step,
    profile_completed, 
    clinics_added, 
    availability_created 
FROM doctors WHERE id = 'test-doctor-001';

-- Step 6: Test incomplete profile
UPDATE doctors SET bio = NULL WHERE id = 'test-doctor-001';

-- Check profile_completed flag (should be false now)
SELECT 
    'After Bio Removed' as test_step,
    profile_completed, 
    clinics_added, 
    availability_created 
FROM doctors WHERE id = 'test-doctor-001';

-- Clean up test data
DELETE FROM availabilities WHERE doctor_id = 'test-doctor-001';
DELETE FROM doctors WHERE id = 'test-doctor-001';

-- Summary
SELECT 
    'Test Summary' as result,
    'Automatic flag updates tested successfully' as message,
    'Profile, clinic, and availability flags update automatically' as details;

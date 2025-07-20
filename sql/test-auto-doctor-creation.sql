-- =====================================================
-- TEST AUTO DOCTOR PROFILE CREATION
-- =====================================================
-- This file demonstrates how the automatic doctor profile creation works

-- 1. Test creating a consumer profile (should NOT create doctor record)
INSERT INTO profiles (id, role, full_name, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'consumer',
    'John Consumer',
    NOW(),
    NOW()
);

-- 2. Test creating a doctor profile (should automatically create doctor record)
INSERT INTO profiles (id, role, full_name, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'doctor',
    'Dr. Jane Smith',
    NOW(),
    NOW()
);

-- 3. Check the results
SELECT 
    p.id as profile_id,
    p.role,
    p.full_name as profile_name,
    d.id as doctor_id,
    d.full_name as doctor_name,
    d.profile_completed,
    d.clinics_added,
    d.availability_created
FROM profiles p
LEFT JOIN doctors d ON p.id = d.user_id
WHERE p.full_name IN ('John Consumer', 'Dr. Jane Smith')
ORDER BY p.role;

-- Expected result:
-- - John Consumer: profile_id filled, doctor_id is NULL
-- - Dr. Jane Smith: profile_id filled, doctor_id filled, all flags = false

-- 4. Test role change (change consumer to doctor)
UPDATE profiles 
SET role = 'doctor', full_name = 'Dr. John (Changed Role)'
WHERE full_name = 'John Consumer';

-- 5. Check if doctor record was created for the role change
SELECT 
    p.id as profile_id,
    p.role,
    p.full_name as profile_name,
    d.id as doctor_id,
    d.full_name as doctor_name,
    d.profile_completed,
    d.clinics_added,
    d.availability_created
FROM profiles p
LEFT JOIN doctors d ON p.id = d.user_id
WHERE p.full_name LIKE '%John%' OR p.full_name LIKE '%Jane%'
ORDER BY p.role, p.full_name;

-- Clean up test data (optional)
-- DELETE FROM doctors WHERE full_name IN ('Dr. Jane Smith', 'Dr. John (Changed Role)');
-- DELETE FROM profiles WHERE full_name IN ('Dr. Jane Smith', 'Dr. John (Changed Role)');

-- Test script to demonstrate how doctor_id and clinic_id are obtained in the trigger

-- Step 1: Insert a clinic with created_by field (this is done by the frontend service)
-- Replace 'your-doctor-uuid-here' with an actual doctor ID from your doctors table
INSERT INTO clinics (name, address, phone, email, created_by)
VALUES ('Test Clinic', '123 Main St', '555-0123', 'test@clinic.com', 'your-doctor-uuid-here');

-- Step 2: The trigger automatically executes and does this:
-- IF NEW.created_by IS NOT NULL THEN
--   INSERT INTO doctor_clinics (doctor_id, clinic_id)
--   VALUES (NEW.created_by, NEW.id);
-- END IF;

-- Step 3: Verify the association was created
SELECT dc.*, c.name as clinic_name, d.full_name as doctor_name
FROM doctor_clinics dc
JOIN clinics c ON dc.clinic_id = c.id
JOIN doctors d ON dc.doctor_id = d.id
WHERE c.name = 'Test Clinic';

-- Expected result: You should see a row with:
-- - doctor_id: the UUID you provided in created_by field
-- - clinic_id: the ID of the newly created clinic
-- - clinic_name: 'Test Clinic'
-- - doctor_name: the name of the doctor

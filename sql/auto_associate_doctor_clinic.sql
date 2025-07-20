-- Auto-associate doctor with clinic when created
-- This trigger will automatically create a doctor_clinic association 
-- when a doctor creates a new clinic using created_by field

-- First, add created_by field to clinics table if it doesn't exist
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES doctors(id);

-- Function that uses created_by field to get doctor_id
CREATE OR REPLACE FUNCTION auto_associate_doctor_with_clinic()
RETURNS TRIGGER AS $$
BEGIN
  -- If clinic has a created_by field (doctor who created it), create the association
  -- doctor_id comes from NEW.created_by field
  -- clinic_id comes from NEW.id (the newly created clinic)
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO doctor_clinics (doctor_id, clinic_id)
    VALUES (NEW.created_by, NEW.id)
    ON CONFLICT (doctor_id, clinic_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_associate_doctor_clinic ON clinics;
CREATE TRIGGER trigger_auto_associate_doctor_clinic
  AFTER INSERT ON clinics
  FOR EACH ROW
  EXECUTE FUNCTION auto_associate_doctor_with_clinic();

-- How this works:
-- 1. Frontend calls regular createClinic(clinicData) with created_by field
-- 2. Clinic gets inserted into clinics table with created_by = doctor_id
-- 3. Trigger fires and reads NEW.created_by for doctor_id
-- 4. Trigger inserts (doctor_id=NEW.created_by, clinic_id=NEW.id) into doctor_clinics
-- 5. No session variables or frontend logic needed!

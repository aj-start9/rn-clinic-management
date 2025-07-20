-- =====================================================
-- CHECK AND FIX AVAILABILITY TABLE NAME
-- =====================================================
-- This script handles both old (available_slots) and new (availabilities) table names

-- Check if we have the old table name and rename it
DO $$
BEGIN
    -- Check if available_slots table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'available_slots') THEN
        -- Rename the table to the new name
        ALTER TABLE available_slots RENAME TO availabilities;
        RAISE NOTICE 'Renamed available_slots table to availabilities';
    END IF;
    
    -- Check if availabilities table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'availabilities') THEN
        RAISE EXCEPTION 'Neither available_slots nor availabilities table found. Please run database-schema-complete.sql first.';
    END IF;
END $$;

-- Now run the onboarding flags update with the correct table name
-- Add onboarding completion flags to doctors table
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinics_added BOOLEAN DEFAULT false;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS availability_created BOOLEAN DEFAULT false;

-- Update existing doctors to have profile_completed = true if they have required fields
UPDATE doctors 
SET profile_completed = true 
WHERE specialty_id IS NOT NULL 
  AND experience_years IS NOT NULL 
  AND license_number IS NOT NULL 
  AND bio IS NOT NULL;

-- Update clinics_added flag for doctors who already have clinic associations
UPDATE doctors 
SET clinics_added = true 
WHERE id IN (
  SELECT DISTINCT doctor_id 
  FROM doctor_clinics
);

-- Update availability_created flag for doctors who already have availability slots
-- (This will work with either table name after the rename above)
UPDATE doctors 
SET availability_created = true 
WHERE id IN (
  SELECT DISTINCT doctor_id 
  FROM availabilities
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_doctors_onboarding_flags 
ON doctors(profile_completed, clinics_added, availability_created);

-- Comments for documentation
COMMENT ON COLUMN doctors.profile_completed IS 'True when doctor has completed profile with required fields';
COMMENT ON COLUMN doctors.clinics_added IS 'True when doctor has been associated with at least one clinic';
COMMENT ON COLUMN doctors.availability_created IS 'True when doctor has created at least one availability slot';

-- Show final status
DO $$
DECLARE
    doctors_count INTEGER;
    profile_completed_count INTEGER;
    clinics_added_count INTEGER;
    availability_created_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO doctors_count FROM doctors;
    SELECT COUNT(*) INTO profile_completed_count FROM doctors WHERE profile_completed = true;
    SELECT COUNT(*) INTO clinics_added_count FROM doctors WHERE clinics_added = true;
    SELECT COUNT(*) INTO availability_created_count FROM doctors WHERE availability_created = true;
    
    RAISE NOTICE 'Onboarding flags update complete:';
    RAISE NOTICE 'Total doctors: %', doctors_count;
    RAISE NOTICE 'Profile completed: %', profile_completed_count;
    RAISE NOTICE 'Clinics added: %', clinics_added_count;
    RAISE NOTICE 'Availability created: %', availability_created_count;
END $$;

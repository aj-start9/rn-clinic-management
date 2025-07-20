-- =====================================================
-- ADD ONBOARDING FLAGS TO DOCTORS TABLE
-- =====================================================
-- Run this to add tracking flags for doctor onboarding completion

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

-- =====================================================
-- AUTOMATIC DOCTOR ONBOARDING FLAGS TRIGGERS
-- =====================================================
-- This script creates triggers that automatically update doctor onboarding flags
-- when the required conditions are met, eliminating the need for frontend updates.

-- Function to update profile_completed flag
CREATE OR REPLACE FUNCTION update_profile_completed_flag()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profile_completed flag based on required fields
    NEW.profile_completed := (
        NEW.specialty_id IS NOT NULL AND
        NEW.experience_years IS NOT NULL AND
        NEW.license_number IS NOT NULL AND
        NEW.bio IS NOT NULL AND
        trim(NEW.bio) != ''
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update clinics_added flag for a doctor
CREATE OR REPLACE FUNCTION update_clinics_added_flag(doctor_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE doctors 
    SET clinics_added = EXISTS (
        SELECT 1 FROM doctor_clinics 
        WHERE doctor_id = doctor_id_param
    )
    WHERE id = doctor_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to update availability_created flag for a doctor
CREATE OR REPLACE FUNCTION update_availability_created_flag(doctor_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE doctors 
    SET availability_created = EXISTS (
        SELECT 1 FROM availabilities 
        WHERE doctor_id = doctor_id_param
    )
    WHERE id = doctor_id_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger for doctors table (profile_completed)
DROP TRIGGER IF EXISTS trigger_update_profile_completed ON doctors;
CREATE TRIGGER trigger_update_profile_completed
    BEFORE INSERT OR UPDATE ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completed_flag();

-- Trigger function for doctor_clinics table
CREATE OR REPLACE FUNCTION trigger_update_clinics_added_flag()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_clinics_added_flag(NEW.doctor_id);
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        PERFORM update_clinics_added_flag(OLD.doctor_id);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for doctor_clinics table (clinics_added)
DROP TRIGGER IF EXISTS trigger_update_clinics_added ON doctor_clinics;
CREATE TRIGGER trigger_update_clinics_added
    AFTER INSERT OR UPDATE OR DELETE ON doctor_clinics
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_clinics_added_flag();

-- Trigger function for availabilities table
CREATE OR REPLACE FUNCTION trigger_update_availability_created_flag()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_availability_created_flag(NEW.doctor_id);
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        PERFORM update_availability_created_flag(OLD.doctor_id);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for availabilities table (availability_created)
DROP TRIGGER IF EXISTS trigger_update_availability_created ON availabilities;
CREATE TRIGGER trigger_update_availability_created
    AFTER INSERT OR UPDATE OR DELETE ON availabilities
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_availability_created_flag();

-- Update all existing doctors to have correct flag values
-- This ensures existing data is properly flagged
UPDATE doctors 
SET profile_completed = (
    specialty_id IS NOT NULL AND
    experience_years IS NOT NULL AND
    license_number IS NOT NULL AND
    bio IS NOT NULL AND
    trim(bio) != ''
);

-- Update clinics_added flag for all existing doctors
UPDATE doctors 
SET clinics_added = EXISTS (
    SELECT 1 FROM doctor_clinics 
    WHERE doctor_clinics.doctor_id = doctors.id
);

-- Update availability_created flag for all existing doctors
UPDATE doctors 
SET availability_created = EXISTS (
    SELECT 1 FROM availabilities 
    WHERE availabilities.doctor_id = doctors.id
);

-- Create an index for better performance on onboarding queries
CREATE INDEX IF NOT EXISTS idx_doctors_onboarding_status 
ON doctors(profile_completed, clinics_added, availability_created, user_id);

-- Add helpful comments
COMMENT ON FUNCTION update_profile_completed_flag() IS 'Automatically updates profile_completed flag when doctor profile fields change';
COMMENT ON FUNCTION update_clinics_added_flag(UUID) IS 'Updates clinics_added flag when doctor-clinic associations change';
COMMENT ON FUNCTION update_availability_created_flag(UUID) IS 'Updates availability_created flag when doctor availability changes';

-- Verification query to show current onboarding status
DO $$
DECLARE
    total_doctors INTEGER;
    profile_completed_count INTEGER;
    clinics_added_count INTEGER;
    availability_created_count INTEGER;
    fully_onboarded_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_doctors FROM doctors;
    SELECT COUNT(*) INTO profile_completed_count FROM doctors WHERE profile_completed = true;
    SELECT COUNT(*) INTO clinics_added_count FROM doctors WHERE clinics_added = true;
    SELECT COUNT(*) INTO availability_created_count FROM doctors WHERE availability_created = true;
    SELECT COUNT(*) INTO fully_onboarded_count FROM doctors 
    WHERE profile_completed = true AND clinics_added = true AND availability_created = true;
    
    RAISE NOTICE '=== ONBOARDING TRIGGERS SETUP COMPLETE ===';
    RAISE NOTICE 'Total doctors: %', total_doctors;
    RAISE NOTICE 'Profile completed: %', profile_completed_count;
    RAISE NOTICE 'Clinics added: %', clinics_added_count;
    RAISE NOTICE 'Availability created: %', availability_created_count;
    RAISE NOTICE 'Fully onboarded: %', fully_onboarded_count;
    RAISE NOTICE '==========================================';
END $$;

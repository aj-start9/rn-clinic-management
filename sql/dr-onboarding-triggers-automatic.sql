-- =====================================================
-- AUTOMATIC DOCTOR ONBOARDING FLAGS TRIGGERS
-- =====================================================
-- This script creates triggers that automatically update doctor onboarding flags
-- when the required conditions are met, eliminating the need for frontend updates.

-- =====================================================
-- AUTO-CREATE DOCTOR PROFILE TRIGGER
-- =====================================================
-- Function to automatically create doctor profile when user with role 'doctor' creates profile
CREATE OR REPLACE FUNCTION auto_create_doctor_profile()
RETURNS TRIGGER 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Only create doctor profile if role is 'doctor'
    IF NEW.role = 'doctor' THEN
        INSERT INTO public.doctors (
            id,
            user_id,
            full_name,
            profile_completed,
            clinics_added,
            availability_created,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            NEW.id,
            COALESCE(NEW.full_name, ''),
            false,  -- Will be updated by triggers when profile is completed
            false,  -- Will be updated by triggers when clinics are added
            false,  -- Will be updated by triggers when availability is created
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Auto-created doctor profile for user: %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create doctor profile when profile is created
DROP TRIGGER IF EXISTS trigger_auto_create_doctor_profile ON profiles;
CREATE TRIGGER trigger_auto_create_doctor_profile
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_doctor_profile();

-- Function to handle role changes (if someone updates their role to 'doctor')
CREATE OR REPLACE FUNCTION handle_role_change_to_doctor()
RETURNS TRIGGER 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- If role changed from non-doctor to doctor
    IF OLD.role != 'doctor' AND NEW.role = 'doctor' THEN
        -- Check if doctor profile doesn't already exist
        IF NOT EXISTS (SELECT 1 FROM public.doctors WHERE user_id = NEW.id) THEN
            INSERT INTO public.doctors (
                id,
                user_id,
                full_name,
                profile_completed,
                clinics_added,
                availability_created,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                NEW.id,
                COALESCE(NEW.full_name, ''),
                false,
                false,
                false,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Auto-created doctor profile for role change: %', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for role changes
DROP TRIGGER IF EXISTS trigger_handle_role_change_to_doctor ON profiles;
CREATE TRIGGER trigger_handle_role_change_to_doctor
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_role_change_to_doctor();

-- =====================================================
-- DOCTOR ONBOARDING FLAGS TRIGGERS
-- =====================================================

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
COMMENT ON FUNCTION auto_create_doctor_profile() IS 'Automatically creates doctor record when user profile with role=doctor is created';
COMMENT ON FUNCTION handle_role_change_to_doctor() IS 'Creates doctor record when user role is changed to doctor';
COMMENT ON FUNCTION update_profile_completed_flag() IS 'Automatically updates profile_completed flag when doctor profile fields change';
COMMENT ON FUNCTION update_clinics_added_flag(UUID) IS 'Updates clinics_added flag when doctor-clinic associations change';
COMMENT ON FUNCTION update_availability_created_flag(UUID) IS 'Updates availability_created flag when doctor availability changes';

-- =====================================================
-- SHOW EXISTING PROFILES DATA AND CREATE DOCTORS
-- =====================================================

-- Query to show all existing profiles in the database
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    RAISE NOTICE '=== EXISTING PROFILES DATA ===';
    
    FOR profile_record IN 
        SELECT 
            id,
            full_name,
            email,
            role,
            created_at,
            CASE 
                WHEN EXISTS (SELECT 1 FROM doctors WHERE user_id = profiles.id) 
                THEN 'YES' 
                ELSE 'NO' 
            END as has_doctor_record
        FROM profiles 
        ORDER BY created_at DESC
    LOOP
        RAISE NOTICE 'Profile ID: % | Name: % | Email: % | Role: % | Doctor Record: % | Created: %', 
            profile_record.id, 
            COALESCE(profile_record.full_name, 'No Name'), 
            COALESCE(profile_record.email, 'No Email'), 
            COALESCE(profile_record.role, 'No Role'),
            profile_record.has_doctor_record,
            profile_record.created_at;
    END LOOP;
    
    RAISE NOTICE '================================';
END $$;

-- Query to show profiles with role 'doctor' that need doctor records created
DO $$
DECLARE
    doctor_profile_record RECORD;
    profiles_to_create INTEGER;
BEGIN
    SELECT COUNT(*) INTO profiles_to_create 
    FROM profiles p
    WHERE p.role = 'doctor'
    AND NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = p.id);
    
    RAISE NOTICE '=== DOCTOR PROFILES TO CREATE ===';
    RAISE NOTICE 'Found % doctor profiles that need doctor records created', profiles_to_create;
    
    IF profiles_to_create > 0 THEN
        FOR doctor_profile_record IN 
            SELECT 
                id,
                full_name,
                email,
                role,
                created_at
            FROM profiles p
            WHERE p.role = 'doctor'
            AND NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = p.id)
            ORDER BY created_at DESC
        LOOP
            RAISE NOTICE 'Will create doctor record for: ID=% | Name=% | Email=%', 
                doctor_profile_record.id, 
                COALESCE(doctor_profile_record.full_name, 'No Name'),
                COALESCE(doctor_profile_record.email, 'No Email');
        END LOOP;
    ELSE
        RAISE NOTICE 'All doctor profiles already have doctor records created.';
    END IF;
    
    RAISE NOTICE '==================================';
END $$;

-- Create doctor profiles for existing users with role 'doctor' who don't have doctor records
INSERT INTO doctors (id, user_id, full_name, profile_completed, clinics_added, availability_created, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    p.id,
    COALESCE(p.full_name, ''),
    false,
    false,
    false,
    NOW(),
    NOW()
FROM profiles p
WHERE p.role = 'doctor'
AND NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = p.id);

-- Show confirmation of created doctor records
DO $$
DECLARE
    created_count INTEGER;
BEGIN
    GET DIAGNOSTICS created_count = ROW_COUNT;
    RAISE NOTICE '=== DOCTOR RECORDS CREATION SUMMARY ===';
    RAISE NOTICE 'Successfully created % doctor records from existing profiles', created_count;
    RAISE NOTICE '=======================================';
END $$;

-- Verification query to show current onboarding status
DO $$
DECLARE
    total_profiles INTEGER;
    total_doctor_profiles INTEGER;
    total_doctors INTEGER;
    profile_completed_count INTEGER;
    clinics_added_count INTEGER;
    availability_created_count INTEGER;
    fully_onboarded_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_profiles FROM profiles;
    SELECT COUNT(*) INTO total_doctor_profiles FROM profiles WHERE role = 'doctor';
    SELECT COUNT(*) INTO total_doctors FROM doctors;
    SELECT COUNT(*) INTO profile_completed_count FROM doctors WHERE profile_completed = true;
    SELECT COUNT(*) INTO clinics_added_count FROM doctors WHERE clinics_added = true;
    SELECT COUNT(*) INTO availability_created_count FROM doctors WHERE availability_created = true;
    SELECT COUNT(*) INTO fully_onboarded_count FROM doctors 
    WHERE profile_completed = true AND clinics_added = true AND availability_created = true;
    
    RAISE NOTICE '=== ONBOARDING TRIGGERS SETUP COMPLETE ===';
    RAISE NOTICE 'Total profiles: %', total_profiles;
    RAISE NOTICE 'Doctor profiles: %', total_doctor_profiles;
    RAISE NOTICE 'Doctor records: %', total_doctors;
    RAISE NOTICE 'Profile completed: %', profile_completed_count;
    RAISE NOTICE 'Clinics added: %', clinics_added_count;
    RAISE NOTICE 'Availability created: %', availability_created_count;
    RAISE NOTICE 'Fully onboarded: %', fully_onboarded_count;
    RAISE NOTICE '==========================================';
END $$;

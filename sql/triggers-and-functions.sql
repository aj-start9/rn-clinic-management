-- =====================================================
-- DOCTOR BOOKING APP - TRIGGERS AND FUNCTIONS
-- =====================================================
-- 
-- This file contains all database functions, triggers, and
-- automation logic for the Doctor Booking App.
-- 
-- PREREQUISITES:
-- - database-schema-complete.sql must be executed first
-- - rls-policies-complete.sql should be executed first
-- 
-- FEATURES:
-- - Automatic profile creation on user signup
-- - Timestamp updates
-- - Rating calculations
-- - Availability management
-- - Audit logging
-- - Notification triggers
--
-- EXECUTION: Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- SECTION 1: UTILITY FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a clean slug from text
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 2: PROFILE MANAGEMENT
-- =====================================================

-- Function to automatically create profile after user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Extract role and name from user metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'consumer');
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Insert profile
  INSERT INTO profiles (id, role, full_name)
  VALUES (NEW.id, user_role, user_name);
  
  -- If user is a doctor, create initial doctor record
  IF user_role = 'doctor' THEN
    INSERT INTO doctors (user_id, verified)
    VALUES (NEW.id, false);
  END IF;
  
  -- Create welcome notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.id,
    'Welcome to Doctor Booking App!',
    CASE 
      WHEN user_role = 'doctor' THEN 'Complete your profile to start accepting appointments.'
      ELSE 'Find and book appointments with verified doctors.'
    END,
    'system'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- SECTION 2B: AUTO DOCTOR PROFILE CREATION
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
-- SECTION 3: TIMESTAMP TRIGGERS
-- =====================================================

-- Apply updated_at triggers to relevant tables

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at 
  BEFORE UPDATE ON clinics
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at 
  BEFORE UPDATE ON doctors
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availabilities_updated_at 
  BEFORE UPDATE ON availabilities
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON appointments
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 4: RATING CALCULATION
-- =====================================================

-- Function to recalculate doctor's average rating
CREATE OR REPLACE FUNCTION calculate_doctor_rating(doctor_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  SELECT ROUND(AVG(rating)::numeric, 2)
  INTO avg_rating
  FROM reviews
  WHERE doctor_id = doctor_uuid AND is_verified = true;
  
  -- Update doctor's rating
  UPDATE doctors 
  SET rating = COALESCE(avg_rating, 0.0)
  WHERE id = doctor_uuid;
  
  RETURN COALESCE(avg_rating, 0.0);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update doctor rating when review is added/updated
CREATE OR REPLACE FUNCTION update_doctor_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate rating for the doctor
  PERFORM calculate_doctor_rating(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.doctor_id 
      ELSE NEW.doctor_id 
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_rating();

-- =====================================================
-- SECTION 5: AVAILABILITY MANAGEMENT
-- =====================================================

-- Function to automatically manage availability when appointment is booked
CREATE OR REPLACE FUNCTION manage_availability_on_appointment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status IN ('scheduled', 'confirmed') THEN
    -- Mark availability slot as unavailable if it reaches max capacity
    UPDATE availabilities 
    SET is_available = CASE
      WHEN (
        SELECT COUNT(*) 
        FROM appointments 
        WHERE availability_id = NEW.availability_id 
          AND status IN ('scheduled', 'confirmed')
      ) >= max_appointments THEN false
      ELSE is_available
    END
    WHERE id = NEW.availability_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- If appointment is cancelled, make slot available again
    IF OLD.status IN ('scheduled', 'confirmed') AND NEW.status = 'cancelled' THEN
      UPDATE availabilities 
      SET is_available = true
      WHERE id = NEW.availability_id;
    END IF;
    
    -- If appointment is rescheduled to confirmed, handle availability
    IF OLD.status = 'scheduled' AND NEW.status = 'confirmed' THEN
      -- Could add specific logic here
      NULL;
    END IF;
    
  ELSIF TG_OP = 'DELETE' AND OLD.status IN ('scheduled', 'confirmed') THEN
    -- Make slot available when appointment is deleted
    UPDATE availabilities 
    SET is_available = true
    WHERE id = OLD.availability_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manage_availability_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION manage_availability_on_appointment();

-- =====================================================
-- SECTION 6: NOTIFICATION AUTOMATION
-- =====================================================

-- Function to create appointment notifications
CREATE OR REPLACE FUNCTION create_appointment_notifications()
RETURNS TRIGGER AS $$
DECLARE
  doctor_user_id UUID;
  patient_name TEXT;
  doctor_name TEXT;
  appointment_date_str TEXT;
BEGIN
  -- Get doctor's user_id and names
  SELECT d.user_id, p_doctor.full_name, p_patient.full_name
  INTO doctor_user_id, doctor_name, patient_name
  FROM doctors d
  JOIN profiles p_doctor ON d.user_id = p_doctor.id
  JOIN profiles p_patient ON p_patient.id = NEW.patient_id
  WHERE d.id = NEW.doctor_id;
  
  -- Format appointment date
  appointment_date_str := to_char(NEW.date, 'Month DD, YYYY') || ' at ' || to_char(NEW.start_time, 'HH12:MI AM');
  
  IF TG_OP = 'INSERT' THEN
    -- Notify patient about new appointment
    INSERT INTO notifications (user_id, title, message, type, data)
    VALUES (
      NEW.patient_id,
      'Appointment Scheduled',
      'Your appointment with Dr. ' || doctor_name || ' is scheduled for ' || appointment_date_str,
      'appointment',
      json_build_object('appointment_id', NEW.id, 'action', 'scheduled')
    );
    
    -- Notify doctor about new appointment
    INSERT INTO notifications (user_id, title, message, type, data)
    VALUES (
      doctor_user_id,
      'New Appointment',
      'New appointment with ' || patient_name || ' scheduled for ' || appointment_date_str,
      'appointment',
      json_build_object('appointment_id', NEW.id, 'action', 'scheduled')
    );
    
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Notify on status changes
    IF NEW.status = 'confirmed' THEN
      INSERT INTO notifications (user_id, title, message, type, data)
      VALUES (
        NEW.patient_id,
        'Appointment Confirmed',
        'Your appointment with Dr. ' || doctor_name || ' on ' || appointment_date_str || ' has been confirmed.',
        'appointment',
        json_build_object('appointment_id', NEW.id, 'action', 'confirmed')
      );
      
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO notifications (user_id, title, message, type, data)
      VALUES (
        NEW.patient_id,
        'Appointment Cancelled',
        'Your appointment with Dr. ' || doctor_name || ' on ' || appointment_date_str || ' has been cancelled.',
        'cancellation',
        json_build_object('appointment_id', NEW.id, 'action', 'cancelled')
      ),
      (
        doctor_user_id,
        'Appointment Cancelled',
        'Appointment with ' || patient_name || ' on ' || appointment_date_str || ' has been cancelled.',
        'cancellation',
        json_build_object('appointment_id', NEW.id, 'action', 'cancelled')
      );
      
    ELSIF NEW.status = 'completed' THEN
      INSERT INTO notifications (user_id, title, message, type, data)
      VALUES (
        NEW.patient_id,
        'Appointment Completed',
        'Your appointment with Dr. ' || doctor_name || ' has been completed. Please leave a review!',
        'appointment',
        json_build_object('appointment_id', NEW.id, 'action', 'completed')
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_notifications_trigger
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notifications();

-- =====================================================
-- SECTION 7: REMINDER NOTIFICATIONS
-- =====================================================

-- Function to create appointment reminders (to be called by cron job)
CREATE OR REPLACE FUNCTION create_appointment_reminders()
RETURNS void AS $$
DECLARE
  appointment_record RECORD;
  doctor_name TEXT;
  reminder_time TIMESTAMP;
BEGIN
  -- Find appointments tomorrow that need reminders
  FOR appointment_record IN
    SELECT a.*, p.full_name as patient_name
    FROM appointments a
    JOIN profiles p ON a.patient_id = p.id
    WHERE a.date = CURRENT_DATE + INTERVAL '1 day'
      AND a.status IN ('scheduled', 'confirmed')
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = a.patient_id
          AND n.type = 'reminder'
          AND (n.data->>'appointment_id')::uuid = a.id
          AND DATE(n.created_at) = CURRENT_DATE
      )
  LOOP
    -- Get doctor name
    SELECT p.full_name INTO doctor_name
    FROM doctors d
    JOIN profiles p ON d.user_id = p.id
    WHERE d.id = appointment_record.doctor_id;
    
    -- Create reminder notification
    INSERT INTO notifications (user_id, title, message, type, data, scheduled_at)
    VALUES (
      appointment_record.patient_id,
      'Appointment Reminder',
      'You have an appointment with Dr. ' || doctor_name || ' tomorrow at ' || 
      to_char(appointment_record.start_time, 'HH12:MI AM'),
      'reminder',
      json_build_object('appointment_id', appointment_record.id),
      CURRENT_DATE + TIME '08:00:00' -- Send at 8 AM
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 8: AUDIT LOGGING
-- =====================================================

-- Function to log important changes
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  changed_fields TEXT[];
BEGIN
  -- Convert row data to JSON
  IF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Find changed fields
    SELECT array_agg(key)
    INTO changed_fields
    FROM jsonb_each(new_data)
    WHERE key != 'updated_at' 
      AND (old_data->>key IS DISTINCT FROM new_data->>key);
  
  ELSIF TG_OP = 'INSERT' THEN
    new_data := to_jsonb(NEW);
    
  ELSIF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    table_name,
    operation,
    record_id,
    user_id,
    old_values,
    new_values,
    changed_fields
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN (old_data->>'id')::uuid
      ELSE (new_data->>'id')::uuid
    END,
    auth.uid(),
    old_data,
    new_data,
    changed_fields
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

CREATE TRIGGER audit_doctors
  AFTER INSERT OR UPDATE OR DELETE ON doctors
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

CREATE TRIGGER audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- =====================================================
-- SECTION 9: VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate appointment booking
CREATE OR REPLACE FUNCTION validate_appointment_booking()
RETURNS TRIGGER AS $$
DECLARE
  availability_record RECORD;
  doctor_record RECORD;
  appointment_count INTEGER;
BEGIN
  -- Check if availability slot exists and is available
  SELECT * INTO availability_record
  FROM availabilities
  WHERE id = NEW.availability_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Availability slot not found';
  END IF;
  
  IF NOT availability_record.is_available THEN
    RAISE EXCEPTION 'This time slot is no longer available';
  END IF;
  
  -- Check if doctor is verified
  SELECT * INTO doctor_record
  FROM doctors
  WHERE id = NEW.doctor_id;
  
  IF NOT doctor_record.verified THEN
    RAISE EXCEPTION 'Cannot book with unverified doctor';
  END IF;
  
  -- Check for double booking
  SELECT COUNT(*) INTO appointment_count
  FROM appointments
  WHERE availability_id = NEW.availability_id
    AND status IN ('scheduled', 'confirmed');
  
  IF appointment_count >= availability_record.max_appointments THEN
    RAISE EXCEPTION 'This time slot is fully booked';
  END IF;
  
  -- Set fee charged from doctor's current fee
  NEW.fee_charged := doctor_record.fee;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_appointment_trigger
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_booking();

-- =====================================================
-- SECTION 10: UTILITY VIEWS
-- =====================================================

-- View for appointment details with all related information
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
  a.*,
  p_patient.full_name as patient_name,
  p_patient.phone as patient_phone,
  p_doctor.full_name as doctor_name,
  d.specialty_id,
  s.name as specialty_name,
  c.name as clinic_name,
  c.address as clinic_address,
  av.max_appointments
FROM appointments a
JOIN profiles p_patient ON a.patient_id = p_patient.id
JOIN doctors d ON a.doctor_id = d.id
JOIN profiles p_doctor ON d.user_id = p_doctor.id
LEFT JOIN specialties s ON d.specialty_id = s.id
LEFT JOIN clinics c ON a.clinic_id = c.id
LEFT JOIN availabilities av ON a.availability_id = av.id;

-- Grant access to the view
GRANT SELECT ON appointment_details TO authenticated;

-- =====================================================
-- SECTION 11: CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND is_read = true;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired availability slots
CREATE OR REPLACE FUNCTION cleanup_expired_availability()
RETURNS void AS $$
BEGIN
  DELETE FROM availabilities
  WHERE date < CURRENT_DATE - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 12: STATISTICS FUNCTIONS
-- =====================================================

-- Function to get doctor statistics
CREATE OR REPLACE FUNCTION get_doctor_stats(doctor_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_appointments', COALESCE(total_appts, 0),
    'completed_appointments', COALESCE(completed_appts, 0),
    'average_rating', COALESCE(avg_rating, 0),
    'total_reviews', COALESCE(review_count, 0),
    'this_month_appointments', COALESCE(month_appts, 0)
  ) INTO stats
  FROM (
    SELECT 
      COUNT(*) as total_appts,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_appts,
      COUNT(*) FILTER (WHERE date >= date_trunc('month', CURRENT_DATE)) as month_appts
    FROM appointments
    WHERE doctor_id = doctor_uuid
  ) a
  CROSS JOIN (
    SELECT 
      AVG(rating) as avg_rating,
      COUNT(*) as review_count
    FROM reviews
    WHERE doctor_id = doctor_uuid
  ) r;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- END OF TRIGGERS AND FUNCTIONS
-- =====================================================

-- CRON JOBS (to be set up in Supabase):
-- 1. Daily reminder notifications:
--    SELECT cron.schedule('appointment-reminders', '0 8 * * *', 'SELECT create_appointment_reminders();');
-- 
-- 2. Weekly cleanup:
--    SELECT cron.schedule('cleanup-notifications', '0 2 * * 0', 'SELECT cleanup_old_notifications();');
--    SELECT cron.schedule('cleanup-availability', '0 3 * * 0', 'SELECT cleanup_expired_availability();');

-- NEXT STEPS:
-- 1. Run sample-data-complete.sql for test data
-- 2. Test all triggers and functions
-- 3. Set up cron jobs in Supabase dashboard
-- 4. Monitor performance and optimize as needed

-- =====================================================
-- AUTOMATIC DOCTOR ONBOARDING FLAGS TRIGGERS
-- =====================================================
-- These triggers automatically update doctor onboarding flags
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

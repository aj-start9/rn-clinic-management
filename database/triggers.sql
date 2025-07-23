-- =============================================
-- APPOINTMENT SYSTEM - DATABASE TRIGGERS
-- =============================================

-- 1. AUTO-UPDATE TIMESTAMPS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. PREVENT DOUBLE BOOKING (CRITICAL)
-- =============================================
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if time slot is already booked
  IF EXISTS (
    SELECT 1 FROM appointments 
    WHERE doctor_id = NEW.doctor_id 
    AND appointment_date = NEW.appointment_date 
    AND time_slot = NEW.time_slot 
    AND status IN ('confirmed', 'pending')
    AND id != COALESCE(NEW.id, 0)
  ) THEN
    RAISE EXCEPTION 'Time slot already booked for this doctor';
  END IF;
  
  -- Check if patient already has appointment at same time
  IF EXISTS (
    SELECT 1 FROM appointments 
    WHERE patient_id = NEW.patient_id 
    AND appointment_date = NEW.appointment_date 
    AND time_slot = NEW.time_slot 
    AND status IN ('confirmed', 'pending')
    AND id != COALESCE(NEW.id, 0)
  ) THEN
    RAISE EXCEPTION 'Patient already has an appointment at this time';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_double_booking_trigger
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION prevent_double_booking();

-- 3. MANAGE DOCTOR AVAILABILITY
-- =============================================
CREATE OR REPLACE FUNCTION manage_doctor_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    -- Mark time slot as unavailable
    UPDATE doctor_availability 
    SET is_available = false,
        booked_appointment_id = NEW.id
    WHERE doctor_id = NEW.doctor_id 
    AND date = NEW.appointment_date 
    AND time_slot = NEW.time_slot;
    
    -- Update doctor's total appointments count
    UPDATE doctors 
    SET total_appointments = total_appointments + 1,
        last_appointment_date = NEW.appointment_date
    WHERE id = NEW.doctor_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
      -- Free up the time slot
      UPDATE doctor_availability 
      SET is_available = true,
          booked_appointment_id = NULL
      WHERE doctor_id = NEW.doctor_id 
      AND date = NEW.appointment_date 
      AND time_slot = NEW.time_slot;
      
      -- Decrease doctor's appointment count
      UPDATE doctors 
      SET total_appointments = total_appointments - 1
      WHERE id = NEW.doctor_id;
      
    ELSIF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      -- Mark as unavailable when confirming
      UPDATE doctor_availability 
      SET is_available = false,
          booked_appointment_id = NEW.id
      WHERE doctor_id = NEW.doctor_id 
      AND date = NEW.appointment_date 
      AND time_slot = NEW.time_slot;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manage_availability_trigger
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION manage_doctor_availability();

-- 4. AUDIT TRAIL
-- =============================================
CREATE OR REPLACE FUNCTION log_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO appointment_audit_log (
    appointment_id,
    action,
    old_status,
    new_status,
    old_data,
    new_data,
    changed_at,
    user_id
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    OLD.status,
    NEW.status,
    to_jsonb(OLD),
    to_jsonb(NEW),
    CURRENT_TIMESTAMP,
    COALESCE(NEW.updated_by, OLD.updated_by)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION log_appointment_changes();

-- 5. BUSINESS RULES VALIDATION
-- =============================================
CREATE OR REPLACE FUNCTION validate_appointment_business_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- Cannot book appointment in the past
  IF NEW.appointment_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot book appointment in the past';
  END IF;
  
  -- Cannot book more than 30 days in advance
  IF NEW.appointment_date > CURRENT_DATE + INTERVAL '30 days' THEN
    RAISE EXCEPTION 'Cannot book appointment more than 30 days in advance';
  END IF;
  
  -- Validate appointment fee
  IF NEW.fee <= 0 THEN
    RAISE EXCEPTION 'Appointment fee must be greater than 0';
  END IF;
  
  -- Check if doctor is active
  IF NOT EXISTS (
    SELECT 1 FROM doctors 
    WHERE id = NEW.doctor_id 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Doctor is not active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_appointment_trigger
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION validate_appointment_business_rules();

-- 6. CALL EDGE FUNCTION FOR COMPLEX OPERATIONS
-- =============================================
CREATE OR REPLACE FUNCTION trigger_appointment_workflow()
RETURNS TRIGGER AS $$
DECLARE
  operation_type text;
BEGIN
  -- Determine operation type
  IF TG_OP = 'INSERT' THEN
    operation_type := 'created';
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    operation_type := 'status_changed';
  ELSIF TG_OP = 'UPDATE' THEN
    operation_type := 'updated';
  ELSE
    operation_type := TG_OP;
  END IF;
  
  -- Call edge function asynchronously for notifications and external integrations
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/appointment-workflow',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.jwt_token', true)
    ),
    body := jsonb_build_object(
      'appointmentId', NEW.id,
      'operation', operation_type,
      'oldStatus', OLD.status,
      'newStatus', NEW.status,
      'doctorId', NEW.doctor_id,
      'patientId', NEW.patient_id,
      'appointmentDate', NEW.appointment_date,
      'timeSlot', NEW.time_slot
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_workflow_trigger
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION trigger_appointment_workflow();

-- 7. AUTO-EXPIRE PENDING APPOINTMENTS
-- =============================================
CREATE OR REPLACE FUNCTION expire_pending_appointments()
RETURNS void AS $$
BEGIN
  -- Auto-expire appointments pending for more than 24 hours
  UPDATE appointments 
  SET status = 'expired',
      updated_at = CURRENT_TIMESTAMP
  WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run this function every hour
-- (This would be set up in Supabase dashboard or via cron)

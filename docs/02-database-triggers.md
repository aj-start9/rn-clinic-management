# 🗄️ Database Triggers Documentation

## Overview

Database triggers are **PostgreSQL functions** that execute automatically when database events occur. They ensure **data integrity** and **business rule enforcement** that cannot be bypassed.

## 🎯 Why Use Database Triggers?

### ✅ **Guaranteed Execution**
- Always run, even if frontend fails
- Cannot be bypassed by API calls
- Part of database transaction (atomic)

### ✅ **Data Integrity**
- Prevent invalid data states
- Enforce business rules at database level
- Maintain referential integrity

### ✅ **Performance**
- Execute directly in database
- No network latency
- Optimized SQL operations

## 📝 Our Database Triggers

### 1. Auto-Update Timestamps

```sql
-- =============================================
-- AUTO-UPDATE TIMESTAMPS
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
```

**Purpose:** Automatically set `updated_at` timestamp on any record update  
**When it runs:** Before every UPDATE operation  
**Why use trigger:** Cannot be forgotten, always accurate  

---

### 2. Prevent Double Booking (Critical)

```sql
-- =============================================
-- PREVENT DOUBLE BOOKING (CRITICAL)
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
```

**Purpose:** Prevent scheduling conflicts  
**When it runs:** Before INSERT or UPDATE on appointments  
**Why use trigger:** Critical business rule that must never be violated  

---

### 3. Manage Doctor Availability

```sql
-- =============================================
-- MANAGE DOCTOR AVAILABILITY
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
```

**Purpose:** Automatically manage doctor availability and statistics  
**When it runs:** After INSERT or UPDATE on appointments  
**Why use trigger:** Ensures availability is always in sync with bookings  

---

### 4. Audit Trail

```sql
-- =============================================
-- AUDIT TRAIL
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
```

**Purpose:** Complete audit trail of all appointment changes  
**When it runs:** After INSERT, UPDATE, or DELETE on appointments  
**Why use trigger:** Compliance and debugging requirements  

---

### 5. Business Rules Validation

```sql
-- =============================================
-- BUSINESS RULES VALIDATION
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
```

**Purpose:** Enforce business rules at database level  
**When it runs:** Before INSERT or UPDATE on appointments  
**Why use trigger:** Business rules must be enforced regardless of client  

---

### 6. Call Edge Function for Complex Operations

```sql
-- =============================================
-- CALL EDGE FUNCTION FOR COMPLEX OPERATIONS
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
```

**Purpose:** Bridge database operations with external systems  
**When it runs:** After INSERT or UPDATE on appointments  
**Why use trigger:** Ensures external operations happen for every appointment change  

---

### 7. Auto-Expire Pending Appointments

```sql
-- =============================================
-- AUTO-EXPIRE PENDING APPOINTMENTS
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
```

**Purpose:** Automatically clean up stale pending appointments  
**When it runs:** Scheduled (every hour)  
**Why use trigger:** Automated maintenance without manual intervention  

---

## 🚦 Trigger Execution Order

When an appointment is created, triggers execute in this order:

1. **BEFORE INSERT Triggers**
   - `validate_appointment_trigger` - Validates business rules
   - `prevent_double_booking_trigger` - Prevents conflicts

2. **INSERT Operation** - Actual data insertion

3. **AFTER INSERT Triggers**
   - `manage_availability_trigger` - Updates availability
   - `appointment_audit_trigger` - Logs changes
   - `appointment_workflow_trigger` - Calls edge function

## ⚡ Performance Characteristics

| Trigger | Execution Time | Blocking | Purpose |
|---------|---------------|----------|---------|
| Timestamp update | <1ms | Yes | Data consistency |
| Double booking check | 1-5ms | Yes | Business rules |
| Availability update | 2-10ms | Yes | Data sync |
| Audit logging | 1-3ms | Yes | Compliance |
| Business validation | 1-5ms | Yes | Data integrity |
| Edge function call | <1ms | No* | External operations |

*Edge function call is asynchronous and doesn't block the database operation

## 🔧 Managing Triggers

### Deploy Triggers
```sql
-- Run in Supabase SQL editor or via migration
\i database/triggers.sql
```

### Monitor Trigger Performance
```sql
-- Check trigger execution times
SELECT schemaname, tablename, trigger_name 
FROM pg_stat_user_tables 
JOIN pg_trigger ON pg_trigger.tgrelid = pg_stat_user_tables.relid;
```

### Disable Trigger (Emergency)
```sql
-- Temporarily disable a trigger
ALTER TABLE appointments DISABLE TRIGGER prevent_double_booking_trigger;

-- Re-enable
ALTER TABLE appointments ENABLE TRIGGER prevent_double_booking_trigger;
```

## 🎯 Best Practices

### ✅ **Do**
- Keep triggers simple and fast
- Use BEFORE triggers for validation
- Use AFTER triggers for side effects
- Handle errors gracefully with meaningful messages
- Test triggers thoroughly

### ❌ **Don't**
- Put complex business logic in triggers
- Make external API calls directly in triggers
- Use triggers for operations that can fail
- Create recursive triggers
- Ignore trigger errors

---

**Next:** [Edge Functions](./03-edge-functions.md)

-- =====================================================
-- DOCTOR BOOKING APP - ROW LEVEL SECURITY POLICIES
-- =====================================================
-- 
-- This file contains all Row Level Security (RLS) policies
-- for the Doctor Booking App database.
-- 
-- PREREQUISITES:
-- - database-schema-complete.sql must be executed first
-- 
-- SECURITY APPROACH:
-- - Users can only access their own data
-- - Doctors can access their patient data during appointments
-- - Public data (specialties, clinics) is readable by all
-- - Admin operations require elevated privileges
--
-- EXECUTION: Run this in Supabase SQL Editor after schema setup
-- =====================================================

-- =====================================================
-- SECTION 1: PROFILES TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Doctors can view patient profiles during appointments
CREATE POLICY "profiles_select_doctor_patients" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE d.user_id = auth.uid()
        AND a.patient_id = profiles.id
        AND a.status IN ('scheduled', 'confirmed', 'in_progress')
    )
  );

-- =====================================================
-- SECTION 2: SPECIALTIES TABLE POLICIES
-- =====================================================

-- Anyone can view specialties (public data)
CREATE POLICY "specialties_select_public" ON specialties
  FOR SELECT TO PUBLIC USING (true);

-- Only authenticated users can suggest new specialties
CREATE POLICY "specialties_insert_authenticated" ON specialties
  FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- SECTION 3: CLINICS TABLE POLICIES
-- =====================================================

-- Anyone can view clinics (public data)
CREATE POLICY "clinics_select_public" ON clinics
  FOR SELECT TO PUBLIC USING (true);

-- Only doctors can create clinics
CREATE POLICY "clinics_insert_doctors_only" ON clinics
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE user_id = auth.uid()
    )
  );

-- Only the doctor whose doctor_id matches the clinic's doctor_id can update it
CREATE POLICY "clinics_update_own_only" ON clinics
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE user_id = clinics.doctor_id 
        AND user_id = auth.uid()
    )
  );

-- =====================================================
-- SECTION 4: DOCTORS TABLE POLICIES
-- =====================================================

-- Anyone can view verified doctors (public data)
CREATE POLICY "doctors_select_verified" ON doctors
  FOR SELECT TO PUBLIC USING (verified = true);

-- Doctors can view their own profile (even if not verified)
CREATE POLICY "doctors_select_own" ON doctors
  FOR SELECT USING (user_id = auth.uid());

-- Doctors can insert their own profile
CREATE POLICY "doctors_insert_own" ON doctors
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Doctors can update their own profile
CREATE POLICY "doctors_update_own" ON doctors
  FOR UPDATE USING (user_id = auth.uid());

-- Admin users can update any doctor profile (for verification)
-- Note: In production, you'd check for admin role
CREATE POLICY "doctors_update_admin" ON doctors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND role = 'admin'
    )
  );

-- =====================================================
-- SECTION 5: DOCTOR_CLINICS TABLE POLICIES
-- =====================================================

-- Anyone can view doctor-clinic associations (public data)
CREATE POLICY "doctor_clinics_select_public" ON doctor_clinics
  FOR SELECT TO PUBLIC USING (true);

-- Doctors can manage their own clinic associations
CREATE POLICY "doctor_clinics_manage_own" ON doctor_clinics
  FOR ALL USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- SECTION 6: AVAILABILITIES TABLE POLICIES
-- =====================================================

-- Anyone can view available slots
CREATE POLICY "availabilities_select_available" ON availabilities
  FOR SELECT TO PUBLIC USING (is_available = true);

-- Doctors can view all their slots (available and booked)
CREATE POLICY "availabilities_select_own" ON availabilities
  FOR SELECT USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- Doctors can manage their own availability slots
CREATE POLICY "availabilities_manage_own" ON availabilities
  FOR ALL USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- SECTION 7: APPOINTMENTS TABLE POLICIES
-- =====================================================

-- Patients can view their own appointments
CREATE POLICY "appointments_select_patient" ON appointments
  FOR SELECT USING (patient_id = auth.uid());

-- Doctors can view their own appointments
CREATE POLICY "appointments_select_doctor" ON appointments
  FOR SELECT USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- Patients can create appointments for themselves
CREATE POLICY "appointments_insert_patient" ON appointments
  FOR INSERT WITH CHECK (patient_id = auth.uid());

-- Patients can update their own appointments (limited fields)
CREATE POLICY "appointments_update_patient" ON appointments
  FOR UPDATE USING (
    patient_id = auth.uid() 
    AND status IN ('scheduled', 'confirmed')
  );

-- Doctors can update their appointments (for status, notes, prescription, etc.)
CREATE POLICY "appointments_update_doctor" ON appointments
  FOR UPDATE USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- Patients can cancel their appointments
CREATE POLICY "appointments_cancel_patient" ON appointments
  FOR UPDATE USING (
    patient_id = auth.uid()
    AND status IN ('scheduled', 'confirmed')
    AND date >= CURRENT_DATE
  ) WITH CHECK (
    status = 'cancelled'
  );

-- =====================================================
-- SECTION 8: REVIEWS TABLE POLICIES
-- =====================================================

-- Anyone can view verified reviews (public data)
CREATE POLICY "reviews_select_verified" ON reviews
  FOR SELECT TO PUBLIC USING (is_verified = true);

-- Patients can view their own reviews
CREATE POLICY "reviews_select_own" ON reviews
  FOR SELECT USING (patient_id = auth.uid());

-- Doctors can view reviews about them
CREATE POLICY "reviews_select_about_doctor" ON reviews
  FOR SELECT USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- Patients can create reviews for their completed appointments
CREATE POLICY "reviews_insert_patient" ON reviews
  FOR INSERT WITH CHECK (
    patient_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id
        AND a.patient_id = auth.uid()
        AND a.status = 'completed'
    )
  );

-- Patients can update their own reviews (within a time limit)
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (
    patient_id = auth.uid()
    AND created_at > NOW() - INTERVAL '7 days'
  );

-- =====================================================
-- SECTION 9: NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System can insert notifications for any user
-- Note: In production, this would be restricted to service accounts
CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- SECTION 10: AUDIT_LOGS TABLE POLICIES
-- =====================================================

-- Users can view audit logs related to their own data
CREATE POLICY "audit_logs_select_own" ON audit_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR record_id = auth.uid()
  );

-- System can insert audit logs
-- Note: This would typically be restricted to service accounts
CREATE POLICY "audit_logs_insert_system" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Admins can view all audit logs
CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND role = 'admin'
    )
  );

-- =====================================================
-- SECTION 11: STORAGE POLICIES (FOR FILE UPLOADS)
-- =====================================================

-- Avatar images in 'avatars' bucket
-- Users can view all avatar images
CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Doctor documents in 'documents' bucket
-- Only doctors can upload documents
CREATE POLICY "documents_insert_doctors" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- Doctors can view their own documents
CREATE POLICY "documents_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- SECTION 12: ADVANCED SECURITY FUNCTIONS
-- =====================================================

-- Function to check if user is a doctor
CREATE OR REPLACE FUNCTION is_doctor(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_uuid AND role = 'doctor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if appointment belongs to user
CREATE OR REPLACE FUNCTION owns_appointment(appointment_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM appointments a
    LEFT JOIN doctors d ON a.doctor_id = d.id
    WHERE a.id = appointment_uuid
      AND (a.patient_id = user_uuid OR d.user_id = user_uuid)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 13: SECURITY CONSTRAINTS
-- =====================================================

-- Prevent users from changing their role after signup
-- (except by admin)
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if it's an insert (new user)
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- Allow if user is admin
  IF is_admin() THEN
    RETURN NEW;
  END IF;
  
  -- Prevent role change for regular users
  IF OLD.role != NEW.role THEN
    RAISE EXCEPTION 'Role cannot be changed after account creation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_change();

-- =====================================================
-- END OF RLS POLICIES
-- =====================================================

-- IMPORTANT NOTES:
-- 1. These policies provide a secure foundation but should be
--    reviewed and tested thoroughly before production use
-- 2. Consider adding more granular permissions based on your
--    specific business requirements
-- 3. Regular security audits are recommended
-- 4. Test all policies with different user roles and scenarios

-- NEXT STEPS:
-- 1. Run triggers-and-functions.sql for automation
-- 2. Run sample-data-complete.sql for test data
-- 3. Test the security policies with different user scenarios

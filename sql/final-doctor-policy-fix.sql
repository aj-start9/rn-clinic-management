-- =====================================================
-- FINAL DOCTOR RLS POLICY FIX
-- =====================================================
-- First, let's check what columns actually exist in the doctors table
-- =====================================================

-- 1. Check the current schema of doctors table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'doctors' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current policies
SELECT 
    policyname, 
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'doctors';

-- 3. Drop any existing policies
DROP POLICY IF EXISTS "Anyone can view verified doctors" ON doctors;
DROP POLICY IF EXISTS "Public can view verified doctors" ON doctors;
DROP POLICY IF EXISTS "Doctors can view own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can update own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can insert own profile" ON doctors;

-- 4. Create the correct policies based on what columns actually exist
-- If there's no 'verified' column, we'll create policies without it

-- Policy 1: Anyone can view all doctors (since there's no verified flag to filter by)
CREATE POLICY "Anyone can view doctors" ON doctors
  FOR SELECT 
  TO PUBLIC 
  USING (true);

-- Policy 2: Doctors can view their own profile 
CREATE POLICY "Doctors can view own profile" ON doctors
  FOR SELECT 
  USING (user_id = auth.uid());

-- Policy 3: Doctors can update their own profile (needed for onboarding)
CREATE POLICY "Doctors can update own profile" ON doctors
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Policy 4: Doctors can insert their own profile (needed for onboarding)
CREATE POLICY "Doctors can insert own profile" ON doctors
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- 5. Verify the final policies
SELECT 
    policyname, 
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'doctors' 
ORDER BY policyname;

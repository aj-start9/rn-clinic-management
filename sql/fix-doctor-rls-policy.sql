-- =====================================================
-- FIX DOCTOR RLS POLICY FOR ONBOARDING
-- =====================================================
-- This script adds a policy that allows doctors to view and update their own records
-- regardless of verification status, which is needed for the onboarding process.

-- 1. Add policy for doctors to view their own records (regardless of verified status)
CREATE POLICY IF NOT EXISTS "Doctors can view their own profile" ON "public"."doctors"
FOR SELECT 
TO authenticated 
USING (
  auth.uid() = user_id
);

-- 2. Add policy for doctors to update their own records
CREATE POLICY IF NOT EXISTS "Doctors can update their own profile" ON "public"."doctors"
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Add policy for doctors to insert their own records (needed for onboarding)
CREATE POLICY IF NOT EXISTS "Doctors can create their own profile" ON "public"."doctors"
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 4. Optional: Update the existing policy to be more specific
-- This keeps the public view policy but makes it clear it's for public viewing
DROP POLICY IF EXISTS "Anyone can view verified doctors" ON "public"."doctors";
CREATE POLICY "Public can view verified doctors" ON "public"."doctors"
FOR SELECT 
TO anon, authenticated
USING (verified = true);

-- 5. Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'doctors' 
ORDER BY policyname;

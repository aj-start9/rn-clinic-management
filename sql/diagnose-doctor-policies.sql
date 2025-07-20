-- =====================================================
-- DIAGNOSE DOCTOR TABLE POLICIES
-- =====================================================
-- Run this to see all current policies on the doctors table

-- 1. Check all policies on the doctors table
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'doctors' 
ORDER BY policyname;

-- 2. Check if RLS is enabled on doctors table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'doctors';

-- 3. Test query that should work (as the authenticated doctor user)
-- This will help us see if the policy is working
SELECT 
    id, 
    user_id, 
    full_name, 
    verified,
    profile_completed
FROM doctors 
WHERE user_id = auth.uid();

-- 4. If the above doesn't work, let's see all doctors (without user filter)
-- This will help us understand the data structure
SELECT 
    id, 
    user_id, 
    full_name, 
    verified,
    profile_completed
FROM doctors 
LIMIT 5;

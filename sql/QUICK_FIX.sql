-- ================================
-- LONG-TERM SOLUTION: Database Trigger Setup
-- ================================

-- Step 1: Create the trigger (run this if you haven't already)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 2: Verify the trigger was created
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 3: Test the function manually (optional)
-- This will show you what the function does when a user signs up
-- SELECT handle_new_user(); -- Don't run this, it's just for reference

-- Step 4: Check existing policies (make sure these exist)
-- You might still need these for reading/updating profiles
CREATE POLICY IF NOT EXISTS "Users can read their own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Step 5: Optional - Create a more permissive insert policy as backup
-- This ensures profile creation works even if the trigger fails
CREATE POLICY IF NOT EXISTS "Enable profile creation backup" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ================================
-- VERIFICATION QUERIES
-- ================================

-- Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth';

-- Check current RLS policies on profiles
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- ================================
-- TESTING
-- ================================

-- After creating the trigger, test by:
-- 1. Signing up a new user in your app
-- 2. Check if profile was automatically created:
-- SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;

-- SQL commands to fix RLS policies for profiles table
-- Run these in your Supabase SQL Editor

-- 1. First, let's see the current state of the profiles table
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 2. Create or replace the insert policy for profiles
CREATE POLICY "Users can insert their own profile during signup" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 3. Alternative: Allow insert for authenticated users during signup
-- This is more permissive but safer for the signup process
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON profiles;
CREATE POLICY "Enable insert for authenticated users during signup" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4. Make sure other necessary policies exist
-- Policy for reading own profile
CREATE POLICY "Users can read their own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy for updating own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- 5. Alternative: Create a more permissive insert policy for new users
-- This allows any authenticated user to create a profile (useful during signup)
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON profiles;
CREATE POLICY "Enable profile creation for new users" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- 6. Optional: Create a function to handle profile creation automatically
-- This is the most robust solution
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'consumer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to automatically create profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. If using the trigger approach, you might want to disable RLS for inserts temporarily
-- or make the policy more permissive
DROP POLICY IF EXISTS "Enable profile creation for new users" ON profiles;
CREATE POLICY "Enable profile creation via trigger" ON profiles
  FOR INSERT 
  WITH CHECK (true);

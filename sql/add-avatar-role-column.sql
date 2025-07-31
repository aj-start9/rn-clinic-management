-- Add avatar_role column to profiles table
-- This column will store the role-based avatar identifier for consistent dummy image selection

ALTER TABLE profiles 
ADD COLUMN avatar_role TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.avatar_role IS 'Role-based avatar identifier for consistent dummy image selection during onboarding';

-- Update existing profiles to have an avatar_role if they don't have one
-- This is for backwards compatibility with existing users
UPDATE profiles 
SET avatar_role = CASE 
    WHEN role = 'doctor' THEN 'doctor_' || (random() * 9 + 1)::int
    WHEN role = 'consumer' THEN 'consumer_' || (random() * 9 + 1)::int
    ELSE 'consumer_1'
END
WHERE avatar_role IS NULL;

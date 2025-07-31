-- Ensure avatar_url column exists in profiles table
-- Run this to update your database schema

-- avatar_url column should already exist, but let's verify
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image';
        RAISE NOTICE 'Added avatar_url column to profiles table';
    ELSE
        RAISE NOTICE 'avatar_url column already exists in profiles table';
    END IF;
END $$;

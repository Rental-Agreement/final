-- Add phone column to users table
-- This migration adds the missing phone column that's needed for approved properties display

-- Add phone column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
        
        -- Add comment for documentation
        COMMENT ON COLUMN users.phone IS 'User phone number for contact purposes';
        
        -- Create index for faster lookups if needed
        CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    END IF;
END $$;

-- Update RLS policies to allow users to view their own phone
-- This ensures users can see and update their own phone number
DO $$
BEGIN
    -- Drop existing policy if it exists and recreate with phone access
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    
    CREATE POLICY "Users can update own profile" ON users
        FOR UPDATE
        USING (auth_user_id = auth.uid())
        WITH CHECK (auth_user_id = auth.uid());
END $$;

-- Grant appropriate permissions
GRANT SELECT, UPDATE ON users TO authenticated;

-- Verify the change
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'phone';

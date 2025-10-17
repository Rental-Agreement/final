-- =====================================================
-- FIX USERS TABLE FOR SUPABASE AUTH
-- Run this in Supabase SQL Editor
-- =====================================================

-- This script fixes your existing users table to work with Supabase Auth
-- Your current schema has password_hash but needs auth_user_id instead

-- =====================================================
-- STEP 1: Add auth_user_id column (link to Supabase Auth)
-- =====================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Add foreign key constraint to auth.users
ALTER TABLE users 
ADD CONSTRAINT users_auth_user_id_fkey 
FOREIGN KEY (auth_user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Make it unique (one profile per auth user)
ALTER TABLE users 
ADD CONSTRAINT users_auth_user_id_unique 
UNIQUE (auth_user_id);

-- =====================================================
-- STEP 2: Add updated_at column
-- =====================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- =====================================================
-- STEP 3: Remove password_hash (Supabase Auth handles passwords)
-- =====================================================

ALTER TABLE users 
DROP COLUMN IF EXISTS password_hash;

-- =====================================================
-- STEP 4: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- STEP 5: Create updated_at trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- =====================================================
-- STEP 6: Enable Row Level Security
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 7: Create RLS Policies
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Allow insert during registration" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT 
    USING (auth.uid() = auth_user_id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE 
    USING (auth.uid() = auth_user_id);

-- Policy 3: Allow insert during registration
CREATE POLICY "Allow insert during registration" ON users
    FOR INSERT 
    WITH CHECK (true);

-- Policy 4: Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'Admin'
        )
    );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check the updated schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Users table has been successfully updated!';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '- Added auth_user_id column (links to Supabase Auth)';
    RAISE NOTICE '- Removed password_hash column (Supabase Auth handles this)';
    RAISE NOTICE '- Added updated_at column';
    RAISE NOTICE '- Created indexes for performance';
    RAISE NOTICE '- Enabled Row Level Security';
    RAISE NOTICE '- Created security policies';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Your app can now register and login users!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Go to http://localhost:8080/auth and click Sign Up';
END $$; 
        WHERE table_name = 'users' 
        AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Create index for performance
        CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
        
        RAISE NOTICE 'Column auth_user_id added successfully';
    ELSE
        RAISE NOTICE 'Column auth_user_id already exists';
    END IF;
END $$;

-- =====================================================
-- PART 3: ALTERNATIVE - Recreate Users Table
-- =====================================================

-- ⚠️ WARNING: This will DELETE ALL existing user data!
-- Only run this if you want to start fresh
-- UNCOMMENT the lines below to use this option

/*
-- Drop existing users table
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with correct schema
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(10) NOT NULL CHECK (role IN ('Admin', 'Owner', 'Tenant')),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'Users table recreated successfully' as status;
*/

-- =====================================================
-- PART 4: VERIFICATION
-- =====================================================

-- Check the final structure
SELECT 
    'Final users table structure:' as info;

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
STEP-BY-STEP GUIDE:

1. Run PART 1 (Diagnostic) first
   - This shows your current table structure
   - Look for auth_user_id column

2. If auth_user_id is missing:
   - Run PART 2 (Fix)
   - This adds the column to your existing table
   - Your existing data is preserved

3. If you want to start fresh:
   - UNCOMMENT and run PART 3 (Alternative)
   - ⚠️ WARNING: This deletes all existing data!

4. Run PART 4 (Verification)
   - Confirms the table structure is correct

5. Go back to your app and try registering again!
*/

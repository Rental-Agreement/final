-- Allow authenticated users to update their own profile (avatar, etc.)
CREATE POLICY "Allow user to update own profile" ON public.users
FOR UPDATE
USING (user_id = auth.uid());

-- Enable RLS if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- =====================================================
-- FIX INFINITE RECURSION IN USERS TABLE RLS POLICIES
-- Run this in Supabase SQL Editor
-- =====================================================

-- The problem: Policies that reference the users table cause infinite recursion
-- The solution: Use only auth.uid() without querying the users table

-- =====================================================
-- STEP 1: Drop all existing policies on users table
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Allow insert during registration" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- =====================================================
-- STEP 2: Create new policies WITHOUT recursion
-- =====================================================

-- Policy 1: Users can view their own profile (using auth_user_id directly)
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT 
    USING (auth_user_id = auth.uid());

-- Policy 2: Users can update their own profile (using auth_user_id directly)
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE 
    USING (auth_user_id = auth.uid());

-- Policy 3: Allow anyone to insert during registration (required for signup)
CREATE POLICY "Allow insert during registration" ON users
    FOR INSERT 
    WITH CHECK (true);

-- Policy 4: Allow service role to do anything (for admin operations via backend)
-- Note: We'll handle admin permissions through application logic instead of RLS
-- to avoid the recursion issue

-- =====================================================
-- STEP 3: Verify policies
-- =====================================================

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
WHERE tablename = 'users';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies fixed!';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '- Removed recursive policy that checked users table';
    RAISE NOTICE '- Users can now view/update their own data';
    RAISE NOTICE '- Anyone can register (insert) new users';
    RAISE NOTICE '';
    RAISE NOTICE '✅ No more infinite recursion errors!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Try to register/login again';
END $$;

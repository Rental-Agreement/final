
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'Admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT 
    USING (is_admin());

CREATE POLICY "Admins can update any user" ON users
    FOR UPDATE 
    USING (is_admin());

-- Create a function to get all users (for admin dashboard)
-- This function bypasses RLS and returns all users
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    user_id UUID,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100),
    phone_number VARCHAR(20),
    role VARCHAR(10),
    is_approved BOOLEAN,
    auth_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Check if the current user is an admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can view all users';
    END IF;
    
    -- Return all users
    RETURN QUERY
    SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone_number, 
           u.role, u.is_approved, u.auth_user_id, u.created_at, u.updated_at
    FROM users u
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

DO $$
BEGIN
    RAISE NOTICE '✅ Admin access to users table fixed!';
    RAISE NOTICE '';
    RAISE NOTICE 'Admins can now:';
    RAISE NOTICE '- View all users';
    RAISE NOTICE '- Update any user';
    RAISE NOTICE '- Use get_all_users() function';
    RAISE NOTICE '';
END $$;

# Admin User Management Fix

## Problem
The Admin Dashboard's User Management tab is not showing any users due to Row Level Security (RLS) policies on the `users` table.

## Root Cause
The original RLS policy for admins created a recursive query:
```sql
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'Admin'
        )
    );
```
This causes infinite recursion because it queries the `users` table while checking permissions ON the `users` table.

## Solution
We've implemented a two-part solution:

### 1. Security Definer Function
Created an `is_admin()` function that checks admin status without recursion, and a `get_all_users()` function that bypasses RLS for admin users.

### 2. Updated Dashboard Query
The Admin Dashboard now uses the RPC function instead of direct table queries.

## How to Apply the Fix

### Step 1: Run SQL Migration
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the contents of `supabase/fix_admin_users_access.sql`
4. Paste and **Run** the SQL script

### Step 2: Verify the Fix
After running the SQL script, the Admin Dashboard should now display all users in the User Management tab.

### What the SQL Script Does:
1. ✅ Drops the problematic recursive policy
2. ✅ Creates `is_admin()` helper function
3. ✅ Creates new admin policies using the function
4. ✅ Creates `get_all_users()` RPC function for the dashboard
5. ✅ Grants proper permissions

## Testing
1. Log in as an **Admin** user
2. Navigate to **Admin Dashboard** → **Users** tab
3. You should now see all registered users (Tenants, Owners, and Admins)
4. The table should display:
   - Name
   - Email
   - Phone Number
   - Role (with color-coded badges)
   - Registration Date

## User Statistics
The User Management tab also displays:
- **Total Users** count
- **Owners** count  
- **Tenants** count

## Important Notes
⚠️ The `get_all_users()` function is protected - only Admin users can execute it.
⚠️ If you see "Only admins can view all users" error, verify that your current user has `role = 'Admin'` in the database.

## Troubleshooting

### Users still not showing?
1. Verify the SQL script ran successfully without errors
2. Check browser console for error messages
3. Verify you're logged in as an Admin user
4. Try logging out and logging back in

### Permission Denied Error?
- Make sure your user account has `role = 'Admin'` in the `users` table
- Check that `auth_user_id` matches your Supabase auth user ID

### Function Not Found Error?
- The `get_all_users()` function may not exist yet
- Re-run the SQL script from `supabase/fix_admin_users_access.sql`

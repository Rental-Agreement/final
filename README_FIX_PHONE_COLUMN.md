# Fix for Approved Properties - Add Missing Columns

## Problem
The approved properties tab shows errors:
```
Error loading approved properties
column users_1.phone does not exist
column rooms_1.capacity does not exist
```

## Root Cause
The database schema is missing several columns:
- `users` table is missing `phone` column
- `rooms` table is missing `capacity`, `room_number`, and `status` columns

These columns are needed to display owner/tenant contact information and room details in the admin dashboard.

## Solution
Add the missing columns to both tables using the SQL migration script.

---

## 📋 Step-by-Step Instructions

### 1. Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/kauvvohrchewfafejgpp/sql/new

### 2. Copy the SQL Script
Open the file: `PASTE_IN_SUPABASE_ADD_PHONE.sql`

### 3. Paste and Run
- Paste the entire SQL script into the Supabase SQL Editor
- Click "Run" or press Ctrl+Enter
- Wait for completion (should take 1-2 seconds)

### 4. Verify Success
After running, you should see messages like:
```
✅ Column "phone" exists in users table
✅ Column "capacity" exists in rooms table
✅ Column "room_number" exists in rooms table
✅ Column "status" exists in rooms table
✅ Index "idx_users_phone" exists
✅ Index "idx_rooms_status" exists
✅ Migration completed successfully!
```

### 5. Refresh Your App
- Go back to your admin dashboard
- Refresh the page (F5)
- Click on "Approved Properties" tab
- The error should be gone and properties should display

---

## 🔍 What This Migration Does

### Users Table:
1. **Adds phone column** (VARCHAR(20))
2. **Creates an index** on the phone column for faster searches
3. **Updates RLS policies** to allow users to view and update phone numbers

### Rooms Table:
1. **Adds capacity column** (INTEGER) - Number of people the room can accommodate
2. **Adds room_number column** (VARCHAR(50)) - Room identifier
3. **Adds status column** (VARCHAR(20)) - Room status (Available, Occupied, Maintenance, Reserved)
4. **Creates indexes** for better performance
5. **Updates existing rooms** with default values

### Additional:
- **Adds documentation** (column comments)
- **Verifies** the changes were applied successfully
- **Shows final schemas** for both tables

---

## ✅ What Will Work After Migration

### Admin Dashboard - Approved Properties Tab
- ✅ Shows all approved properties
- ✅ Displays owner name and email
- ✅ Displays owner phone (if provided)
- ✅ Shows all active tenants
- ✅ Shows tenant contact info (email and phone)
- ✅ Displays occupancy statistics
- ✅ Search functionality works

---

## 🎯 Next Steps After Migration

1. **Test the Approved Properties tab** - Should load without errors
2. **Update user profiles** - Users can now add their phone numbers in their profile
3. **Verify data display** - Owner and tenant phone numbers will show (if they've added them)

---

## 📝 Optional: Pre-populate Phone Numbers

If you want to add phone numbers for existing users, you can run:

```sql
-- Update phone for specific users (example)
UPDATE public.users 
SET phone = '+1234567890' 
WHERE email = 'user@example.com';
```

---

## ⚠️ Important Notes

- The phone column is **optional** (nullable)
- Users without phone numbers will still display (email only)
- The UI gracefully handles missing phone numbers
- No existing data will be affected
- This is a non-destructive migration

---

## 🆘 Troubleshooting

### If you still see errors after migration:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** the page (Ctrl+F5)
3. **Check browser console** (F12) for any other errors
4. **Verify migration ran** by checking the final schema output

### To verify columns exist:
```sql
-- Check users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'phone';

-- Check rooms table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rooms' AND column_name IN ('capacity', 'room_number', 'status');
```

Should return:
```
-- users.phone
column_name | data_type
------------|------------------
phone       | character varying

-- rooms columns
column_name  | data_type
-------------|------------------
capacity     | integer
room_number  | character varying
status       | character varying
```

---

## 📞 Support

If you encounter any issues:
1. Check the Supabase logs in the SQL editor
2. Verify you're running the script on the correct project
3. Make sure you have admin/owner permissions on the Supabase project

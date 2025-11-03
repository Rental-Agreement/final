-- =====================================================
-- ADD MISSING COLUMNS TO DATABASE
-- Paste this entire script into Supabase SQL Editor
-- Project: kauvvohrchewfafejgpp
-- Fixes: phone column in users, capacity in rooms
-- =====================================================

-- Step 1: Add phone column to users table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.users ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE 'Column phone added to users table';
    ELSE
        RAISE NOTICE 'Column phone already exists in users table';
    END IF;
END $$;

-- Step 2: Add capacity, room_number, and status columns to rooms table
DO $$ 
BEGIN
    -- Add capacity column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rooms' 
        AND column_name = 'capacity'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN capacity INTEGER DEFAULT 1;
        RAISE NOTICE 'Column capacity added to rooms table';
    ELSE
        RAISE NOTICE 'Column capacity already exists in rooms table';
    END IF;
    
    -- Add room_number column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rooms' 
        AND column_name = 'room_number'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN room_number VARCHAR(50);
        RAISE NOTICE 'Column room_number added to rooms table';
    ELSE
        RAISE NOTICE 'Column room_number already exists in rooms table';
    END IF;
    
    -- Add status column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rooms' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Maintenance', 'Reserved'));
        RAISE NOTICE 'Column status added to rooms table';
    ELSE
        RAISE NOTICE 'Column status already exists in rooms table';
    END IF;
END $$;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN public.users.phone IS 'User phone number for contact purposes';
COMMENT ON COLUMN public.rooms.capacity IS 'Maximum number of people the room can accommodate';
COMMENT ON COLUMN public.rooms.room_number IS 'Room identifier/number';
COMMENT ON COLUMN public.rooms.status IS 'Current status of the room (Available, Occupied, Maintenance, Reserved)';

-- Step 4: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_room_number ON public.rooms(room_number);

-- Step 5: Update existing RLS policies
-- Drop and recreate the profile update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Ensure authenticated users can view phone numbers
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;

CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT
    USING (true);  -- All authenticated users can view all user profiles (needed for admin dashboard)

-- Step 6: Update existing rooms with default values if they don't have them
UPDATE public.rooms 
SET capacity = 1 
WHERE capacity IS NULL;

UPDATE public.rooms 
SET status = 'Available' 
WHERE status IS NULL;

-- Step 7: Verify the changes
DO $$
DECLARE
    phone_exists boolean;
    capacity_exists boolean;
    room_number_exists boolean;
    status_exists boolean;
    phone_idx_exists boolean;
    status_idx_exists boolean;
BEGIN
    -- Check if columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone'
    ) INTO phone_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'capacity'
    ) INTO capacity_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'room_number'
    ) INTO room_number_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'status'
    ) INTO status_exists;
    
    -- Check if indexes exist
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'users' AND indexname = 'idx_users_phone'
    ) INTO phone_idx_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'rooms' AND indexname = 'idx_rooms_status'
    ) INTO status_idx_exists;
    
    -- Report results
    IF phone_exists THEN
        RAISE NOTICE '✅ Column "phone" exists in users table';
    ELSE
        RAISE WARNING '❌ Column "phone" was not created in users table';
    END IF;
    
    IF capacity_exists THEN
        RAISE NOTICE '✅ Column "capacity" exists in rooms table';
    ELSE
        RAISE WARNING '❌ Column "capacity" was not created in rooms table';
    END IF;
    
    IF room_number_exists THEN
        RAISE NOTICE '✅ Column "room_number" exists in rooms table';
    ELSE
        RAISE WARNING '❌ Column "room_number" was not created in rooms table';
    END IF;
    
    IF status_exists THEN
        RAISE NOTICE '✅ Column "status" exists in rooms table';
    ELSE
        RAISE WARNING '❌ Column "status" was not created in rooms table';
    END IF;
    
    IF phone_idx_exists THEN
        RAISE NOTICE '✅ Index "idx_users_phone" exists';
    ELSE
        RAISE WARNING '❌ Index "idx_users_phone" was not created';
    END IF;
    
    IF status_idx_exists THEN
        RAISE NOTICE '✅ Index "idx_rooms_status" exists';
    ELSE
        RAISE WARNING '❌ Index "idx_rooms_status" was not created';
    END IF;
END $$;

-- Step 8: Display final schemas
SELECT '=== USERS TABLE SCHEMA ===' as info;
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

SELECT '=== ROOMS TABLE SCHEMA ===' as info;
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    numeric_precision,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'rooms'
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Migration completed successfully! Phone column added to users table, capacity/room_number/status added to rooms table.' as status;

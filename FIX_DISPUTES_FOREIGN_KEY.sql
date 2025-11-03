-- =====================================================
-- FIX DISPUTES TABLE FOREIGN KEY
-- Paste this entire script into Supabase SQL Editor
-- Project: kauvvohrchewfafejgpp
-- Fixes: Missing foreign key relationship between disputes and users
-- =====================================================

-- Step 1: Check if disputes table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'disputes'
    ) THEN
        RAISE EXCEPTION 'Disputes table does not exist!';
    END IF;
    
    RAISE NOTICE '✅ Disputes table exists';
END $$;

-- Step 2: Check current foreign keys on disputes table
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'disputes';

-- Step 3: Drop existing foreign key if it exists (to recreate it properly)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'disputes_raised_by_user_id_fkey'
        AND table_name = 'disputes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.disputes DROP CONSTRAINT disputes_raised_by_user_id_fkey;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
END $$;

-- Step 4: Ensure raised_by_user_id column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'disputes'
        AND column_name = 'raised_by_user_id'
    ) THEN
        ALTER TABLE public.disputes ADD COLUMN raised_by_user_id UUID;
        RAISE NOTICE 'Added raised_by_user_id column';
    ELSE
        RAISE NOTICE '✅ Column raised_by_user_id exists';
    END IF;
END $$;

-- Step 5: Create the foreign key constraint
DO $$
BEGIN
    ALTER TABLE public.disputes
    ADD CONSTRAINT disputes_raised_by_user_id_fkey
    FOREIGN KEY (raised_by_user_id)
    REFERENCES public.users(user_id)
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Foreign key constraint created successfully';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Foreign key might already exist or there was an error: %', SQLERRM;
END $$;

-- Step 6: Create index on raised_by_user_id for better performance
CREATE INDEX IF NOT EXISTS idx_disputes_raised_by_user_id 
ON public.disputes(raised_by_user_id);

-- Step 7: Verify the foreign key was created
DO $$
DECLARE
    fk_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'disputes_raised_by_user_id_fkey'
        AND table_name = 'disputes'
        AND table_schema = 'public'
        AND constraint_type = 'FOREIGN KEY'
    ) INTO fk_exists;
    
    IF fk_exists THEN
        RAISE NOTICE '✅ Foreign key constraint verified successfully';
    ELSE
        RAISE WARNING '❌ Foreign key constraint was not created';
    END IF;
END $$;

-- Step 8: Display disputes table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'disputes'
ORDER BY ordinal_position;

-- Step 9: Display foreign key relationships
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'disputes';

-- Success message
SELECT '✅ Disputes foreign key fix completed! Relationship between disputes and users is now established.' as status;

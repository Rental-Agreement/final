-- Allow users to update their own profile details safely
-- Run this in Supabase SQL editor if updates are blocked by RLS

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update their own data'
  ) THEN
    CREATE POLICY "Users can update their own data" ON users
      FOR UPDATE USING (auth.uid() = auth_user_id);
  END IF;
END $$;

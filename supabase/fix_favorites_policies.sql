-- Favorites RLS policies to allow users to manage their own favorites
-- Safe to run multiple times (drops existing policies first)

-- Ensure RLS is enabled
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;

-- Allow authenticated users to select only their own favorites
CREATE POLICY "favorites_select_own"
ON public.favorites
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.user_id = public.favorites.user_id
  )
);

-- Allow authenticated users to insert favorites for themselves
CREATE POLICY "favorites_insert_own"
ON public.favorites
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.user_id = public.favorites.user_id
  )
);

-- Allow authenticated users to delete their own favorites
CREATE POLICY "favorites_delete_own"
ON public.favorites
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.user_id = public.favorites.user_id
  )
);

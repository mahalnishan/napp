-- Fix the INSERT policy on users table

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;

-- Create the correct INSERT policy
CREATE POLICY "users_insert_policy" ON public.users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify the INSERT policy
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
AND cmd = 'INSERT'; 
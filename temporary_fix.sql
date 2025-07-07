-- Temporary fix: Disable RLS on users table for testing
-- This will allow all operations on the users table

-- Disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- Show current policies (should be none)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'; 
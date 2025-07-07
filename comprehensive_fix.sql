-- Comprehensive fix for RLS policies on users table
-- This script properly sets up all necessary policies

-- First, disable RLS to clear any existing policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile during registration" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON public.users;
DROP POLICY IF EXISTS "Admin can update any user" ON public.users;
DROP POLICY IF EXISTS "Admin can delete any user" ON public.users;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies

-- 1. SELECT policy: Users can view their own profile OR admin can view all
CREATE POLICY "users_select_policy" ON public.users 
FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 2. INSERT policy: Users can insert their own profile during registration
CREATE POLICY "users_insert_policy" ON public.users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. UPDATE policy: Users can update their own profile OR admin can update any
CREATE POLICY "users_update_policy" ON public.users 
FOR UPDATE USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 4. DELETE policy: Admin can delete any user
CREATE POLICY "users_delete_policy" ON public.users 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Verify the setup
SELECT 
  'RLS Status' as check_type,
  schemaname,
  tablename,
  rowsecurity::text as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname = 'public'

UNION ALL

SELECT 
  'Policies' as check_type,
  schemaname,
  tablename,
  COUNT(*)::text as policy_count
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
GROUP BY schemaname, tablename;

-- Show all policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY cmd, policyname; 
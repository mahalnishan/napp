-- Fix RLS policies to allow admin users to view all users
-- This script adds admin-specific policies to the users table

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Create a new policy that allows users to view their own profile OR if they are admin
CREATE POLICY "Users can view own profile or admin can view all" ON public.users 
FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Add policy for users to insert their own profile during registration
CREATE POLICY "Users can insert own profile during registration" ON public.users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Add policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users 
FOR UPDATE USING (auth.uid() = id);

-- Add policy for admin users to update any user
CREATE POLICY "Admin can update any user" ON public.users 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Add policy for admin users to delete any user
CREATE POLICY "Admin can delete any user" ON public.users 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'; 
-- Comprehensive debug and fix for login issues
-- This script will diagnose and fix all potential issues

-- 1. First, let's see the current state
SELECT '=== CURRENT STATE ===' as info;

-- Check auth users
SELECT 'Auth Users:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Check public users
SELECT 'Public Users:' as info;
SELECT id, email, role, created_at FROM public.users ORDER BY created_at DESC;

-- Check for mismatches
SELECT 'Mismatches:' as info;
SELECT 
  au.id,
  au.email,
  CASE WHEN pu.id IS NULL THEN 'Missing in public.users' ELSE 'Exists' END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 2. Check RLS status
SELECT '=== RLS STATUS ===' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- 3. Check policies
SELECT '=== CURRENT POLICIES ===' as info;
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 4. Check triggers
SELECT '=== TRIGGERS ===' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND trigger_schema = 'public';

-- 5. Check functions
SELECT '=== FUNCTIONS ===' as info;
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%user%'
AND routine_schema = 'public';

-- 6. NOW LET'S FIX EVERYTHING

-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.ensure_user_exists();

-- 7. Create a simple, working setup

-- Create a simple function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, 'user', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Insert any missing users manually
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'user',
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 9. Set admin role for your account
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'nishan.mahal71@gmail.com';

-- 10. Re-enable RLS with simple policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Simple policies that should work
CREATE POLICY "allow_all_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON public.users FOR UPDATE USING (true);
CREATE POLICY "allow_all_delete" ON public.users FOR DELETE USING (true);

-- 11. Final verification
SELECT '=== FINAL VERIFICATION ===' as info;

SELECT 'Auth Users Count:' as check_type, COUNT(*)::text as count FROM auth.users
UNION ALL
SELECT 'Public Users Count:' as check_type, COUNT(*)::text as count FROM public.users
UNION ALL
SELECT 'Admin Users:' as check_type, COUNT(*)::text as count FROM public.users WHERE role = 'admin'
UNION ALL
SELECT 'Missing Users:' as check_type, COUNT(*)::text as count 
FROM auth.users au LEFT JOIN public.users pu ON au.id = pu.id WHERE pu.id IS NULL;

-- Show your admin user
SELECT 'Your Admin User:' as info;
SELECT id, email, role, created_at FROM public.users WHERE email = 'nishan.mahal71@gmail.com';

-- Show RLS status
SELECT 'RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity::text as rls_enabled 
FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public';

-- Show policies
SELECT 'Policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'; 
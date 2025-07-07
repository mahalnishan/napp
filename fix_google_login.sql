-- Fix Google login issues for existing accounts
-- This script handles both new registrations and existing Google logins

-- 1. First, let's see what users exist in auth but not in public.users
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  CASE WHEN pu.id IS NULL THEN 'Missing in public.users' ELSE 'Exists in public.users' END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- 2. Create a function to handle missing users
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already exists in public.users
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        INSERT INTO public.users (id, email, role, created_at, updated_at)
        VALUES (NEW.id, NEW.email, 'user', NOW(), NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop existing trigger and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Create new trigger that handles both new and existing users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_exists();

-- 5. Insert missing users manually
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'user',
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 6. Make sure your admin user has admin role
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'nishan.mahal71@gmail.com';

-- 7. Verify the setup
SELECT 
  'Auth Users Count' as check_type,
  COUNT(*)::text as count
FROM auth.users

UNION ALL

SELECT 
  'Public Users Count' as check_type,
  COUNT(*)::text as count
FROM public.users

UNION ALL

SELECT 
  'Admin Users' as check_type,
  COUNT(*)::text as count
FROM public.users 
WHERE role = 'admin'

UNION ALL

SELECT 
  'Missing Users' as check_type,
  COUNT(*)::text as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 8. Show your admin user details
SELECT 
  id,
  email,
  role,
  created_at
FROM public.users 
WHERE email = 'nishan.mahal71@gmail.com'; 
-- Fix user registration issues
-- This script addresses the complete user creation process

-- 1. First, let's check if the trigger exists and is working
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND trigger_schema = 'public';

-- 2. Check if the handle_new_user function exists
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- 3. Temporarily disable RLS to test registration
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Drop and recreate the trigger to ensure it works
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 5. Create a simple handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Re-enable RLS with proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- 9. Create proper policies
-- SELECT: Users can view own profile OR admin can view all
CREATE POLICY "users_select_policy" ON public.users 
FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- INSERT: Allow the trigger to insert (no auth.uid() check needed for trigger)
CREATE POLICY "users_insert_policy" ON public.users 
FOR INSERT WITH CHECK (true);

-- UPDATE: Users can update own profile OR admin can update any
CREATE POLICY "users_update_policy" ON public.users 
FOR UPDATE USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- DELETE: Admin can delete any user
CREATE POLICY "users_delete_policy" ON public.users 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 10. Verify everything is set up correctly
SELECT 'Trigger Check' as check_type, trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND trigger_schema = 'public'

UNION ALL

SELECT 'Function Check' as check_type, routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public'

UNION ALL

SELECT 'RLS Status' as check_type, tablename, rowsecurity::text 
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname = 'public'

UNION ALL

SELECT 'Policy Count' as check_type, tablename, COUNT(*)::text 
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
GROUP BY tablename; 
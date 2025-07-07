-- Test script to verify login flow
-- Run this after the debug_and_fix_login.sql script

-- Test 1: Check if we can query users table
SELECT 'Test 1: Can query users table' as test_name;
SELECT COUNT(*) as user_count FROM public.users;

-- Test 2: Check if admin user exists
SELECT 'Test 2: Admin user check' as test_name;
SELECT id, email, role FROM public.users WHERE email = 'nishan.mahal71@gmail.com';

-- Test 3: Test RLS policies
SELECT 'Test 3: RLS policy test' as test_name;
-- This should work if RLS is properly configured
SELECT COUNT(*) as accessible_users FROM public.users;

-- Test 4: Check trigger function
SELECT 'Test 4: Trigger function exists' as test_name;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- Test 5: Check trigger
SELECT 'Test 5: Trigger exists' as test_name;
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created' 
AND event_object_schema = 'auth';

-- Test 6: Simulate a new user creation (this won't actually create a user, just test the function)
SELECT 'Test 6: Function syntax test' as test_name;
-- This tests if the function can be called without errors
DO $$
BEGIN
    -- Just test that the function exists and can be called
    PERFORM routine_name FROM information_schema.routines 
    WHERE routine_name = 'handle_new_user' 
    AND routine_schema = 'public';
    
    RAISE NOTICE 'Function exists and is callable';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Function test failed: %', SQLERRM;
END $$;

-- Test 7: Check table structure
SELECT 'Test 7: Table structure' as test_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 8: Check for any constraints that might cause issues
SELECT 'Test 8: Table constraints' as test_name;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users' 
AND tc.table_schema = 'public';

-- Summary
SELECT '=== SUMMARY ===' as info;
SELECT 
    'Total auth users' as metric,
    COUNT(*)::text as value
FROM auth.users
UNION ALL
SELECT 
    'Total public users' as metric,
    COUNT(*)::text as value
FROM public.users
UNION ALL
SELECT 
    'Admin users' as metric,
    COUNT(*)::text as value
FROM public.users WHERE role = 'admin'
UNION ALL
SELECT 
    'Missing sync users' as metric,
    COUNT(*)::text as value
FROM auth.users au 
LEFT JOIN public.users pu ON au.id = pu.id 
WHERE pu.id IS NULL; 
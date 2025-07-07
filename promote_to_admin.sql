-- Script to promote a user to admin role and adjust privileges

-- 1. Replace with your admin email
\set admin_email 'nishan.mahal71@gmail.com'

-- 2. Promote user to admin role in public.users table
UPDATE public.users
SET role = 'admin'
WHERE email = :'admin_email';

-- 3. Grant necessary privileges on system_settings table to authenticated role
GRANT SELECT, UPDATE ON public.system_settings TO authenticated;

-- 4. Verify update policy exists; if not, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'system_settings'
        AND policyname = 'Admin can update system settings'
    ) THEN
        CREATE POLICY "Admin can update system settings" ON public.system_settings
        FOR UPDATE TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid() AND users.role = 'admin'
            )
        );
    END IF;
END $$;

-- 5. Test: Try updating a dummy field
-- This should succeed if the user is admin and authenticated
-- Uncomment to test manually
-- UPDATE public.system_settings SET maintenance_mode = maintenance_mode WHERE id = 1; 
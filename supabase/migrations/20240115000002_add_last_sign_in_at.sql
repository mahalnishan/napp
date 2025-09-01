-- Migration: add last_sign_in_at column to public.users and keep it in sync with auth.users

-- 1. Add the column if it does not exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMP WITH TIME ZONE;

-- 2. Backfill existing rows from auth.users
UPDATE public.users AS pu
SET last_sign_in_at = au.last_sign_in_at
FROM auth.users AS au
WHERE pu.id = au.id
  AND pu.last_sign_in_at IS NULL;

-- 3. Create or replace the trigger function to sync last_sign_in_at from auth.users
CREATE OR REPLACE FUNCTION public.sync_last_sign_in_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync when auth.users.last_sign_in_at changes
  UPDATE public.users
  SET last_sign_in_at = NEW.last_sign_in_at,
      updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Drop existing trigger if any
DROP TRIGGER IF EXISTS sync_last_sign_in_at_trigger ON auth.users;

-- 5. Create trigger on auth.users to keep the column up to date
CREATE TRIGGER sync_last_sign_in_at_trigger
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_last_sign_in_at();

-- 6. Update handle_new_user trigger function to include last_sign_in_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, last_sign_in_at, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.last_sign_in_at, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Ensure the trigger on auth.users for new users uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Grant permissions to authenticated role (if not already present)
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- 9. Provide a permissive SELECT policy for now (keep simple user access)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'users'
          AND policyname = 'allow_all_select'
    ) THEN
        CREATE POLICY allow_all_select ON public.users
        FOR SELECT TO authenticated
        USING (TRUE);
    END IF;
END $$; 
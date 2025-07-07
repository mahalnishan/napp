-- Remove automatic user creation trigger and function
-- This ensures users must explicitly sign up rather than being auto-created on login

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Add a policy to allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile during registration" ON public.users 
FOR INSERT WITH CHECK (auth.uid() = id); 
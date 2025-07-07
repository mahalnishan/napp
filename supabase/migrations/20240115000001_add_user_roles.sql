-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Create index for role column
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have 'user' role if null
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies that reference users.role
DROP POLICY IF EXISTS "Admin can update system settings" ON system_settings;
DROP POLICY IF EXISTS "Admin can manage all API keys" ON api_keys;

-- Recreate policies with proper role checking
CREATE POLICY "Admin can update system settings" ON system_settings
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admin can manage all API keys" ON api_keys
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated; 
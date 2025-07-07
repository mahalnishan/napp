-- =====================================================
-- ADMIN SETUP SCRIPT
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Add role column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));
    END IF;
END $$;

-- Update existing users to have 'user' role if null
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Create index for role column
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  registration_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  max_file_size INTEGER DEFAULT 10, -- in MB
  session_timeout INTEGER DEFAULT 24, -- in hours
  backup_enabled BOOLEAN DEFAULT TRUE,
  analytics_enabled BOOLEAN DEFAULT TRUE,
  debug_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insert default settings
INSERT INTO system_settings (
  id,
  maintenance_mode,
  registration_enabled,
  email_notifications,
  max_file_size,
  session_timeout,
  backup_enabled,
  analytics_enabled,
  debug_mode
) VALUES (
  1,
  FALSE,
  TRUE,
  TRUE,
  10,
  24,
  TRUE,
  TRUE,
  FALSE
) ON CONFLICT (id) DO NOTHING;

-- 3. Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
  rate_limit INTEGER DEFAULT 1000,
  permissions TEXT[] DEFAULT ARRAY['read'],
  usage_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create function to check if user is admin
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

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Enable RLS on tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read system settings" ON system_settings;
DROP POLICY IF EXISTS "Admin can update system settings" ON system_settings;
DROP POLICY IF EXISTS "Users can read own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON api_keys;
DROP POLICY IF EXISTS "Admin can manage all API keys" ON api_keys;

-- 8. Create RLS policies for system_settings
CREATE POLICY "Users can read system settings" ON system_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can update system settings" ON system_settings
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

-- 9. Create RLS policies for api_keys
CREATE POLICY "Users can read own API keys" ON api_keys
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can create API keys" ON api_keys
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own API keys" ON api_keys
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can delete own API keys" ON api_keys
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

-- 11. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 12. Grant permissions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;

-- 13. Make the first user an admin (optional - uncomment and modify as needed)
-- UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Verify the setup
SELECT 'Setup completed successfully!' as status;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('system_settings', 'api_keys') 
AND table_schema = 'public';

SELECT 'Functions created:' as info;
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('is_admin', 'update_updated_at_column')
AND routine_schema = 'public'; 
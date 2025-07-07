-- Create system_settings table for admin configuration
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

-- Create API keys table for API management
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

-- Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can read system settings
CREATE POLICY "Users can read system settings" ON system_settings
  FOR SELECT TO authenticated
  USING (true);

-- Policy: Only admin users can update system settings
CREATE POLICY "Admin can update system settings" ON system_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: Users can read their own API keys
CREATE POLICY "Users can read own API keys" ON api_keys
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can create their own API keys
CREATE POLICY "Users can create API keys" ON api_keys
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own API keys
CREATE POLICY "Users can update own API keys" ON api_keys
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can delete their own API keys
CREATE POLICY "Users can delete own API keys" ON api_keys
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admin can manage all API keys
CREATE POLICY "Admin can manage all API keys" ON api_keys
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 
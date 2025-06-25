-- Add missing profile fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add new columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS client_type VARCHAR(100) DEFAULT 'Individual',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing clients to have default values
UPDATE public.clients 
SET client_type = 'Individual' 
WHERE client_type IS NULL;

UPDATE public.clients 
SET is_active = true 
WHERE is_active IS NULL; 
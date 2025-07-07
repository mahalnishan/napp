-- Make the current user an admin
-- Replace 'your-email@example.com' with your actual email address

UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, role, created_at 
FROM users 
WHERE email = 'your-email@example.com'; 
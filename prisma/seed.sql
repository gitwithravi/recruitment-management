INSERT INTO users (
  id,
  name,
  username,
  email,
  password_hash,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'seed_admin_user',
  'System Admin',
  'admin',
  'admin@example.com',
  'phase-2-auth-placeholder-change-before-login',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

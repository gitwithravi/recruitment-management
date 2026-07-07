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
  '$argon2id$v=19$m=65536,t=3,p=4$uMBoEdHih5j0goivzIv/aA$whgzSGy0xb0XoKRDkxJ/dEwa0eM7UxxrXOZ1TbPpP+8',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

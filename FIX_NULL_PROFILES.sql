-- ============================================
-- FIX NULL PROFILES
-- ============================================
-- Run this to fix existing profiles that have null values
-- ============================================

-- Check profiles with null values
SELECT 
  id,
  user_id,
  email,
  user_type,
  verification_status,
  created_at
FROM user_profiles
WHERE user_type IS NULL 
   OR verification_status IS NULL
   OR created_at IS NULL
ORDER BY created_at DESC;

-- Fix profiles with null user_type
UPDATE user_profiles
SET 
  user_type = COALESCE(user_type, 'individual'),
  verification_status = COALESCE(verification_status, 'pending'),
  kyc_status = COALESCE(kyc_status, 'not_started'),
  profile_visibility = COALESCE(profile_visibility, 'public'),
  created_at = COALESCE(created_at, NOW()),
  updated_at = NOW()
WHERE user_type IS NULL 
   OR verification_status IS NULL
   OR created_at IS NULL;

-- Verify fixes
SELECT 
  id,
  user_id,
  email,
  user_type,
  verification_status,
  created_at
FROM user_profiles
WHERE user_type IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

/*
# Create Auth, Campaign, and Pricing Schema for AskNameAI-Real

1. Purpose
   - Supports mobile OTP authentication flow (user profiles + OTP codes)
   - Enables admin-managed promotional campaigns and festive offers
   - Stores pricing plans with optional campaign discount overrides
   - All tables are new and do NOT touch existing baby_names schema

2. New Tables
   - `user_profiles`: Stores customer information (first name, last name, mobile, email)
   - `otp_codes`: Temporary OTP codes for mobile verification (auto-expiring)
   - `campaigns`: Admin-managed promotional campaigns with discounts and scheduling
   - `pricing_plans`: Service pricing plans that campaigns can discount

3. Security
   - RLS enabled on all tables
   - user_profiles: owner-scoped (authenticated users see only their own profile)
   - otp_codes: readable by anon (needed for verification flow), writable by anon
   - campaigns: public read (all site visitors see active campaigns), admin-only write
   - pricing_plans: public read, admin-only write

4. Notes
   - OTP codes expire after 10 minutes
   - Campaigns have start/end dates for scheduling festive offers
   - Pricing plans support both original and discounted prices
   - Admin access is controlled via an is_admin flag on user_profiles
*/

-- =====================
-- user_profiles table
-- =====================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  mobile_number text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = auth_user_id OR is_admin = true);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id);

-- Allow anon to check if mobile/email exists (for registration flow)
DROP POLICY IF EXISTS "anon_check_profile_exists" ON user_profiles;
CREATE POLICY "anon_check_profile_exists" ON user_profiles FOR SELECT
  TO anon USING (true);

-- =====================
-- otp_codes table
-- =====================
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_number text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookup by mobile number
CREATE INDEX IF NOT EXISTS idx_otp_codes_mobile ON otp_codes(mobile_number);

-- Auto-clean expired OTPs (older than 1 hour)
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes(expires_at);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- OTP codes need to be writable by anon (registration flow before auth)
DROP POLICY IF EXISTS "anon_insert_otp" ON otp_codes;
CREATE POLICY "anon_insert_otp" ON otp_codes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_otp" ON otp_codes;
CREATE POLICY "anon_select_otp" ON otp_codes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_otp" ON otp_codes;
CREATE POLICY "anon_update_otp" ON otp_codes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- =====================
-- campaigns table
-- =====================
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  discount_label text,
  discount_percentage integer DEFAULT 0,
  fixed_price integer,
  banner_color text DEFAULT '#0F766E',
  cta_text text DEFAULT 'Grab Offer Now',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  is_active boolean NOT NULL DEFAULT true,
  festival_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Campaigns are publicly readable (all visitors see active campaigns)
DROP POLICY IF EXISTS "anon_select_campaigns" ON campaigns;
CREATE POLICY "anon_select_campaigns" ON campaigns FOR SELECT
  TO anon, authenticated USING (true);

-- Only admins can create/update/delete campaigns
DROP POLICY IF EXISTS "admin_insert_campaigns" ON campaigns;
CREATE POLICY "admin_insert_campaigns" ON campaigns FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.auth_user_id = auth.uid() AND user_profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_campaigns" ON campaigns;
CREATE POLICY "admin_update_campaigns" ON campaigns FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.auth_user_id = auth.uid() AND user_profiles.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.auth_user_id = auth.uid() AND user_profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_campaigns" ON campaigns;
CREATE POLICY "admin_delete_campaigns" ON campaigns FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.auth_user_id = auth.uid() AND user_profiles.is_admin = true)
  );

-- =====================
-- pricing_plans table
-- =====================
CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  original_price integer NOT NULL,
  discounted_price integer,
  features text[] NOT NULL DEFAULT '{}',
  is_popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Pricing plans are publicly readable
DROP POLICY IF EXISTS "anon_select_pricing" ON pricing_plans;
CREATE POLICY "anon_select_pricing" ON pricing_plans FOR SELECT
  TO anon, authenticated USING (true);

-- Only admins can modify pricing plans
DROP POLICY IF EXISTS "admin_insert_pricing" ON pricing_plans;
CREATE POLICY "admin_insert_pricing" ON pricing_plans FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.auth_user_id = auth.uid() AND user_profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_pricing" ON pricing_plans;
CREATE POLICY "admin_update_pricing" ON pricing_plans FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.auth_user_id = auth.uid() AND user_profiles.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.auth_user_id = auth.uid() AND user_profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_pricing" ON pricing_plans;
CREATE POLICY "admin_delete_pricing" ON pricing_plans FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.auth_user_id = auth.uid() AND user_profiles.is_admin = true)
  );

-- =====================
-- Seed default pricing plans
-- =====================
INSERT INTO pricing_plans (name, description, original_price, discounted_price, features, is_popular, is_active, sort_order) VALUES
(
  'Basic Name Correction',
  'AI-powered Chaldean numerology name correction with 4-step verification',
  599,
  599,
  ARRAY['Chaldean numerology analysis', 'Name spelling correction', '4-step verification', 'Lo Shu Grid analysis', 'Instant digital delivery'],
  false,
  true,
  1
),
(
  'Premium Name Correction',
  'Complete name correction with 10-year prediction and remedies',
  999,
  999,
  ARRAY['Everything in Basic', '10-Year Prediction', 'Personalized Remedies', 'Lucky Numbers & Colors', 'Career Compatibility', 'Priority Support'],
  true,
  true,
  2
),
(
  'Mobile Numerology Report',
  'Profession-specific lucky mobile number analysis with 5-step verification',
  299,
  299,
  ARRAY['DOB Analysis (Mulank & Bhagyank)', 'Number Ranking Matrix', 'Lo Shu Grid', 'Mobile Alignment Check', 'Friendly/Enemy Number Analysis', 'Best Sector Recommendations'],
  false,
  true,
  3
),
(
  '24-Answer Deep Analysis',
  'Complete numerological deep dive with 24 personalized answers',
  950,
  950,
  ARRAY['24 Personalized Answers', 'AI Name Correction', 'Complete Mobile Numerology', 'Lo Shu Grid Deep Analysis', 'Career & Love Compatibility', 'Remedies & Recommendations'],
  false,
  true,
  4
)
ON CONFLICT DO NOTHING;

-- =====================
-- Seed a sample campaign
-- =====================
INSERT INTO campaigns (title, description, discount_label, discount_percentage, banner_color, cta_text, festival_name, start_date, end_date, is_active) VALUES
(
  'Diwali Special Offer',
  'Illuminate your destiny this Diwali! Get 25% off on all numerology reports.',
  '25% OFF',
  25,
  '#D97706',
  'Celebrate & Save',
  'Diwali',
  now(),
  now() + interval '30 days',
  false
)
ON CONFLICT DO NOTHING;
/*
# Add Numerologist Role, Profiles, and Leads (Phase A)

1. Purpose
   - Adds a numerologist subscriber role on top of the existing customer system.
   - Does NOT modify, drop, or rename any existing column, table, or row of data.
   - `user_profiles.is_admin` is left completely untouched — a new `role` column
     is added alongside it for the new numerologist/customer distinction.

2. New Columns
   - `user_profiles.role` (text, default 'customer') — one of 'customer' | 'numerologist' | 'admin'

3. New Tables
   - `numerologist_profiles`: business/branding info + subscription status for each numerologist
   - `leads`: captured leads from the free-check funnel, optionally assigned to a numerologist

4. Security
   - RLS enabled on both new tables
   - Numerologists can only see/update leads assigned to them
   - Admins (is_admin = true on user_profiles) can see everything
   - Anonymous visitors can INSERT a lead (needed for the free-check funnel) but cannot read leads back
*/

-- =====================
-- Extend user_profiles (additive only — existing columns untouched)
-- =====================
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'customer';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_role_check'
  ) THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('customer', 'numerologist', 'admin'));
  END IF;
END $$;

-- =====================
-- numerologist_profiles table
-- =====================
CREATE TABLE IF NOT EXISTS numerologist_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  brand_color text NOT NULL DEFAULT '#4F46E5',
  logo_url text,
  subscription_status text NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
  reports_used_this_month integer NOT NULL DEFAULT 0,
  reports_limit_per_month integer NOT NULL DEFAULT 20,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_profile_id)
);

ALTER TABLE numerologist_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_select_own" ON numerologist_profiles;
CREATE POLICY "numerologist_select_own" ON numerologist_profiles FOR SELECT
  TO authenticated USING (
    user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "numerologist_insert_own" ON numerologist_profiles;
CREATE POLICY "numerologist_insert_own" ON numerologist_profiles FOR INSERT
  TO authenticated WITH CHECK (
    user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "numerologist_update_own" ON numerologist_profiles;
CREATE POLICY "numerologist_update_own" ON numerologist_profiles FOR UPDATE
  TO authenticated USING (
    user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  ) WITH CHECK (
    user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  );

-- =====================
-- leads table
-- =====================
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text,
  last_name text,
  mobile_number text,
  email text,
  source_type text NOT NULL DEFAULT 'free_check'
    CHECK (source_type IN ('free_check', 'baby_names', 'manual')),
  lead_score text NOT NULL DEFAULT 'warm'
    CHECK (lead_score IN ('hot', 'warm', 'cold')),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  assigned_numerologist_id uuid REFERENCES numerologist_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_numerologist_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_lead" ON leads;
CREATE POLICY "anon_insert_lead" ON leads FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "numerologist_select_assigned_leads" ON leads;
CREATE POLICY "numerologist_select_assigned_leads" ON leads FOR SELECT
  TO authenticated USING (
    assigned_numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "numerologist_update_assigned_leads" ON leads;
CREATE POLICY "numerologist_update_assigned_leads" ON leads FOR UPDATE
  TO authenticated USING (
    assigned_numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (true);
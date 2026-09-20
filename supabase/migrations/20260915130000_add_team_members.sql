/*
# Team / staff accounts (Part II)

1. Purpose
   - Lets a numerologist add staff under their business. Staff log in
     with their own mobile+OTP account (the existing customer auth flow)
     and, once linked, see the same dashboard scoped to their employer's
     numerologist_id instead of needing their own numerologist_profiles
     row.

2. New Table
   - `team_members`: numerologist_id (the employer), user_profile_id
     (nullable until the invited mobile number actually has an account),
     mobile_number (denormalized so an invite can be issued before the
     staff member has registered), status ('invited' | 'active' | 'removed').

3. Security
   - RLS: an owner can manage their own team. A linked, active staff
     member can read (but not manage) their employer's team_members row
     for identity resolution.
   - Existing `deals`, `activities`, `numerology_reports` SELECT/INSERT
     policies are extended (not replaced - the existing owner clause
     stays, this only adds an additional OR branch) so an active staff
     member gets the same access an owner has to their employer's data.
*/

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  user_profile_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  mobile_number text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('staff')),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'removed')),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  UNIQUE (numerologist_id, mobile_number)
);

CREATE INDEX IF NOT EXISTS idx_team_numerologist ON team_members(numerologist_id);
CREATE INDEX IF NOT EXISTS idx_team_user_profile ON team_members(user_profile_id);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_manage_team" ON team_members;
CREATE POLICY "owner_manage_team" ON team_members FOR ALL
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
  ) WITH CHECK (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "staff_read_own_membership" ON team_members;
CREATE POLICY "staff_read_own_membership" ON team_members FOR SELECT
  TO authenticated USING (
    user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  );

-- Helper: is the current auth user an active staff member of this numerologist?
CREATE OR REPLACE FUNCTION public.is_active_team_member(target_numerologist_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members tm
    JOIN user_profiles up ON up.id = tm.user_profile_id
    WHERE tm.numerologist_id = target_numerologist_id
      AND tm.status = 'active'
      AND up.auth_user_id = auth.uid()
  );
$$;

-- Extend deals SELECT/UPDATE to include active staff
DROP POLICY IF EXISTS "numerologist_select_own_deals" ON deals;
CREATE POLICY "numerologist_select_own_deals" ON deals FOR SELECT
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(numerologist_id)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "numerologist_update_own_deals" ON deals;
CREATE POLICY "numerologist_update_own_deals" ON deals FOR UPDATE
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(numerologist_id)
  ) WITH CHECK (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(numerologist_id)
  );

-- Extend activities SELECT/INSERT to include active staff
DROP POLICY IF EXISTS "numerologist_select_own_activities" ON activities;
CREATE POLICY "numerologist_select_own_activities" ON activities FOR SELECT
  TO authenticated USING (
    lead_id IN (
      SELECT d.lead_id FROM deals d
      JOIN numerologist_profiles np ON np.id = d.numerologist_id
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR lead_id IN (
      SELECT d.lead_id FROM deals d WHERE public.is_active_team_member(d.numerologist_id)
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "numerologist_insert_own_activities" ON activities;
CREATE POLICY "numerologist_insert_own_activities" ON activities FOR INSERT
  TO authenticated WITH CHECK (
    lead_id IN (
      SELECT d.lead_id FROM deals d
      JOIN numerologist_profiles np ON np.id = d.numerologist_id
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR lead_id IN (
      SELECT d.lead_id FROM deals d WHERE public.is_active_team_member(d.numerologist_id)
    )
  );

-- Extend numerology_reports SELECT/INSERT to include active staff
DROP POLICY IF EXISTS "numerologist_select_own_reports" ON numerology_reports;
CREATE POLICY "numerologist_select_own_reports" ON numerology_reports FOR SELECT
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(numerologist_id)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "numerologist_insert_own_reports" ON numerology_reports;
CREATE POLICY "numerologist_insert_own_reports" ON numerology_reports FOR INSERT
  TO authenticated WITH CHECK (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(numerologist_id)
  );

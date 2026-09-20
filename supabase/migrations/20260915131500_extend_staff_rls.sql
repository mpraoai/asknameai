/*
# Extend staff RLS to leads and numerologist_profiles

The previous migration extended deals/activities/numerology_reports for
active staff members but missed two tables staff also need to read:
leads (to see their employer's assigned leads) and numerologist_profiles
(to see their employer's business name/branding for the dashboard shell).
Both extensions only ADD an OR branch - the existing owner/admin access
is untouched.
*/

DROP POLICY IF EXISTS "numerologist_select_assigned_leads" ON leads;
CREATE POLICY "numerologist_select_assigned_leads" ON leads FOR SELECT
  TO authenticated USING (
    assigned_numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(assigned_numerologist_id)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "numerologist_select_own" ON numerologist_profiles;
CREATE POLICY "numerologist_select_own" ON numerologist_profiles FOR SELECT
  TO authenticated USING (
    user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
    OR public.is_active_team_member(id)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

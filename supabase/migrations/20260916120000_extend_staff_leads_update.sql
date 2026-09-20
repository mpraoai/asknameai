/*
# Extend staff RLS: leads UPDATE

Auditing the new tag/bulk-edit features found that the original
`numerologist_update_assigned_leads` policy (Part I) only ever allowed
the owner (or an admin) to UPDATE a lead - active staff members could
SELECT a lead (per 20260915131500) but never update its status, score,
channel, or now its tags. Since staff routinely work leads day to day,
this was a real gap, not just something new features exposed.

Only adds an OR branch - existing owner/admin access is untouched.
*/

DROP POLICY IF EXISTS "numerologist_update_assigned_leads" ON leads;
CREATE POLICY "numerologist_update_assigned_leads" ON leads FOR UPDATE
  TO authenticated USING (
    assigned_numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(assigned_numerologist_id)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (true);

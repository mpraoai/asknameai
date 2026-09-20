/*
# Let the product owner see team headcount per subscriber

The Subscribers detail view needs to show team size (solo vs. has staff)
- team_members never had an admin bypass. Purely additive SELECT-only
policy; the existing owner/staff management policies are untouched.
*/

DROP POLICY IF EXISTS "admin_select_all_team_members" ON team_members;
CREATE POLICY "admin_select_all_team_members" ON team_members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

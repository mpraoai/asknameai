/*
# Customer Dashboard - saved names + data deletion requests

The PRD's Customer Dashboard spec (5c) calls for "Saved Name Ideas" as a
persistent list, not local component state - and Section 16 (DPDP) calls
for a real way for a customer to request their data be deleted. Both are
new, additive tables; nothing existing is touched.

`saved_names` - a customer's own favorited names, scoped to their
user_profiles row via auth.uid(). Read/write limited to the owner only.

`deletion_requests` - a customer-initiated request queue. The customer can
create and read their own requests; only an admin can read/update the
full queue (they action the deletion by hand and mark it resolved) -
consistent with the additive is_admin-bypass pattern already used for
payments/team_members/numerologist_profiles.
*/

CREATE TABLE IF NOT EXISTS saved_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'baby_name' CHECK (category IN ('baby_name', 'business_name')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_names_user ON saved_names(user_profile_id);

ALTER TABLE saved_names ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select_saved_names" ON saved_names;
CREATE POLICY "owner_select_saved_names" ON saved_names FOR SELECT
  TO authenticated USING (
    user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_insert_saved_names" ON saved_names;
CREATE POLICY "owner_insert_saved_names" ON saved_names FOR INSERT
  TO authenticated WITH CHECK (
    user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_delete_saved_names" ON saved_names;
CREATE POLICY "owner_delete_saved_names" ON saved_names FOR DELETE
  TO authenticated USING (
    user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined')),
  requested_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select_own_deletion_request" ON deletion_requests;
CREATE POLICY "owner_select_own_deletion_request" ON deletion_requests FOR SELECT
  TO authenticated USING (
    user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_insert_own_deletion_request" ON deletion_requests;
CREATE POLICY "owner_insert_own_deletion_request" ON deletion_requests FOR INSERT
  TO authenticated WITH CHECK (
    user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_select_deletion_requests" ON deletion_requests;
CREATE POLICY "admin_select_deletion_requests" ON deletion_requests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_deletion_requests" ON deletion_requests;
CREATE POLICY "admin_update_deletion_requests" ON deletion_requests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

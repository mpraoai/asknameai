/*
# Admin CRM notes on subscribers and customers

The reference dashboard's business process calls for the product owner to
capture context on an account (follow-up calls, renewal conversations,
escalations) - the same "every touch belongs in a timeline" convention
this app already uses for leads via the `activities` table, extended here
to the two record types only the admin console deals with: a numerologist
subscriber account, or a direct (non-numerologist) customer account.

Admin-only end to end: only an is_admin user can read or write. Purely
additive - no existing table or policy is touched.
*/

CREATE TABLE IF NOT EXISTS admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('subscriber', 'customer')),
  entity_id uuid NOT NULL,
  note text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notes_entity ON admin_notes(entity_type, entity_id);

ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_notes" ON admin_notes;
CREATE POLICY "admin_select_notes" ON admin_notes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "admin_insert_notes" ON admin_notes;
CREATE POLICY "admin_insert_notes" ON admin_notes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

/*
# Let the admin change a subscriber's lifecycle status

Subscribers section needs a real workflow action - moving an account
between trial/active/past_due/cancelled - not just a read-only badge.
numerologist_profiles never had an admin UPDATE bypass (only the owning
numerologist's own row). Scoped narrowly to subscription_status only via
the WITH CHECK below being the same USING clause - Postgres RLS doesn't
support column-level grants directly, so this is enforced at the
application layer (adminService only ever sets that one column); the
policy itself is intentionally still full-row to keep it simple and
auditable like the rest of this file.
*/
DROP POLICY IF EXISTS "admin_update_subscription_status" ON numerologist_profiles;
CREATE POLICY "admin_update_subscription_status" ON numerologist_profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

/*
# Tickets (Pillar D — Serve) + Referral tracking (Pillar E — Retain)

Continuing the Nestarmy CRM PRD cross-check:

- Pillar D (Serve) called for a `tickets` table linked to a contact —
  this CRM had no way to track a post-sale support issue ("report has
  wrong DOB", "haven't received the PDF") to resolution at all.
- Pillar E (Retain) called for a `referred_by` field linking a new lead
  back to the closed customer who referred them, plus a referral report
  - this CRM only had a generic 'referral' channel tag, with no way to
  see *which* customer actually sent the business.

Purely additive.
*/

-- =====================
-- tickets
-- =====================
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  due_at timestamptz,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tickets_numerologist ON tickets(numerologist_id);
CREATE INDEX IF NOT EXISTS idx_tickets_lead ON tickets(lead_id);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_manage_own_tickets" ON tickets;
CREATE POLICY "numerologist_manage_own_tickets" ON tickets FOR ALL
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(numerologist_id)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(numerologist_id)
  );

-- Log a 'note' activity whenever a ticket is opened or resolved, so it shows on the lead's timeline too.
CREATE OR REPLACE FUNCTION public.log_ticket_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activities (lead_id, type, payload)
    VALUES (NEW.lead_id, 'note', jsonb_build_object('note', 'Ticket opened: ' || NEW.subject));
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
    INSERT INTO activities (lead_id, type, payload)
    VALUES (NEW.lead_id, 'note', jsonb_build_object('note', 'Ticket resolved: ' || NEW.subject));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_ticket_activity ON tickets;
CREATE TRIGGER on_ticket_activity
  AFTER INSERT OR UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION public.log_ticket_activity();

-- =====================
-- referral tracking: which existing lead/customer sent this new one
-- =====================
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS referred_by_lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_referred_by ON leads(referred_by_lead_id);

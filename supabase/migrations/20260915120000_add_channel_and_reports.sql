/*
# Lead channel tracking + in-dashboard numerology reports

1. Purpose
   - Adds a `channel` column to `leads` so the dashboard can break down
     where leads actually come from (YouTube, Instagram, Facebook,
     LinkedIn, WhatsApp, website, referral, existing customer, etc.),
     not just which internal funnel (source_type) captured them.
   - Adds a `numerology_reports` table so a numerologist can run the
     existing numerology engine against one of their leads directly from
     the dashboard, and see a history of reports they've generated -
     this does NOT touch src/lib/numerology.ts, it only stores the
     result of calling it from a new, unprotected UI.
   - Auto-increments numerologist_profiles.reports_used_this_month
     whenever a report is generated, so the Plan & Billing usage bar
     reflects real activity.

2. Purely additive - no existing column, table or row is altered.
*/

-- =====================
-- leads.channel (marketing channel, distinct from source_type funnel)
-- =====================
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'website';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_channel_check'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT leads_channel_check CHECK (channel IN (
        'website', 'youtube', 'instagram', 'facebook', 'linkedin',
        'whatsapp', 'referral', 'existing_customer', 'organic', 'other'
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_channel ON leads(channel);

-- =====================
-- numerology_reports table
-- =====================
CREATE TABLE IF NOT EXISTS numerology_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  dob date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  result jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_numerologist ON numerology_reports(numerologist_id);
CREATE INDEX IF NOT EXISTS idx_reports_lead ON numerology_reports(lead_id);

ALTER TABLE numerology_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_select_own_reports" ON numerology_reports;
CREATE POLICY "numerologist_select_own_reports" ON numerology_reports FOR SELECT
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
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
  );

-- =====================
-- Auto-increment usage counter on report generation
-- =====================
CREATE OR REPLACE FUNCTION public.increment_reports_used()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE numerologist_profiles
  SET reports_used_this_month = reports_used_this_month + 1
  WHERE id = NEW.numerologist_id;

  IF NEW.lead_id IS NOT NULL THEN
    INSERT INTO activities (lead_id, type, payload)
    VALUES (NEW.lead_id, 'report_sent', jsonb_build_object('report_id', NEW.id));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_report_generated ON numerology_reports;
CREATE TRIGGER on_report_generated
  AFTER INSERT ON numerology_reports
  FOR EACH ROW EXECUTE FUNCTION public.increment_reports_used();

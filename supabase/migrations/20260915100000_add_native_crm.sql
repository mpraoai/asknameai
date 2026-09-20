/*
# Native CRM core (Part II Phase D1)

1. Purpose
   - Adds a lead pipeline on top of the existing `leads` table: pipeline
     stages, one deal per lead, and an activity timeline.
   - Purely additive. Does not touch user_profiles, numerologist_profiles,
     or leads in any destructive way.

2. New Tables
   - `crm_stages`: shared pipeline stages (New, Contacted, Qualified,
     Proposal Sent, Won, Lost), seeded once, editable later.
   - `deals`: one row per lead assigned to a numerologist, tracks stage
     and deal value.
   - `activities`: timeline entries per lead (stage changes, calls,
     messages, reports sent).

3. Automation
   - A trigger on `leads` creates a matching `deals` row (in the default
     stage) whenever a lead gets assigned to a numerologist - covers both
     the existing auto-assign trigger and any future manual assignment.
   - Existing leads that already have an assigned_numerologist_id are
     backfilled with a deal in this same migration.

4. Security
   - RLS enabled on all three tables. Numerologists see only their own
     deals/activities (via deals.numerologist_id), admins see everything.
     crm_stages is readable by any authenticated user (shared reference
     data, not per-tenant).
*/

-- =====================
-- crm_stages table
-- =====================
CREATE TABLE IF NOT EXISTS crm_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_stages" ON crm_stages;
CREATE POLICY "authenticated_select_stages" ON crm_stages FOR SELECT
  TO authenticated USING (true);

INSERT INTO crm_stages (name, sort_order, is_default)
VALUES
  ('New', 1, true),
  ('Contacted', 2, false),
  ('Qualified', 3, false),
  ('Proposal Sent', 4, false),
  ('Won', 5, false),
  ('Lost', 6, false)
ON CONFLICT (name) DO NOTHING;

-- =====================
-- deals table
-- =====================
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES crm_stages(id),
  value numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (lead_id)
);

CREATE INDEX IF NOT EXISTS idx_deals_numerologist ON deals(numerologist_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage_id);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_select_own_deals" ON deals;
CREATE POLICY "numerologist_select_own_deals" ON deals FOR SELECT
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
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
  ) WITH CHECK (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
  );

-- =====================
-- activities table
-- =====================
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('stage_change', 'call', 'message', 'report_sent', 'note')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_select_own_activities" ON activities;
CREATE POLICY "numerologist_select_own_activities" ON activities FOR SELECT
  TO authenticated USING (
    lead_id IN (
      SELECT d.lead_id FROM deals d
      JOIN numerologist_profiles np ON np.id = d.numerologist_id
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
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
  );

-- =====================
-- Auto-create a deal whenever a lead is assigned
-- =====================
CREATE OR REPLACE FUNCTION public.create_deal_for_assigned_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_stage_id uuid;
BEGIN
  IF NEW.assigned_numerologist_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.assigned_numerologist_id IS NOT DISTINCT FROM NEW.assigned_numerologist_id THEN
    RETURN NEW;
  END IF;

  SELECT id INTO default_stage_id FROM crm_stages WHERE is_default = true LIMIT 1;
  IF default_stage_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO deals (lead_id, numerologist_id, stage_id)
  VALUES (NEW.id, NEW.assigned_numerologist_id, default_stage_id)
  ON CONFLICT (lead_id) DO UPDATE SET numerologist_id = EXCLUDED.numerologist_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_lead_assigned_create_deal ON leads;
CREATE TRIGGER on_lead_assigned_create_deal
  AFTER INSERT OR UPDATE OF assigned_numerologist_id ON leads
  FOR EACH ROW EXECUTE FUNCTION public.create_deal_for_assigned_lead();

-- Backfill: create deals for any existing assigned leads that predate this migration
INSERT INTO deals (lead_id, numerologist_id, stage_id)
SELECT l.id, l.assigned_numerologist_id, (SELECT id FROM crm_stages WHERE is_default = true LIMIT 1)
FROM leads l
WHERE l.assigned_numerologist_id IS NOT NULL
ON CONFLICT (lead_id) DO NOTHING;

-- =====================
-- Log a stage_change activity whenever a deal's stage changes
-- =====================
CREATE OR REPLACE FUNCTION public.log_deal_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    INSERT INTO activities (lead_id, type, payload)
    VALUES (
      NEW.lead_id,
      'stage_change',
      jsonb_build_object('stage_id', NEW.stage_id)
    );
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_deal_stage_change ON deals;
CREATE TRIGGER on_deal_stage_change
  BEFORE INSERT OR UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION public.log_deal_stage_change();

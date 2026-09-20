/*
# Per-numerologist pipeline stages + playbooks + forecast probability

Cross-checking against the Nestarmy CRM PRD (Pillar C — Sales Pipeline)
found a real architectural gap: crm_stages was a single GLOBAL table
shared by every subscriber, so no numerologist could match the pipeline
to their own actual funnel - exactly the flexibility that reference PRD
treats as a Phase 0 requirement, not a nice-to-have.

This migration:
1. Makes crm_stages per-numerologist (numerologist_id column), seeding
   every existing numerologist with their own copy of the same 6 default
   stages they already had, and repointing their deals to those personal
   rows - no visible change for anyone until they choose to customize.
2. Adds `playbook` (a script/checklist shown in the deal view - "what to
   say/ask", useful since staff experience varies - Pillar C) and
   `probability_pct` (feeds a weighted pipeline forecast).
3. Adds `is_won`/`is_lost` boolean flags so a numerologist can rename
   "Won"/"Lost" to their own language (a report was delivered, a client
   declined) without breaking the app logic that currently keys off the
   literal English words.
4. A new numerologist_profiles row auto-seeds its own 6 stages going
   forward via trigger - no more single shared default to fall back on.

Additive and backward-compatible: every existing deal keeps its stage,
just repointed to a personal copy with the identical name/order.
*/

ALTER TABLE crm_stages
  ADD COLUMN IF NOT EXISTS numerologist_id uuid REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS playbook text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS probability_pct integer NOT NULL DEFAULT 0 CHECK (probability_pct BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS is_won boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_lost boolean NOT NULL DEFAULT false;

-- "New", "Won" etc must only be unique per numerologist now, not globally.
ALTER TABLE crm_stages DROP CONSTRAINT IF EXISTS crm_stages_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_stages_numerologist_name ON crm_stages(numerologist_id, name);

CREATE INDEX IF NOT EXISTS idx_crm_stages_numerologist ON crm_stages(numerologist_id);

-- Mark the existing global rows' won/lost flags so the repoint step below
-- (and this data) stays correct even before every numerologist has their
-- own copy.
UPDATE crm_stages SET is_won = true WHERE numerologist_id IS NULL AND name = 'Won';
UPDATE crm_stages SET is_lost = true WHERE numerologist_id IS NULL AND name = 'Lost';
UPDATE crm_stages SET probability_pct = CASE name
  WHEN 'New' THEN 10 WHEN 'Contacted' THEN 25 WHEN 'Qualified' THEN 40
  WHEN 'Proposal Sent' THEN 60 WHEN 'Won' THEN 100 WHEN 'Lost' THEN 0 ELSE 0 END
WHERE numerologist_id IS NULL;

-- Give every existing numerologist their own copy of the same stages.
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM numerologist_profiles WHERE NOT EXISTS (SELECT 1 FROM crm_stages WHERE numerologist_id = numerologist_profiles.id) LOOP
    INSERT INTO crm_stages (numerologist_id, name, sort_order, is_default, probability_pct, is_won, is_lost)
    VALUES
      (rec.id, 'New', 1, true, 10, false, false),
      (rec.id, 'Contacted', 2, false, 25, false, false),
      (rec.id, 'Qualified', 3, false, 40, false, false),
      (rec.id, 'Proposal Sent', 4, false, 60, false, false),
      (rec.id, 'Won', 5, false, 100, true, false),
      (rec.id, 'Lost', 6, false, 0, false, true);
  END LOOP;
END $$;

-- Repoint every deal still pointing at an old global stage row to its
-- numerologist's new personal copy of that same-named stage.
UPDATE deals d
SET stage_id = (
  SELECT new_stage.id FROM crm_stages new_stage
  JOIN crm_stages old_stage ON old_stage.id = d.stage_id
  WHERE new_stage.numerologist_id = d.numerologist_id AND new_stage.name = old_stage.name
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM crm_stages old_stage WHERE old_stage.id = d.stage_id AND old_stage.numerologist_id IS NULL
);

-- The old global rows are now unreferenced - remove them, per-tenant rows are authoritative from here on.
DELETE FROM crm_stages WHERE numerologist_id IS NULL;

-- =====================
-- New numerologist -> seed their own default stages automatically
-- =====================
CREATE OR REPLACE FUNCTION public.seed_default_crm_stages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO crm_stages (numerologist_id, name, sort_order, is_default, probability_pct, is_won, is_lost)
  VALUES
    (NEW.id, 'New', 1, true, 10, false, false),
    (NEW.id, 'Contacted', 2, false, 25, false, false),
    (NEW.id, 'Qualified', 3, false, 40, false, false),
    (NEW.id, 'Proposal Sent', 4, false, 60, false, false),
    (NEW.id, 'Won', 5, false, 100, true, false),
    (NEW.id, 'Lost', 6, false, 0, false, true);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_numerologist_created_seed_stages ON numerologist_profiles;
CREATE TRIGGER on_numerologist_created_seed_stages
  AFTER INSERT ON numerologist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_crm_stages();

-- =====================
-- Fix: auto-create-deal trigger picked the (now removed) global default.
-- Must pick the new lead's own numerologist's default stage.
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

  SELECT id INTO default_stage_id FROM crm_stages WHERE is_default = true AND numerologist_id = NEW.assigned_numerologist_id LIMIT 1;
  IF default_stage_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO deals (lead_id, numerologist_id, stage_id)
  VALUES (NEW.id, NEW.assigned_numerologist_id, default_stage_id)
  ON CONFLICT (lead_id) DO UPDATE SET numerologist_id = EXCLUDED.numerologist_id;

  RETURN NEW;
END;
$$;

-- =====================
-- Fix: stalled-task detection keyed off the literal words "Won"/"Lost" -
-- now uses the flags so a renamed stage still behaves correctly.
-- =====================
CREATE OR REPLACE FUNCTION public.create_followup_tasks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  created_count integer;
BEGIN
  INSERT INTO tasks (lead_id, deal_id, numerologist_id, reason, due_at)
  SELECT
    d.lead_id,
    d.id,
    d.numerologist_id,
    'No movement for ' || EXTRACT(DAY FROM now() - d.updated_at)::int || ' days - follow up',
    now()
  FROM deals d
  JOIN crm_stages s ON s.id = d.stage_id
  WHERE NOT s.is_won AND NOT s.is_lost
    AND d.updated_at < now() - interval '7 days'
  ON CONFLICT (deal_id) WHERE completed_at IS NULL DO NOTHING;

  GET DIAGNOSTICS created_count = ROW_COUNT;
  RETURN created_count;
END;
$$;

-- =====================
-- RLS: replace the old "shared reference data, readable by anyone"
-- policy with per-tenant access. SELECT is open to owner + staff so
-- everyone working the pipeline can see stage names/playbooks; only the
-- owner (or an admin) can add, rename, reorder or delete stages.
-- =====================
DROP POLICY IF EXISTS "authenticated_select_stages" ON crm_stages;

DROP POLICY IF EXISTS "stages_select" ON crm_stages;
CREATE POLICY "stages_select" ON crm_stages FOR SELECT
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(numerologist_id)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "stages_owner_insert" ON crm_stages;
CREATE POLICY "stages_owner_insert" ON crm_stages FOR INSERT
  TO authenticated WITH CHECK (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "stages_owner_update" ON crm_stages;
CREATE POLICY "stages_owner_update" ON crm_stages FOR UPDATE
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "stages_owner_delete" ON crm_stages;
CREATE POLICY "stages_owner_delete" ON crm_stages FOR DELETE
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

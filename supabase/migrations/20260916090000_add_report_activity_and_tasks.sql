/*
# D1 completion: report_sent activity logging + follow-up tasks

Part II §II.3 specifies the CRM activity timeline logs "every touch on a
lead — form fill, call, message, report sent, stage change — logged
automatically, not manually entered" and that "a follow-up task auto-
created whenever a lead sits in a stage past its expected dwell time."
Auditing D1 against that found two real gaps this migration closes:

1. Generating a numerology report for a lead was never logged as an
   activity - the timeline showed notes and stage changes only.
2. There was no `tasks` table at all, so nothing was ever auto-created
   when a deal went stale.

Purely additive. No existing table, column or row is altered.
*/

-- =====================
-- Gap 1: log a 'report_sent' activity whenever a report is generated
-- for a lead (skipped only when the report isn't tied to a lead at all).
-- =====================
CREATE OR REPLACE FUNCTION public.log_report_sent_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    INSERT INTO activities (lead_id, type, payload)
    VALUES (
      NEW.lead_id,
      'report_sent',
      jsonb_build_object('report_id', NEW.id, 'first_name', NEW.first_name, 'last_name', NEW.last_name)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_report_generated_log_activity ON numerology_reports;
CREATE TRIGGER on_report_generated_log_activity
  AFTER INSERT ON numerology_reports
  FOR EACH ROW EXECUTE FUNCTION public.log_report_sent_activity();

-- =====================
-- Gap 2: follow-up tasks
-- =====================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  due_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_numerologist ON tasks(numerologist_id);
CREATE INDEX IF NOT EXISTS idx_tasks_lead ON tasks(lead_id);

-- At most one *open* task per deal - re-running create_followup_tasks()
-- never spams duplicate reminders for the same stale deal.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_one_open_per_deal
  ON tasks(deal_id) WHERE completed_at IS NULL;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_select_own_tasks" ON tasks;
CREATE POLICY "numerologist_select_own_tasks" ON tasks FOR SELECT
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(numerologist_id)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "numerologist_update_own_tasks" ON tasks;
CREATE POLICY "numerologist_update_own_tasks" ON tasks FOR UPDATE
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

-- No INSERT policy for the authenticated role: tasks are only ever
-- created by the SECURITY DEFINER function below, called via RPC.

-- Creates (or leaves alone) one open follow-up task for every deal that
-- has sat, untouched, in a non-terminal stage for 7+ days. Called from
-- the client on every dashboard load (see taskService.ts) - no pg_cron
-- dependency, so this works the same on every Supabase plan.
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
  WHERE s.name NOT IN ('Won', 'Lost')
    AND d.updated_at < now() - interval '7 days'
  ON CONFLICT (deal_id) WHERE completed_at IS NULL DO NOTHING;

  GET DIAGNOSTICS created_count = ROW_COUNT;
  RETURN created_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_followup_tasks() TO authenticated;

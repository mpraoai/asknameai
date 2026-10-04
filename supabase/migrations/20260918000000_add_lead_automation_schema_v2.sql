/*
# Lead Management Automation Schema v2 (revised after conflict review)

This is a revised version of an earlier draft. Before writing this, the
existing ops-console schema (added by a separate session) was reviewed for
overlap. Three planned pieces were DROPPED because they duplicated things
that already exist:

  - `leads.pipeline_stage` — dropped. Pipeline stage already lives on the
    `deals` table (`deals.stage_id` -> `crm_stages`), which is already
    per-numerologist with playbooks and win/loss tracking. Adding a second
    stage field on `leads` would create two competing sources of truth.
  - `appointments` table — dropped. Already exists (from
    `20260916130000_add_meetings_and_snippets.sql`), complete with
    numerologist_id, lead_id, scheduled_at, status, availability_slots,
    and a `bookingService.ts` already built on top of it. Use that instead.
  - `follow_up_log` table — dropped. Already covered by the existing
    `tasks` table (auto-generates follow-ups for stalled deals) plus the
    existing `activities` table (logs every call/message/note per lead).

What's kept, and why:
  - `leads.score_numeric` — a second, independent scoring signal. The
    existing `leadScoringAgent.ts` already computes a rule-based hot/warm/
    cold tier client-side. This column holds an AI-generated 0-100 score
    instead. BOTH are kept running side by side on purpose, so their
    usefulness can be compared later — neither overwrites the other.
  - `leads.assigned_to_type` — genuinely new. Nothing polymorphic like this
    exists; the current `assigned_numerologist_id` only points at the
    numerologist business owner, not at a serving-model choice.
  - `lead_outreach_drafts` (renamed from an earlier `outreach_content`) —
    kept, but renamed to avoid confusion with the existing `content_posts`
    table. `content_posts` is for scheduled social media posts; this table
    is for personalized 1:1 outreach drafts tied to one specific lead.
  - `agent_logs` — kept as-is. No general-purpose agent execution log
    existed before this.

Does NOT modify any existing table, column, or row. Purely additive.
*/

-- =====================
-- Extend leads (additive only — existing columns untouched)
-- =====================
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS score_numeric integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_score_numeric_check'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT leads_score_numeric_check CHECK (score_numeric BETWEEN 0 AND 100);
  END IF;
END $$;

COMMENT ON COLUMN leads.score_numeric IS
  'AI-generated 0-100 confidence score from the Triage Agent edge function. '
  'Kept intentionally separate from the existing rule-based lead_score '
  '(hot/warm/cold) so the two can be compared — neither overwrites the other.';

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS assigned_to_type text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_assigned_to_type_check'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT leads_assigned_to_type_check CHECK (
        assigned_to_type IS NULL OR assigned_to_type IN ('product_owner', 'numerologist')
      );
  END IF;
END $$;

-- =====================
-- lead_outreach_drafts table (renamed from outreach_content)
-- =====================
CREATE TABLE IF NOT EXISTS lead_outreach_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'facebook', 'email', 'sms')),
  content_text text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent')),
  generated_by text NOT NULL DEFAULT 'content_agent',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_outreach_drafts_lead ON lead_outreach_drafts(lead_id);

ALTER TABLE lead_outreach_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_or_admin_select_outreach_drafts" ON lead_outreach_drafts;
CREATE POLICY "numerologist_or_admin_select_outreach_drafts" ON lead_outreach_drafts FOR SELECT
  TO authenticated USING (
    lead_id IN (
      SELECT l.id FROM leads l
      JOIN numerologist_profiles np ON np.id = l.assigned_numerologist_id
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- =====================
-- agent_logs table (for reviewing what the AI agents actually did)
-- =====================
CREATE TABLE IF NOT EXISTS agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  input jsonb,
  output jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_lead ON agent_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON agent_logs(agent_name);

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_agent_logs" ON agent_logs;
CREATE POLICY "admin_select_agent_logs" ON agent_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );
/*
# Organic content engine - Part II Phase D2 (start)

Per the PRD (§II.2, §II.10 D2): "AI drafts a week of on-brand post/reel
scripts at a time... a scheduling calendar; auto-publish where the
platform API allows it, manual copy-paste export elsewhere at launch
rather than building a universal social API layer on day one."

No ad-account or social-platform OAuth required for this phase - status
stays at 'draft' / 'scheduled' / 'posted' by the subscriber's own action
(copy-paste to their own account), never auto-published. Auto-publish via
the Meta Graph API is explicitly Phase D3+ territory once the dedicated
backend service exists (§6 Option B / §II.8) to hold OAuth tokens.

Purely additive.
*/

CREATE TABLE IF NOT EXISTS content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'instagram' CHECK (platform IN ('instagram', 'facebook', 'whatsapp_status', 'other')),
  caption text NOT NULL,
  hashtags text,
  scheduled_at date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'skipped')),
  ai_generated boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_posts_numerologist ON content_posts(numerologist_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_scheduled ON content_posts(scheduled_at);

ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_select_own_content" ON content_posts;
CREATE POLICY "numerologist_select_own_content" ON content_posts FOR SELECT
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(numerologist_id)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "numerologist_insert_own_content" ON content_posts;
CREATE POLICY "numerologist_insert_own_content" ON content_posts FOR INSERT
  TO authenticated WITH CHECK (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(numerologist_id)
  );

DROP POLICY IF EXISTS "numerologist_update_own_content" ON content_posts;
CREATE POLICY "numerologist_update_own_content" ON content_posts FOR UPDATE
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

DROP POLICY IF EXISTS "numerologist_delete_own_content" ON content_posts;
CREATE POLICY "numerologist_delete_own_content" ON content_posts FOR DELETE
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(numerologist_id)
  );

/*
# Marketing expenses - for revenue vs. spend tracking

The CRM could already show revenue (Won deal values) but had no way to
record what a subscriber actually spends on marketing (ad boosts,
promotions, etc.) - so there was no way to see earnings against spend,
which is the actual question a subscriber running their practice as a
business needs answered.

This is deliberately a manual ledger, not an ad-platform integration -
that (Phase D3, Meta/Google Ads OAuth) needs a backend service and ad
account credentials that don't exist yet. A numerologist typing "I spent
₹2,000 boosting this Instagram post" is available today and answers the
same question.

Purely additive.
*/

CREATE TABLE IF NOT EXISTS marketing_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  channel text NOT NULL DEFAULT 'other',
  description text,
  spent_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_expenses_numerologist ON marketing_expenses(numerologist_id, spent_on);

ALTER TABLE marketing_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_manage_own_expenses" ON marketing_expenses;
CREATE POLICY "numerologist_manage_own_expenses" ON marketing_expenses FOR ALL
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

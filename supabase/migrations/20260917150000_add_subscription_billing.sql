/*
# Real subscription billing (PRD Section 6 / Build Order Phase B)

The PRD's single most-flagged gap: numerologist_profiles.subscription_status
was only ever a manually-set value (by the numerologist during onboarding,
or an admin toggling it by hand) - nothing here actually charges anyone
monthly or reacts to a real payment event. This adds the real billing
objects, entirely additive and separate from the existing one-time
`razorpay-payment` function/table, which is untouched.

`subscription_plans` - the 3 tiers the PRD names (Starter/Pro/Agency),
seeded with sane defaults the owner can edit later from the DB directly.

`subscriptions` - one row per numerologist's billing relationship with
Razorpay. `razorpay_subscription_id` is what the webhook matches against
to know which row to update.
*/

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  price_monthly_inr integer NOT NULL,
  reports_limit_per_month integer NOT NULL,
  team_size_limit integer NOT NULL,
  razorpay_plan_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

INSERT INTO subscription_plans (name, price_monthly_inr, reports_limit_per_month, team_size_limit)
VALUES
  ('Starter', 99900, 30, 1),
  ('Pro', 249900, 100, 3),
  ('Agency', 599900, 400, 10)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_read_active_plans" ON subscription_plans;
CREATE POLICY "anyone_read_active_plans" ON subscription_plans FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_manage_plans" ON subscription_plans;
CREATE POLICY "admin_manage_plans" ON subscription_plans FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'authenticated', 'active', 'past_due', 'cancelled', 'completed')),
  razorpay_subscription_id text UNIQUE,
  razorpay_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_numerologist ON subscriptions(numerologist_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_id ON subscriptions(razorpay_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_select_own_subscription" ON subscriptions;
CREATE POLICY "numerologist_select_own_subscription" ON subscriptions FOR SELECT
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "numerologist_insert_own_subscription" ON subscriptions;
CREATE POLICY "numerologist_insert_own_subscription" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_select_all_subscriptions" ON subscriptions;
CREATE POLICY "admin_select_all_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- The webhook runs with the service role key (bypasses RLS entirely), so
-- no anon/authenticated UPDATE policy is added here deliberately - a
-- subscription's status should only ever change via a verified Razorpay
-- webhook signature or the service role, never a client-side update.

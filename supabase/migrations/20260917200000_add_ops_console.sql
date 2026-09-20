/*
# Ops Console — Marketing / Sales / Service / Work Centers / Finance

Real backing tables for the product-owner ops console (Marketing, Sales,
Service, Subscribers with modules/contracts/invoices, 5 numerology work
centers, Finance). All additive; no existing table, policy, or the
protected numerology engine is touched.

Module pricing below (Mobile ₹499, Yantra ₹399, Brand ₹599, Domain ₹499,
plan bases in subscription_plans already at ₹999/₹2,499/₹5,999) is
PLACEHOLDER, carried over unchanged from the reference prototype's own
placeholder figures — flagged the same way the prototype flagged them.
Give real numbers and every screen that reads platform_modules updates
in one place, no code change needed.
*/

-- ---------------------------------------------------------------------
-- platform_modules — the 5 work-center modules and their add-on price
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_modules (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  monthly_price_inr integer NOT NULL DEFAULT 0,
  is_core boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

INSERT INTO platform_modules (code, name, description, monthly_price_inr, is_core, sort_order) VALUES
  ('numerology', 'Numerology', 'Core module — included in every plan', 0, true, 1),
  ('mobile', 'Mobile Numerology', 'Analyse a mobile number', 49900, false, 2),
  ('yantra', 'Yantra', 'Personalised yantra recommendations', 39900, false, 3),
  ('brand', 'Brand / Business Name', 'Business & brand name numerology', 59900, false, 4),
  ('domain', 'Domain Correction', 'Domain name numerology & correction', 49900, false, 5)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE platform_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_read_active_modules" ON platform_modules;
CREATE POLICY "anyone_read_active_modules" ON platform_modules FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_manage_modules" ON platform_modules;
CREATE POLICY "admin_manage_modules" ON platform_modules FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- ---------------------------------------------------------------------
-- subscriber_modules — which modules a numerologist has switched on
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriber_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  module_code text NOT NULL REFERENCES platform_modules(code),
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (numerologist_id, module_code)
);

ALTER TABLE subscriber_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_select_own_modules" ON subscriber_modules;
CREATE POLICY "numerologist_select_own_modules" ON subscriber_modules FOR SELECT
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_manage_subscriber_modules" ON subscriber_modules;
CREATE POLICY "admin_manage_subscriber_modules" ON subscriber_modules FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- ---------------------------------------------------------------------
-- contracts
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  modules jsonb NOT NULL DEFAULT '[]',
  monthly_total_inr integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed')),
  sent_at timestamptz,
  signed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_select_own_contracts" ON contracts;
CREATE POLICY "numerologist_select_own_contracts" ON contracts FOR SELECT
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_manage_contracts" ON contracts;
CREATE POLICY "admin_manage_contracts" ON contracts FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- ---------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  line_items jsonb NOT NULL DEFAULT '[]',
  total_inr integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'paid', 'overdue')),
  due_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_select_own_invoices" ON invoices;
CREATE POLICY "numerologist_select_own_invoices" ON invoices FOR SELECT
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_manage_invoices" ON invoices;
CREATE POLICY "admin_manage_invoices" ON invoices FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- ---------------------------------------------------------------------
-- marketing_campaigns — lead-gen channel campaigns (distinct from the
-- existing `campaigns` table, which is customer-facing pricing discounts)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'google_ads', 'referral', 'other')),
  leads_generated integer NOT NULL DEFAULT 0,
  cost_inr integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_marketing_campaigns" ON marketing_campaigns;
CREATE POLICY "admin_manage_marketing_campaigns" ON marketing_campaigns FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- ---------------------------------------------------------------------
-- support_tickets — a subscriber's ticket to the PLATFORM (billing, a
-- module not working, access) - distinct from the existing `tickets`
-- table, which is a numerologist's own follow-up tasks on their leads.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  priority text NOT NULL DEFAULT 'warm' CHECK (priority IN ('hot', 'warm', 'cold')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  sla_due_at timestamptz,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('subscriber', 'admin')),
  sender_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_manage_own_support_tickets" ON support_tickets;
CREATE POLICY "numerologist_manage_own_support_tickets" ON support_tickets FOR ALL
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
  ) WITH CHECK (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_manage_support_tickets" ON support_tickets;
CREATE POLICY "admin_manage_support_tickets" ON support_tickets FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "ticket_parties_read_messages" ON support_ticket_messages;
CREATE POLICY "ticket_parties_read_messages" ON support_ticket_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
    OR ticket_id IN (
      SELECT st.id FROM support_tickets st
      JOIN numerologist_profiles np ON np.id = st.numerologist_id
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ticket_parties_insert_messages" ON support_ticket_messages;
CREATE POLICY "ticket_parties_insert_messages" ON support_ticket_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
    OR ticket_id IN (
      SELECT st.id FROM support_tickets st
      JOIN numerologist_profiles np ON np.id = st.numerologist_id
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- tool_usage_log — lightweight, real usage log for the stateless public
-- calculators (mobile/business/domain), so the work-center "reports this
-- month" figure is a real count instead of invented sample data.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tool_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code text NOT NULL REFERENCES platform_modules(code),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tool_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_tool_usage" ON tool_usage_log;
CREATE POLICY "anon_insert_tool_usage" ON tool_usage_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_tool_usage" ON tool_usage_log;
CREATE POLICY "admin_read_tool_usage" ON tool_usage_log FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- ---------------------------------------------------------------------
-- expense_entries — admin-entered spend, since infra/gateway/AI costs
-- aren't auto-tracked anywhere in this app. Real numbers the owner
-- enters by hand, not invented figures.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('marketing', 'infra_hosting', 'gateway_fees', 'support_tooling', 'ai_api', 'other')),
  amount_inr integer NOT NULL,
  entry_month date NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_expenses" ON expense_entries;
CREATE POLICY "admin_manage_expenses" ON expense_entries FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

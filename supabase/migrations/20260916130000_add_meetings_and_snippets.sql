/*
# Meetings (public booking) + Snippets - HubSpot parity, continued

HubSpot's free CRM is built around a handful of flagship tools beyond the
pipeline itself. This migration adds two of the most recognizable:

1. Meetings - a numerologist sets weekly availability; a public,
   unauthenticated booking page lets a prospect pick an open slot. This
   mirrors HubSpot's "Meetings" tool exactly: one shareable link, no
   back-and-forth over WhatsApp to find a time.

2. Snippets - short reusable text blocks a numerologist can drop into a
   note/call/message log instead of retyping the same thing (HubSpot's
   own tool is literally named "Snippets").

Purely additive.
*/

-- =====================
-- availability: weekly recurring open hours per numerologist
-- =====================
CREATE TABLE IF NOT EXISTS availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_numerologist ON availability_slots(numerologist_id);

ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_manage_own_availability" ON availability_slots;
CREATE POLICY "numerologist_manage_own_availability" ON availability_slots FOR ALL
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

-- Anyone (including anonymous booking-page visitors) can read availability -
-- it's schedule shape only, no personal data, needed to render open slots.
DROP POLICY IF EXISTS "anyone_read_availability" ON availability_slots;
CREATE POLICY "anyone_read_availability" ON availability_slots FOR SELECT
  TO anon, authenticated USING (true);

-- =====================
-- appointments: actual booked meetings
-- =====================
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  name text NOT NULL,
  mobile_number text,
  email text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'completed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_numerologist ON appointments(numerologist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(numerologist_id, scheduled_at);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_select_own_appointments" ON appointments;
CREATE POLICY "numerologist_select_own_appointments" ON appointments FOR SELECT
  TO authenticated USING (
    numerologist_id IN (
      SELECT np.id FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(numerologist_id)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "numerologist_update_own_appointments" ON appointments;
CREATE POLICY "numerologist_update_own_appointments" ON appointments FOR UPDATE
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

-- Anonymous booking-page visitors can read existing appointments for one
-- numerologist (needed to compute which slots are already taken) and
-- insert a new one (the actual booking action).
DROP POLICY IF EXISTS "anon_read_appointments_for_slots" ON appointments;
CREATE POLICY "anon_read_appointments_for_slots" ON appointments FOR SELECT
  TO anon USING (true);

DROP POLICY IF EXISTS "anon_book_appointment" ON appointments;
CREATE POLICY "anon_book_appointment" ON appointments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- =====================
-- Public, minimal numerologist info for the booking page - a narrow
-- SECURITY DEFINER function instead of a broad anon SELECT policy on
-- numerologist_profiles, so subscription/usage fields never leak.
-- =====================
CREATE OR REPLACE FUNCTION public.get_public_numerologist_info(target_id uuid)
RETURNS TABLE (id uuid, business_name text, brand_color text, logo_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id, business_name, brand_color, logo_url
  FROM numerologist_profiles
  WHERE id = target_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_numerologist_info(uuid) TO anon, authenticated;

-- =====================
-- snippets: reusable text blocks for quick note/call/message logging
-- =====================
CREATE TABLE IF NOT EXISTS snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snippets_numerologist ON snippets(numerologist_id);

ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_manage_own_snippets" ON snippets;
CREATE POLICY "numerologist_manage_own_snippets" ON snippets FOR ALL
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

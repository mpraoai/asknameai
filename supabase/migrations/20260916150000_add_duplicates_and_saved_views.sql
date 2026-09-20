/*
# Manage Duplicates + Saved Views (Lists) - HubSpot parity, round 4

Two more of HubSpot's named CRM tools:

1. "Manage duplicates" - years of Excel imports and repeat walk-ins mean
   the same person often ends up as two lead rows. merge_leads() folds a
   duplicate's activity/report/tag history into the record being kept,
   then removes the duplicate - existing FKs (CASCADE on lead_id for
   deals/activities/tasks, SET NULL for appointments) do the rest.

2. "Lists" - a named, reusable filter combination (channel/score/status/
   tag) a numerologist can save once and reapply instead of rebuilding
   the same filter every visit.

Purely additive.
*/

-- =====================
-- merge_leads: fold a duplicate lead into the one being kept
-- =====================
CREATE OR REPLACE FUNCTION public.merge_leads(primary_id uuid, duplicate_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  primary_owner uuid;
  duplicate_owner uuid;
  caller_authorized boolean;
  dup_first_name text;
  dup_mobile text;
BEGIN
  IF primary_id = duplicate_id THEN
    RAISE EXCEPTION 'Cannot merge a lead into itself';
  END IF;

  SELECT assigned_numerologist_id INTO primary_owner FROM leads WHERE id = primary_id;
  SELECT assigned_numerologist_id, first_name, mobile_number
    INTO duplicate_owner, dup_first_name, dup_mobile
    FROM leads WHERE id = duplicate_id;

  IF primary_owner IS NULL OR duplicate_owner IS NULL OR primary_owner != duplicate_owner THEN
    RAISE EXCEPTION 'Both leads must belong to the same numerologist';
  END IF;

  -- Caller must own this numerologist account, be an active staff member, or be an admin.
  SELECT
    EXISTS (
      SELECT 1 FROM numerologist_profiles np
      JOIN user_profiles up ON up.id = np.user_profile_id
      WHERE np.id = primary_owner AND up.auth_user_id = auth.uid()
    )
    OR public.is_active_team_member(primary_owner)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  INTO caller_authorized;

  IF NOT caller_authorized THEN
    RAISE EXCEPTION 'Not authorized to merge these leads';
  END IF;

  UPDATE activities SET lead_id = primary_id WHERE lead_id = duplicate_id;
  UPDATE numerology_reports SET lead_id = primary_id WHERE lead_id = duplicate_id;

  UPDATE leads SET tags = (
    SELECT ARRAY(SELECT DISTINCT unnest(leads.tags || COALESCE((SELECT tags FROM leads WHERE id = duplicate_id), '{}')))
  )
  WHERE id = primary_id;

  INSERT INTO activities (lead_id, type, payload)
  VALUES (primary_id, 'note', jsonb_build_object('note', 'Merged duplicate record: ' || COALESCE(dup_first_name, 'Unknown') || ' (' || COALESCE(dup_mobile, 'no number') || ')'));

  DELETE FROM leads WHERE id = duplicate_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_leads(uuid, uuid) TO authenticated;

-- =====================
-- saved_views: HubSpot-style "Lists" - a named, reusable filter combo
-- =====================
CREATE TABLE IF NOT EXISTS saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numerologist_id uuid NOT NULL REFERENCES numerologist_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_views_numerologist ON saved_views(numerologist_id);

ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numerologist_manage_own_saved_views" ON saved_views;
CREATE POLICY "numerologist_manage_own_saved_views" ON saved_views FOR ALL
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

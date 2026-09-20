/*
# Auto-assign new leads to a numerologist

1. Purpose
   - Right now leads.assigned_numerologist_id is never set anywhere, so leads
     never show up on any numerologist's dashboard.
   - This adds a BEFORE INSERT trigger on leads that assigns each new,
     unassigned lead to the least-loaded active/trial numerologist
     (round-robin by current lead count, then by join date as tiebreaker).
   - If the caller already set assigned_numerologist_id explicitly, or if no
     numerologist exists yet, the lead is left as-is (no numerologist ->
     stays unassigned, visible only to admins).

2. Security
   - SECURITY DEFINER: needed because anon visitors can INSERT leads (per the
     existing anon_insert_lead policy) but cannot SELECT numerologist_profiles
     under RLS. The function bypasses RLS only for this internal lookup.
*/

CREATE OR REPLACE FUNCTION public.assign_lead_to_numerologist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  IF NEW.assigned_numerologist_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT np.id INTO target_id
  FROM numerologist_profiles np
  LEFT JOIN leads l ON l.assigned_numerologist_id = np.id
  WHERE np.subscription_status IN ('trial', 'active')
  GROUP BY np.id, np.created_at
  ORDER BY COUNT(l.id) ASC, np.created_at ASC
  LIMIT 1;

  NEW.assigned_numerologist_id := target_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_lead_created_assign ON leads;
CREATE TRIGGER on_lead_created_assign
  BEFORE INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION public.assign_lead_to_numerologist();

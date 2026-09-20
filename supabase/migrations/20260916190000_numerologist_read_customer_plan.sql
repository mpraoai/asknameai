/*
# Let a numerologist see which plan their assigned lead actually purchased

The numerology tools now run inside the numerologist's own workspace
(Numerology section) so they can generate a result for a specific lead.
To know *what to deliver*, they need to see which paid plan that person
selected on the main site - but `payments` had only ever granted a
customer access to their own row, so an assigned numerologist had no
legitimate way to see it.

This is purely additive: one new SELECT policy, matched narrowly by the
lead's own mobile number or email against the purchasing customer's
account, scoped to only leads actually assigned to that numerologist (or
their active staff). Every existing policy on `payments` - including the
INSERT/UPDATE/DELETE ones the razorpay-payment function relies on - is
untouched.
*/

DROP POLICY IF EXISTS "numerologist_select_assigned_lead_payments" ON payments;
CREATE POLICY "numerologist_select_assigned_lead_payments" ON payments FOR SELECT
  TO authenticated USING (
    user_id IN (
      SELECT up.auth_user_id FROM user_profiles up
      WHERE up.auth_user_id IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM leads l
            WHERE l.mobile_number IS NOT NULL
              AND l.mobile_number = up.mobile_number
              AND (
                l.assigned_numerologist_id IN (
                  SELECT np.id FROM numerologist_profiles np
                  JOIN user_profiles me ON me.id = np.user_profile_id
                  WHERE me.auth_user_id = auth.uid()
                )
                OR public.is_active_team_member(l.assigned_numerologist_id)
              )
          )
          OR EXISTS (
            SELECT 1 FROM leads l
            WHERE l.email IS NOT NULL
              AND l.email = up.email
              AND (
                l.assigned_numerologist_id IN (
                  SELECT np.id FROM numerologist_profiles np
                  JOIN user_profiles me ON me.id = np.user_profile_id
                  WHERE me.auth_user_id = auth.uid()
                )
                OR public.is_active_team_member(l.assigned_numerologist_id)
              )
          )
        )
    )
  );

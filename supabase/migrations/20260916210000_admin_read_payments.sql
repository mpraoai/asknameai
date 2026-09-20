/*
# Let the product owner see payments platform-wide

The Customers section of the admin dashboard needs to show which plan a
direct customer purchased - but `payments` never had an admin bypass at
all (only the paying customer's own `auth.uid() = user_id` could read
their own row). Purely additive: one more SELECT policy, admin-only,
read-only. Every existing policy (including the ones razorpay-payment
depends on for insert/update) is untouched.
*/

DROP POLICY IF EXISTS "admin_select_all_payments" ON payments;
CREATE POLICY "admin_select_all_payments" ON payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

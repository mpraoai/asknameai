/*
# Create payments table for Razorpay transactions

1. New Tables
- `payments`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users, owner of the payment)
  - `razorpay_order_id` (text, unique - order ID from Razorpay)
  - `razorpay_payment_id` (text, nullable - payment ID after successful payment)
  - `razorpay_signature` (text, nullable - signature for verification)
  - `plan_id` (uuid, references pricing_plans)
  - `plan_name` (text, name of the plan at time of purchase)
  - `amount` (integer, amount in paise)
  - `currency` (text, default 'INR')
  - `status` (text, default 'created' - created/paid/failed)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `payments`.
- Owner-scoped CRUD: authenticated users can only access their own payment records.
- `user_id` defaults to `auth.uid()` so inserts from the client work without explicitly passing it.
- Added index on `user_id` for query performance.
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text,
  razorpay_signature text,
  plan_id uuid,
  plan_name text NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_payments" ON payments;
CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_payments" ON payments;
CREATE POLICY "update_own_payments" ON payments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_payments" ON payments;
CREATE POLICY "delete_own_payments" ON payments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

/*
# Create purchases table for AskNameAI

1. New Tables
- `purchases`
  - `id` (uuid, primary key)
  - `first_name` (text, not null) - user's first name
  - `last_name` (text, not null) - user's last name
  - `dob` (text, not null) - date of birth
  - `gender` (text, not null) - male/female/other
  - `driver` (integer, not null) - numerology driver number
  - `conductor` (integer, not null) - numerology conductor number
  - `plan` (text, not null) - plan id (basic/premium/ultimate)
  - `amount` (integer, not null) - price in paise
  - `status` (text, not null, default 'pending') - pending/completed/failed
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `purchases`.
- Allow anon + authenticated CRUD since this is a no-auth app where anyone can check names and purchase plans.
*/

CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  dob text NOT NULL,
  gender text NOT NULL,
  driver integer NOT NULL,
  conductor integer NOT NULL,
  plan text NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_purchases" ON purchases;
CREATE POLICY "anon_select_purchases" ON purchases FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_purchases" ON purchases;
CREATE POLICY "anon_insert_purchases" ON purchases FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_purchases" ON purchases;
CREATE POLICY "anon_update_purchases" ON purchases FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_purchases" ON purchases;
CREATE POLICY "anon_delete_purchases" ON purchases FOR DELETE
  TO anon, authenticated USING (true);

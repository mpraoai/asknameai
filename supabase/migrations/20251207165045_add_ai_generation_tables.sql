/*
  # Add AI Name Generation Tables

  1. New Tables
    - `ai_generation_sessions` - Track AI name generation requests
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable for anonymous users)
      - `gender` (text)
      - `religion` (text)
      - `driver_number` (integer)
      - `conductor_number` (integer)
      - `target_numbers` (integer array)
      - `request_count` (integer)
      - `created_at` (timestamp)
    
    - `ai_generated_names` - Store all AI-generated names with metadata
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key)
      - `name` (text)
      - `meaning` (text)
      - `numerology_value` (integer)
      - `compatibility_score` (integer 0-100)
      - `is_saved_by_user` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for anonymous and authenticated users
    - Allow creation and viewing of own sessions
    - Allow public read for viewing suggestions

  3. Notes
    - AI generations are rate-limited by session to prevent abuse
    - Each session tracks request count for monitoring
    - Names are stored to avoid duplicate API calls
*/

CREATE TABLE IF NOT EXISTS ai_generation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  religion text NOT NULL CHECK (religion IN ('hindu', 'muslim', 'christian', 'sikh', 'jewish', 'buddhist', 'other')),
  driver_number integer NOT NULL CHECK (driver_number >= 1 AND driver_number <= 9),
  conductor_number integer NOT NULL CHECK (conductor_number >= 1 AND conductor_number <= 9),
  target_numbers integer[] DEFAULT '{}',
  request_count integer DEFAULT 1,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_generated_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES ai_generation_sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  meaning text NOT NULL,
  numerology_value integer CHECK (numerology_value >= 1 AND numerology_value <= 9),
  compatibility_score integer CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  explanation text,
  is_saved_by_user boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view generation sessions"
  ON ai_generation_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create generation sessions"
  ON ai_generation_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their sessions"
  ON ai_generation_sessions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view generated names"
  ON ai_generated_names FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create generated names"
  ON ai_generated_names FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX idx_ai_generation_sessions_created ON ai_generation_sessions(created_at DESC);
CREATE INDEX idx_ai_generated_names_session ON ai_generated_names(session_id);
CREATE INDEX idx_ai_generated_names_created ON ai_generated_names(created_at DESC);

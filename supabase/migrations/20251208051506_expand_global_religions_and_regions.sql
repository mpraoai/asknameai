/*
  # Expand Global Religion and Region Support
  
  ## Overview
  Enhances the baby_names table to support worldwide religions and regions
  while preserving existing Chaldean numerology logic as the foundation.
  
  ## Changes Made
  
  1. **Expanded Religion Support**
     - Added support for: Buddhist, Jewish, Jain, Parsi, Bahai, Zoroastrian
     - Added: African Traditional, Native American, Chinese, Japanese, Korean
     - Keeps existing: Hindu, Muslim, Christian, Sikh
  
  2. **Enhanced Regional Coverage**
     - Added regions: East Asia, Southeast Asia, Middle East, Africa
     - Added: Europe, North America, South America, Oceania
     - Maintains existing regional data
  
  3. **New External Sources Table**
     - Tracks third-party API sources
     - Stores API keys and rate limits
     - Enables multi-source aggregation
  
  4. **Name Enrichment Data**
     - External links (etymology, cultural significance)
     - Popularity rankings from multiple sources
     - Celebrity/historical associations
     - Preserves existing numerology as primary validator
  
  ## Important Notes
  - **NO CHANGES to existing numerology logic**
  - Existing baby_names data remains untouched
  - New columns are optional (nullable)
  - External data enriches but doesn't override numerology validation
  - RLS policies maintain data security
*/

-- Add new columns to baby_names for global expansion (all nullable to preserve existing data)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'baby_names' AND column_name = 'language_family'
  ) THEN
    ALTER TABLE baby_names ADD COLUMN language_family text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'baby_names' AND column_name = 'phonetic_spelling'
  ) THEN
    ALTER TABLE baby_names ADD COLUMN phonetic_spelling text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'baby_names' AND column_name = 'celebrity_associations'
  ) THEN
    ALTER TABLE baby_names ADD COLUMN celebrity_associations text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'baby_names' AND column_name = 'external_links'
  ) THEN
    ALTER TABLE baby_names ADD COLUMN external_links jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'baby_names' AND column_name = 'global_popularity_rank'
  ) THEN
    ALTER TABLE baby_names ADD COLUMN global_popularity_rank integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'baby_names' AND column_name = 'regional_popularity_rank'
  ) THEN
    ALTER TABLE baby_names ADD COLUMN regional_popularity_rank integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'baby_names' AND column_name = 'last_enriched_at'
  ) THEN
    ALTER TABLE baby_names ADD COLUMN last_enriched_at timestamptz;
  END IF;
END $$;

-- Create external_name_sources table to track third-party integrations
CREATE TABLE IF NOT EXISTS external_name_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text UNIQUE NOT NULL,
  source_type text NOT NULL,
  api_endpoint text,
  is_active boolean DEFAULT true,
  rate_limit_per_day integer DEFAULT 1000,
  requests_today integer DEFAULT 0,
  last_request_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE external_name_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "External sources are publicly readable"
  ON external_name_sources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only service role can manage external sources"
  ON external_name_sources FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create name_enrichment_logs to track external data integration
CREATE TABLE IF NOT EXISTS name_enrichment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_name_id uuid REFERENCES baby_names(id) ON DELETE CASCADE,
  source_id uuid REFERENCES external_name_sources(id) ON DELETE SET NULL,
  enrichment_type text NOT NULL,
  data_added jsonb DEFAULT '{}'::jsonb,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE name_enrichment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrichment logs are readable by authenticated users"
  ON name_enrichment_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only service role can write enrichment logs"
  ON name_enrichment_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create global_religion_mappings for comprehensive religion support
CREATE TABLE IF NOT EXISTS global_religion_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  religion_code text UNIQUE NOT NULL,
  religion_name text NOT NULL,
  religion_family text NOT NULL,
  primary_regions text[] DEFAULT ARRAY[]::text[],
  supported boolean DEFAULT true,
  traditional_scripts text[] DEFAULT ARRAY[]::text[],
  naming_traditions_description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE global_religion_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Religion mappings are publicly readable"
  ON global_religion_mappings FOR SELECT
  TO authenticated
  USING (true);

-- Insert comprehensive religion data
INSERT INTO global_religion_mappings (religion_code, religion_name, religion_family, primary_regions, traditional_scripts, naming_traditions_description)
VALUES
  ('hindu', 'Hinduism', 'Dharmic', ARRAY['South Asia', 'Southeast Asia'], ARRAY['Devanagari', 'Tamil', 'Telugu'], 'Names often derived from Sanskrit, reflecting deities, virtues, and nature'),
  ('muslim', 'Islam', 'Abrahamic', ARRAY['Middle East', 'South Asia', 'Africa', 'Southeast Asia'], ARRAY['Arabic', 'Urdu', 'Persian'], 'Names from Quran, prophets, and Arabic meanings'),
  ('christian', 'Christianity', 'Abrahamic', ARRAY['Europe', 'Americas', 'Africa', 'Oceania'], ARRAY['Latin', 'Greek', 'Hebrew'], 'Biblical names, saints, and European traditions'),
  ('sikh', 'Sikhism', 'Dharmic', ARRAY['South Asia'], ARRAY['Gurmukhi'], 'Names from Guru Granth Sahib, reflecting spiritual qualities'),
  ('buddhist', 'Buddhism', 'Dharmic', ARRAY['East Asia', 'Southeast Asia', 'South Asia'], ARRAY['Pali', 'Sanskrit', 'Tibetan', 'Chinese', 'Japanese'], 'Names reflecting enlightenment, peace, and Buddhist virtues'),
  ('jewish', 'Judaism', 'Abrahamic', ARRAY['Middle East', 'Europe', 'Americas'], ARRAY['Hebrew', 'Yiddish'], 'Hebrew names from Torah, biblical figures, and Jewish tradition'),
  ('jain', 'Jainism', 'Dharmic', ARRAY['South Asia'], ARRAY['Devanagari', 'Gujarati'], 'Names reflecting non-violence, spiritual liberation, and Tirthankaras'),
  ('parsi', 'Zoroastrianism', 'Iranian', ARRAY['South Asia', 'Middle East'], ARRAY['Avestan', 'Persian'], 'Ancient Persian names, Avestan religious terms'),
  ('bahai', 'Bahai Faith', 'Abrahamic', ARRAY['Middle East', 'Global'], ARRAY['Persian', 'Arabic'], 'Names reflecting unity, peace, and divine attributes'),
  ('african_traditional', 'African Traditional', 'Indigenous', ARRAY['Africa'], ARRAY['Various African'], 'Names reflecting circumstances of birth, family history, aspirations'),
  ('chinese', 'Chinese Traditional', 'East Asian', ARRAY['East Asia'], ARRAY['Chinese'], 'Names with auspicious meanings, family generation names'),
  ('japanese', 'Japanese', 'East Asian', ARRAY['East Asia'], ARRAY['Kanji', 'Hiragana'], 'Names combining kanji characters with beautiful meanings'),
  ('korean', 'Korean', 'East Asian', ARRAY['East Asia'], ARRAY['Hangul', 'Hanja'], 'Names with Sino-Korean roots and generational syllables'),
  ('native_american', 'Native American', 'Indigenous', ARRAY['Americas'], ARRAY['Various Indigenous'], 'Names from nature, virtues, and tribal traditions'),
  ('secular', 'Secular/Non-religious', 'Universal', ARRAY['Global'], ARRAY['Various'], 'Modern names without specific religious association')
ON CONFLICT (religion_code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_baby_names_language_family ON baby_names(language_family);
CREATE INDEX IF NOT EXISTS idx_baby_names_global_popularity ON baby_names(global_popularity_rank) WHERE global_popularity_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_baby_names_last_enriched ON baby_names(last_enriched_at) WHERE last_enriched_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_baby_name ON name_enrichment_logs(baby_name_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_source ON name_enrichment_logs(source_id);

-- Insert initial external sources (placeholders for future API integrations)
INSERT INTO external_name_sources (source_name, source_type, api_endpoint, metadata)
VALUES
  ('Behind the Name', 'etymology', 'https://www.behindthename.com/api/', '{"description": "Comprehensive etymology and name history database", "coverage": "Global"}'),
  ('Namey', 'popularity', 'https://namey.muffinlabs.com/api/', '{"description": "US census name popularity data", "coverage": "United States"}'),
  ('Sanskrit Dictionary', 'meaning', null, '{"description": "Sanskrit name meanings and origins", "coverage": "Indian/Hindu"}'),
  ('Arabic Names API', 'meaning', null, '{"description": "Arabic and Islamic name database", "coverage": "Islamic"}'),
  ('Chinese Name Database', 'meaning', null, '{"description": "Chinese names with character meanings", "coverage": "Chinese"}')
ON CONFLICT (source_name) DO NOTHING;

COMMENT ON TABLE global_religion_mappings IS 'Comprehensive mapping of world religions supported by ASKNAMEAI';
COMMENT ON TABLE external_name_sources IS 'Third-party APIs and data sources for name enrichment';
COMMENT ON TABLE name_enrichment_logs IS 'Audit trail for external data integration';
COMMENT ON COLUMN baby_names.external_links IS 'JSON array of external reference links: [{url, title, type}]';
COMMENT ON COLUMN baby_names.celebrity_associations IS 'Array of notable people with this name';

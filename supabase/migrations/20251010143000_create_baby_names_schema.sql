/*
  # Create Baby Names Database Schema

  ## Overview
  This migration creates a comprehensive baby names database with support for:
  - Regional languages (Telugu, Tamil, Malayalam, Marathi, Gujarati, Bengali, Punjabi, Kannada, etc.)
  - Religious scriptures (Ramayana, Mahabharata, Vishnu Sahasranama, Quran, Bible, Guru Granth Sahib)
  - Multiple script support (Latin, Devanagari, Regional scripts)
  - Numerology integration
  - Name variations and spellings

  ## Tables Created

  ### 1. baby_names
  Main table storing all baby name information with:
  - Basic info: name, gender, religion
  - Regional data: region, language origin, regional script
  - Scripture attribution: source type, scripture, deity association
  - Meanings: basic meaning, detailed meaning, etymology
  - Numerology: calculated value
  - Metadata: popularity, verification status, generation source

  ### 2. name_variations
  Stores alternative spellings and script variations:
  - Links to parent name
  - Different scripts (Latin, Devanagari, Tamil, Telugu, etc.)
  - Primary variation indicator

  ### 3. scripture_sources
  Reference table for religious scriptures and texts

  ### 4. regional_languages
  Reference table for Indian languages and regions

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public read access for names (for suggestions)
  - Authenticated write access only (for future admin panel)

  ## Notes
  - Names are initially seeded with existing static data
  - Future migrations will add more scriptural and regional names
  - AI generation capability will be added via Edge Functions
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- REFERENCE TABLES
-- ============================================================================

-- Scripture sources reference table
CREATE TABLE IF NOT EXISTS scripture_sources (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  religion text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Regional languages reference table
CREATE TABLE IF NOT EXISTS regional_languages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  region text NOT NULL,
  script text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- MAIN BABY NAMES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS baby_names (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  name text NOT NULL,
  name_devanagari text,
  name_regional text,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'unisex')),
  religion text NOT NULL,
  
  -- Regional Classification
  region text,
  language_origin text,
  
  -- Scriptural/Source Attribution
  source_type text CHECK (source_type IN ('vedic', 'puranic', 'contemporary', 'regional', 'scriptural')),
  source_scripture text,
  deity_association text,
  
  -- Meaning and Context
  meaning text NOT NULL,
  detailed_meaning text,
  etymology text,
  
  -- Numerology
  numerology_value integer CHECK (numerology_value BETWEEN 1 AND 9),
  
  -- Metadata
  popularity_score integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  generation_source text DEFAULT 'manual' CHECK (generation_source IN ('manual', 'curated', 'ai_generated', 'seed')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Indexes for fast querying
  CONSTRAINT valid_religion CHECK (religion IN ('hindu', 'muslim', 'christian', 'sikh', 'other'))
);

-- ============================================================================
-- NAME VARIATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS name_variations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_id uuid REFERENCES baby_names(id) ON DELETE CASCADE,
  variation text NOT NULL,
  script text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(name_id, variation)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary query indexes
CREATE INDEX IF NOT EXISTS idx_baby_names_religion_gender ON baby_names(religion, gender);
CREATE INDEX IF NOT EXISTS idx_baby_names_numerology ON baby_names(numerology_value);
CREATE INDEX IF NOT EXISTS idx_baby_names_region ON baby_names(region);
CREATE INDEX IF NOT EXISTS idx_baby_names_source ON baby_names(source_scripture);
CREATE INDEX IF NOT EXISTS idx_baby_names_name_search ON baby_names USING gin(to_tsvector('english', name));

-- Variation lookup
CREATE INDEX IF NOT EXISTS idx_name_variations_name_id ON name_variations(name_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE baby_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE name_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_languages ENABLE ROW LEVEL SECURITY;

-- Public read access for name suggestions (anyone can view names)
CREATE POLICY "Public can view baby names"
  ON baby_names FOR SELECT
  USING (true);

CREATE POLICY "Public can view name variations"
  ON name_variations FOR SELECT
  USING (true);

CREATE POLICY "Public can view scripture sources"
  ON scripture_sources FOR SELECT
  USING (true);

CREATE POLICY "Public can view regional languages"
  ON regional_languages FOR SELECT
  USING (true);

-- Authenticated users can insert names (for future admin panel)
CREATE POLICY "Authenticated users can insert names"
  ON baby_names FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update names"
  ON baby_names FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete names"
  ON baby_names FOR DELETE
  TO authenticated
  USING (true);

-- Similar policies for variations
CREATE POLICY "Authenticated users can insert variations"
  ON name_variations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update variations"
  ON name_variations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete variations"
  ON name_variations FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- SEED REFERENCE DATA
-- ============================================================================

-- Insert scripture sources
INSERT INTO scripture_sources (name, religion, description) VALUES
  ('Ramayana', 'hindu', 'Ancient Indian epic poem'),
  ('Mahabharata', 'hindu', 'Ancient Indian epic poem'),
  ('Vishnu Sahasranama', 'hindu', '1000 names of Lord Vishnu'),
  ('Lalitha Sahasranama', 'hindu', '1000 names of Goddess Lalitha'),
  ('Vedas', 'hindu', 'Ancient Hindu scriptures'),
  ('Puranas', 'hindu', 'Hindu religious texts'),
  ('Quran', 'muslim', 'Islamic holy book'),
  ('Hadith', 'muslim', 'Prophet Muhammad teachings'),
  ('Bible', 'christian', 'Christian holy book'),
  ('Guru Granth Sahib', 'sikh', 'Sikh holy scripture')
ON CONFLICT (name) DO NOTHING;

-- Insert regional languages
INSERT INTO regional_languages (name, code, region, script) VALUES
  ('Telugu', 'te', 'Andhra Pradesh, Telangana', 'Telugu'),
  ('Tamil', 'ta', 'Tamil Nadu', 'Tamil'),
  ('Malayalam', 'ml', 'Kerala', 'Malayalam'),
  ('Marathi', 'mr', 'Maharashtra', 'Devanagari'),
  ('Gujarati', 'gu', 'Gujarat', 'Gujarati'),
  ('Bengali', 'bn', 'West Bengal', 'Bengali'),
  ('Punjabi', 'pa', 'Punjab', 'Gurmukhi'),
  ('Kannada', 'kn', 'Karnataka', 'Kannada'),
  ('Odia', 'or', 'Odisha', 'Odia'),
  ('Assamese', 'as', 'Assam', 'Bengali')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_baby_names_updated_at
  BEFORE UPDATE ON baby_names
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

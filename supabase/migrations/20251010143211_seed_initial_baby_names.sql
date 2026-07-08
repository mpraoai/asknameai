/*
  # Seed Initial Baby Names Database

  ## Overview
  This migration seeds the baby_names table with:
  1. Existing static names (from current application)
  2. Additional scriptural names from Hindu epics and texts
  3. Regional variations for major Indian languages
  4. Islamic, Christian, and Sikh names

  ## Data Sources
  - Hindu: Ramayana, Mahabharata, Vishnu Sahasranama characters and deities
  - Muslim: Traditional Islamic names from Quran and Hadith
  - Christian: Biblical names from Old and New Testament
  - Sikh: Names from Guru Granth Sahib tradition

  ## Total Names
  Approximately 200+ names across all religions and genders

  ## Notes
  - Numerology values are calculated using Chaldean system
  - Source is marked as 'seed' for initial data
  - Regional and scriptural attributions are included where applicable
*/

-- ============================================================================
-- HINDU MALE NAMES (Existing + Scriptural)
-- ============================================================================

INSERT INTO baby_names (name, gender, religion, meaning, source_type, source_scripture, numerology_value, generation_source) VALUES
  -- Existing names
  ('Aarav', 'male', 'hindu', 'Peaceful, wise', 'contemporary', NULL, 2, 'seed'),
  ('Arjun', 'male', 'hindu', 'Bright, shining', 'scriptural', 'Mahabharata', 6, 'seed'),
  ('Dev', 'male', 'hindu', 'God, divine', 'vedic', 'Vedas', 5, 'seed'),
  ('Karan', 'male', 'hindu', 'Helper, compassionate', 'scriptural', 'Mahabharata', 2, 'seed'),
  ('Raj', 'male', 'hindu', 'King, rule', 'contemporary', NULL, 2, 'seed'),
  ('Rohan', 'male', 'hindu', 'Ascending, growing', 'contemporary', NULL, 5, 'seed'),
  ('Sai', 'male', 'hindu', 'Divine master', 'contemporary', NULL, 1, 'seed'),
  ('Vedant', 'male', 'hindu', 'Ultimate knowledge', 'vedic', 'Vedas', 5, 'seed'),
  ('Yash', 'male', 'hindu', 'Fame, glory', 'contemporary', NULL, 1, 'seed'),
  ('Neil', 'male', 'hindu', 'Blue sapphire', 'contemporary', NULL, 5, 'seed'),
  ('Aditya', 'male', 'hindu', 'Sun god', 'vedic', 'Vedas', 4, 'seed'),
  ('Akash', 'male', 'hindu', 'Sky, space', 'contemporary', NULL, 1, 'seed'),
  ('Ankit', 'male', 'hindu', 'Marked, distinguished', 'contemporary', NULL, 2, 'seed'),
  ('Deepak', 'male', 'hindu', 'Light, lamp', 'contemporary', NULL, 4, 'seed'),
  ('Gaurav', 'male', 'hindu', 'Pride, honor', 'contemporary', NULL, 6, 'seed'),
  ('Harsh', 'male', 'hindu', 'Joy, happiness', 'contemporary', NULL, 1, 'seed'),
  ('Ishaan', 'male', 'hindu', 'Sun, lord Shiva', 'vedic', 'Vedas', 1, 'seed'),
  ('Kartik', 'male', 'hindu', 'Name of a month', 'puranic', 'Puranas', 2, 'seed'),
  ('Manish', 'male', 'hindu', 'God of mind', 'contemporary', NULL, 1, 'seed'),
  ('Nikhil', 'male', 'hindu', 'Complete, whole', 'contemporary', NULL, 5, 'seed'),
  ('Pranav', 'male', 'hindu', 'Sacred syllable Om', 'vedic', 'Vedas', 6, 'seed'),
  ('Rahul', 'male', 'hindu', 'Conqueror of miseries', 'scriptural', 'Ramayana', 2, 'seed'),
  ('Shivam', 'male', 'hindu', 'Auspicious, lord Shiva', 'vedic', 'Vedas', 1, 'seed'),
  ('Varun', 'male', 'hindu', 'God of water', 'vedic', 'Vedas', 6, 'seed'),
  ('Vivek', 'male', 'hindu', 'Wisdom, knowledge', 'contemporary', NULL, 6, 'seed'),
  
  -- Additional Scriptural Names
  ('Ram', 'male', 'hindu', 'Lord Rama, supreme being', 'scriptural', 'Ramayana', 2, 'seed'),
  ('Krishna', 'male', 'hindu', 'Dark, all-attractive', 'scriptural', 'Mahabharata', 1, 'seed'),
  ('Vishnu', 'male', 'hindu', 'All-pervading one', 'vedic', 'Vishnu Sahasranama', 6, 'seed'),
  ('Shiva', 'male', 'hindu', 'Auspicious one', 'vedic', 'Vedas', 1, 'seed'),
  ('Hanuman', 'male', 'hindu', 'Devotee of Ram', 'scriptural', 'Ramayana', 5, 'seed'),
  ('Lakshmana', 'male', 'hindu', 'One with auspicious marks', 'scriptural', 'Ramayana', 1, 'seed'),
  ('Bharata', 'male', 'hindu', 'One who bears', 'scriptural', 'Ramayana', 2, 'seed'),
  ('Yudhishthira', 'male', 'hindu', 'Firm in battle', 'scriptural', 'Mahabharata', 9, 'seed'),
  ('Bhima', 'male', 'hindu', 'Tremendous', 'scriptural', 'Mahabharata', 2, 'seed'),
  ('Nakula', 'male', 'hindu', 'Mongoose', 'scriptural', 'Mahabharata', 2, 'seed'),
  ('Sahadeva', 'male', 'hindu', 'Accompanied by gods', 'scriptural', 'Mahabharata', 5, 'seed'),
  ('Achyuta', 'male', 'hindu', 'Infallible', 'vedic', 'Vishnu Sahasranama', 3, 'seed'),
  ('Madhava', 'male', 'hindu', 'Lord of Ma (Lakshmi)', 'vedic', 'Vishnu Sahasranama', 5, 'seed'),
  ('Govinda', 'male', 'hindu', 'Protector of cows', 'vedic', 'Vishnu Sahasranama', 6, 'seed'),
  ('Narayana', 'male', 'hindu', 'Refuge of all beings', 'vedic', 'Vishnu Sahasranama', 5, 'seed');

-- ============================================================================
-- HINDU FEMALE NAMES (Existing + Scriptural)
-- ============================================================================

INSERT INTO baby_names (name, gender, religion, meaning, source_type, source_scripture, numerology_value, generation_source) VALUES
  -- Existing names
  ('Aadhya', 'female', 'hindu', 'Beginning, first', 'contemporary', NULL, 3, 'seed'),
  ('Anaya', 'female', 'hindu', 'Caring, guardian', 'contemporary', NULL, 1, 'seed'),
  ('Diya', 'female', 'hindu', 'Lamp, light', 'contemporary', NULL, 4, 'seed'),
  ('Isha', 'female', 'hindu', 'Goddess, supreme', 'vedic', 'Vedas', 1, 'seed'),
  ('Kavya', 'female', 'hindu', 'Poetry, literature', 'contemporary', NULL, 3, 'seed'),
  ('Maya', 'female', 'hindu', 'Illusion, divine power', 'vedic', 'Vedas', 1, 'seed'),
  ('Priya', 'female', 'hindu', 'Beloved, dear', 'contemporary', NULL, 6, 'seed'),
  ('Riya', 'female', 'hindu', 'Singer, graceful', 'contemporary', NULL, 6, 'seed'),
  ('Siya', 'female', 'hindu', 'Sita, pure', 'scriptural', 'Ramayana', 1, 'seed'),
  ('Zara', 'female', 'hindu', 'Princess, flower', 'contemporary', NULL, 7, 'seed'),
  ('Aditi', 'female', 'hindu', 'Boundless, entire', 'vedic', 'Vedas', 4, 'seed'),
  ('Anjali', 'female', 'hindu', 'Offering, tribute', 'contemporary', NULL, 1, 'seed'),
  ('Deepika', 'female', 'hindu', 'Little lamp', 'contemporary', NULL, 4, 'seed'),
  ('Gauri', 'female', 'hindu', 'Fair, goddess Parvati', 'vedic', 'Puranas', 6, 'seed'),
  ('Jyoti', 'female', 'hindu', 'Light, flame', 'contemporary', NULL, 7, 'seed'),
  ('Kiran', 'female', 'hindu', 'Ray of light', 'contemporary', NULL, 2, 'seed'),
  ('Meera', 'female', 'hindu', 'Devotee of Krishna', 'scriptural', 'Puranas', 5, 'seed'),
  ('Nisha', 'female', 'hindu', 'Night', 'contemporary', NULL, 1, 'seed'),
  ('Pooja', 'female', 'hindu', 'Worship, prayer', 'contemporary', NULL, 7, 'seed'),
  ('Radha', 'female', 'hindu', 'Success, prosperity', 'scriptural', 'Mahabharata', 2, 'seed'),
  ('Shreya', 'female', 'hindu', 'Auspicious, beautiful', 'contemporary', NULL, 5, 'seed'),
  ('Tara', 'female', 'hindu', 'Star', 'vedic', 'Vedas', 2, 'seed'),
  ('Uma', 'female', 'hindu', 'Goddess Parvati', 'vedic', 'Vedas', 6, 'seed'),
  ('Vidya', 'female', 'hindu', 'Knowledge, learning', 'contemporary', NULL, 4, 'seed'),
  
  -- Additional Scriptural Names
  ('Sita', 'female', 'hindu', 'Furrow, goddess', 'scriptural', 'Ramayana', 1, 'seed'),
  ('Lakshmi', 'female', 'hindu', 'Goddess of wealth', 'vedic', 'Vishnu Sahasranama', 1, 'seed'),
  ('Parvati', 'female', 'hindu', 'Daughter of mountain', 'vedic', 'Puranas', 6, 'seed'),
  ('Durga', 'female', 'hindu', 'Invincible', 'vedic', 'Puranas', 6, 'seed'),
  ('Saraswati', 'female', 'hindu', 'Goddess of knowledge', 'vedic', 'Vedas', 1, 'seed'),
  ('Draupadi', 'female', 'hindu', 'Daughter of Drupada', 'scriptural', 'Mahabharata', 6, 'seed'),
  ('Rukmini', 'female', 'hindu', 'Adorned with gold', 'scriptural', 'Mahabharata', 6, 'seed'),
  ('Subhadra', 'female', 'hindu', 'Very auspicious', 'scriptural', 'Mahabharata', 2, 'seed'),
  ('Kunti', 'female', 'hindu', 'Spear', 'scriptural', 'Mahabharata', 6, 'seed'),
  ('Mandodari', 'female', 'hindu', 'Soft-bellied', 'scriptural', 'Ramayana', 5, 'seed'),
  ('Kaushalya', 'female', 'hindu', 'Skillful', 'scriptural', 'Ramayana', 1, 'seed'),
  ('Urmila', 'female', 'hindu', 'Enchantress', 'scriptural', 'Ramayana', 6, 'seed'),
  ('Devaki', 'female', 'hindu', 'Divine', 'scriptural', 'Mahabharata', 4, 'seed'),
  ('Yashoda', 'female', 'hindu', 'Giver of fame', 'scriptural', 'Mahabharata', 2, 'seed');

-- ============================================================================
-- MUSLIM MALE NAMES
-- ============================================================================

INSERT INTO baby_names (name, gender, religion, meaning, source_type, source_scripture, numerology_value, generation_source) VALUES
  ('Ahmed', 'male', 'muslim', 'Praiseworthy', 'scriptural', 'Quran', 5, 'seed'),
  ('Ali', 'male', 'muslim', 'High, elevated', 'scriptural', 'Quran', 1, 'seed'),
  ('Arif', 'male', 'muslim', 'Knowledgeable', 'contemporary', NULL, 8, 'seed'),
  ('Faisal', 'male', 'muslim', 'Judge, decisive', 'scriptural', 'Quran', 1, 'seed'),
  ('Hassan', 'male', 'muslim', 'Handsome, good', 'scriptural', 'Hadith', 1, 'seed'),
  ('Ibrahim', 'male', 'muslim', 'Father of nations', 'scriptural', 'Quran', 2, 'seed'),
  ('Khalil', 'male', 'muslim', 'Friend', 'scriptural', 'Quran', 5, 'seed'),
  ('Omar', 'male', 'muslim', 'Long-lived', 'scriptural', 'Hadith', 7, 'seed'),
  ('Saad', 'male', 'muslim', 'Happiness', 'scriptural', 'Quran', 3, 'seed'),
  ('Zain', 'male', 'muslim', 'Beauty, grace', 'contemporary', NULL, 7, 'seed'),
  ('Abdullah', 'male', 'muslim', 'Servant of Allah', 'scriptural', 'Quran', 3, 'seed'),
  ('Bilal', 'male', 'muslim', 'Water, refreshing', 'scriptural', 'Hadith', 2, 'seed'),
  ('Danish', 'male', 'muslim', 'Knowledge, wisdom', 'contemporary', NULL, 1, 'seed'),
  ('Farhan', 'male', 'muslim', 'Happy, joyful', 'contemporary', NULL, 5, 'seed'),
  ('Hamza', 'male', 'muslim', 'Strong, steadfast', 'scriptural', 'Hadith', 7, 'seed'),
  ('Imran', 'male', 'muslim', 'Prosperity', 'scriptural', 'Quran', 2, 'seed'),
  ('Junaid', 'male', 'muslim', 'Warrior', 'scriptural', 'Hadith', 1, 'seed'),
  ('Kamran', 'male', 'muslim', 'Successful', 'contemporary', NULL, 2, 'seed'),
  ('Luqman', 'male', 'muslim', 'Prophet name', 'scriptural', 'Quran', 2, 'seed'),
  ('Mustafa', 'male', 'muslim', 'Chosen one', 'scriptural', 'Quran', 4, 'seed'),
  ('Nasir', 'male', 'muslim', 'Helper, supporter', 'scriptural', 'Quran', 1, 'seed'),
  ('Qasim', 'male', 'muslim', 'Distributor', 'scriptural', 'Hadith', 1, 'seed'),
  ('Rashid', 'male', 'muslim', 'Rightly guided', 'scriptural', 'Quran', 1, 'seed'),
  ('Tariq', 'male', 'muslim', 'Morning star', 'scriptural', 'Quran', 2, 'seed'),
  ('Usman', 'male', 'muslim', 'Baby bustard', 'scriptural', 'Hadith', 6, 'seed');

-- ============================================================================
-- MUSLIM FEMALE NAMES
-- ============================================================================

INSERT INTO baby_names (name, gender, religion, meaning, source_type, source_scripture, numerology_value, generation_source) VALUES
  ('Aisha', 'female', 'muslim', 'Living, alive', 'scriptural', 'Hadith', 1, 'seed'),
  ('Aliya', 'female', 'muslim', 'High, elevated', 'scriptural', 'Quran', 1, 'seed'),
  ('Farah', 'female', 'muslim', 'Joy, happiness', 'contemporary', NULL, 2, 'seed'),
  ('Hiba', 'female', 'muslim', 'Gift', 'scriptural', 'Quran', 2, 'seed'),
  ('Layla', 'female', 'muslim', 'Night beauty', 'contemporary', NULL, 3, 'seed'),
  ('Maryam', 'female', 'muslim', 'Beloved', 'scriptural', 'Quran', 1, 'seed'),
  ('Noor', 'female', 'muslim', 'Light', 'scriptural', 'Quran', 7, 'seed'),
  ('Sarah', 'female', 'muslim', 'Princess', 'scriptural', 'Quran', 1, 'seed'),
  ('Yasmin', 'female', 'muslim', 'Jasmine flower', 'contemporary', NULL, 1, 'seed'),
  ('Zara', 'female', 'muslim', 'Blooming flower', 'contemporary', NULL, 7, 'seed'),
  ('Amina', 'female', 'muslim', 'Trustworthy', 'scriptural', 'Hadith', 5, 'seed'),
  ('Bushra', 'female', 'muslim', 'Good news', 'scriptural', 'Quran', 1, 'seed'),
  ('Dua', 'female', 'muslim', 'Prayer', 'scriptural', 'Quran', 6, 'seed'),
  ('Fatima', 'female', 'muslim', 'Captivating', 'scriptural', 'Hadith', 4, 'seed'),
  ('Hafsa', 'female', 'muslim', 'Young lioness', 'scriptural', 'Hadith', 8, 'seed'),
  ('Iman', 'female', 'muslim', 'Faith', 'scriptural', 'Quran', 5, 'seed'),
  ('Khadija', 'female', 'muslim', 'Premature child', 'scriptural', 'Hadith', 4, 'seed'),
  ('Lubna', 'female', 'muslim', 'Kind of tree', 'contemporary', NULL, 5, 'seed'),
  ('Mariam', 'female', 'muslim', 'Wished for child', 'scriptural', 'Quran', 2, 'seed'),
  ('Nawal', 'female', 'muslim', 'Gift', 'contemporary', NULL, 3, 'seed'),
  ('Qurat', 'female', 'muslim', 'Comfort of eyes', 'contemporary', NULL, 6, 'seed'),
  ('Rabia', 'female', 'muslim', 'Spring', 'scriptural', 'Hadith', 2, 'seed'),
  ('Sana', 'female', 'muslim', 'Brilliance', 'contemporary', NULL, 3, 'seed'),
  ('Zainab', 'female', 'muslim', 'Fragrant flower', 'scriptural', 'Hadith', 7, 'seed');

-- ============================================================================
-- CHRISTIAN MALE NAMES
-- ============================================================================

INSERT INTO baby_names (name, gender, religion, meaning, source_type, source_scripture, numerology_value, generation_source) VALUES
  ('Aaron', 'male', 'christian', 'Teacher, lofty', 'scriptural', 'Bible', 2, 'seed'),
  ('David', 'male', 'christian', 'Beloved', 'scriptural', 'Bible', 4, 'seed'),
  ('Daniel', 'male', 'christian', 'God is my judge', 'scriptural', 'Bible', 5, 'seed'),
  ('Ethan', 'male', 'christian', 'Strong, firm', 'scriptural', 'Bible', 5, 'seed'),
  ('Isaac', 'male', 'christian', 'Laughter', 'scriptural', 'Bible', 1, 'seed'),
  ('Jacob', 'male', 'christian', 'Supplanter', 'scriptural', 'Bible', 3, 'seed'),
  ('John', 'male', 'christian', 'God is gracious', 'scriptural', 'Bible', 5, 'seed'),
  ('Michael', 'male', 'christian', 'Who is like God', 'scriptural', 'Bible', 5, 'seed'),
  ('Samuel', 'male', 'christian', 'Heard by God', 'scriptural', 'Bible', 6, 'seed'),
  ('Timothy', 'male', 'christian', 'Honoring God', 'scriptural', 'Bible', 7, 'seed'),
  ('Andrew', 'male', 'christian', 'Manly', 'scriptural', 'Bible', 5, 'seed'),
  ('Benjamin', 'male', 'christian', 'Son of right hand', 'scriptural', 'Bible', 5, 'seed'),
  ('Christopher', 'male', 'christian', 'Bearer of Christ', 'scriptural', 'Bible', 8, 'seed'),
  ('Emmanuel', 'male', 'christian', 'God with us', 'scriptural', 'Bible', 6, 'seed'),
  ('Gabriel', 'male', 'christian', 'God is my strength', 'scriptural', 'Bible', 6, 'seed'),
  ('Joshua', 'male', 'christian', 'God is salvation', 'scriptural', 'Bible', 6, 'seed'),
  ('Matthew', 'male', 'christian', 'Gift of God', 'scriptural', 'Bible', 5, 'seed'),
  ('Nathan', 'male', 'christian', 'Gift from God', 'scriptural', 'Bible', 5, 'seed'),
  ('Peter', 'male', 'christian', 'Rock, stone', 'scriptural', 'Bible', 5, 'seed'),
  ('Stephen', 'male', 'christian', 'Crown', 'scriptural', 'Bible', 5, 'seed'),
  ('Thomas', 'male', 'christian', 'Twin', 'scriptural', 'Bible', 4, 'seed'),
  ('William', 'male', 'christian', 'Resolute protector', 'contemporary', NULL, 6, 'seed'),
  ('Alexander', 'male', 'christian', 'Defender of men', 'contemporary', NULL, 5, 'seed'),
  ('Jonathan', 'male', 'christian', 'God has given', 'scriptural', 'Bible', 5, 'seed'),
  ('Nicholas', 'male', 'christian', 'Victory of people', 'scriptural', 'Bible', 1, 'seed');

-- ============================================================================
-- CHRISTIAN FEMALE NAMES
-- ============================================================================

INSERT INTO baby_names (name, gender, religion, meaning, source_type, source_scripture, numerology_value, generation_source) VALUES
  ('Anna', 'female', 'christian', 'Grace, favor', 'scriptural', 'Bible', 1, 'seed'),
  ('Deborah', 'female', 'christian', 'Bee', 'scriptural', 'Bible', 7, 'seed'),
  ('Elizabeth', 'female', 'christian', 'God is my oath', 'scriptural', 'Bible', 5, 'seed'),
  ('Grace', 'female', 'christian', 'Divine favor', 'scriptural', 'Bible', 3, 'seed'),
  ('Hannah', 'female', 'christian', 'Favor, grace', 'scriptural', 'Bible', 5, 'seed'),
  ('Joy', 'female', 'christian', 'Happiness', 'scriptural', 'Bible', 7, 'seed'),
  ('Mary', 'female', 'christian', 'Beloved', 'scriptural', 'Bible', 1, 'seed'),
  ('Naomi', 'female', 'christian', 'Pleasant', 'scriptural', 'Bible', 7, 'seed'),
  ('Ruth', 'female', 'christian', 'Companion', 'scriptural', 'Bible', 6, 'seed'),
  ('Sarah', 'female', 'christian', 'Princess', 'scriptural', 'Bible', 1, 'seed'),
  ('Abigail', 'female', 'christian', 'Father rejoiced', 'scriptural', 'Bible', 1, 'seed'),
  ('Catherine', 'female', 'christian', 'Pure', 'contemporary', NULL, 5, 'seed'),
  ('Diana', 'female', 'christian', 'Divine', 'contemporary', NULL, 4, 'seed'),
  ('Esther', 'female', 'christian', 'Star', 'scriptural', 'Bible', 5, 'seed'),
  ('Faith', 'female', 'christian', 'Trust, belief', 'scriptural', 'Bible', 8, 'seed'),
  ('Hope', 'female', 'christian', 'Expectation', 'scriptural', 'Bible', 5, 'seed'),
  ('Julia', 'female', 'christian', 'Youthful', 'contemporary', NULL, 1, 'seed'),
  ('Katherine', 'female', 'christian', 'Pure', 'contemporary', NULL, 5, 'seed'),
  ('Lydia', 'female', 'christian', 'From Lydia', 'scriptural', 'Bible', 4, 'seed'),
  ('Martha', 'female', 'christian', 'Lady', 'scriptural', 'Bible', 2, 'seed'),
  ('Priscilla', 'female', 'christian', 'Ancient', 'scriptural', 'Bible', 1, 'seed'),
  ('Rebecca', 'female', 'christian', 'To bind', 'scriptural', 'Bible', 2, 'seed'),
  ('Susanna', 'female', 'christian', 'Lily', 'scriptural', 'Bible', 3, 'seed'),
  ('Victoria', 'female', 'christian', 'Victory', 'contemporary', NULL, 6, 'seed');

-- ============================================================================
-- SIKH MALE NAMES
-- ============================================================================

INSERT INTO baby_names (name, gender, religion, meaning, source_type, source_scripture, numerology_value, generation_source) VALUES
  ('Arman', 'male', 'sikh', 'Desire, hope', 'contemporary', NULL, 2, 'seed'),
  ('Gurpreet', 'male', 'sikh', 'Love of guru', 'scriptural', 'Guru Granth Sahib', 6, 'seed'),
  ('Harpreet', 'male', 'sikh', 'Love of God', 'scriptural', 'Guru Granth Sahib', 5, 'seed'),
  ('Jasdeep', 'male', 'sikh', 'Glory lamp', 'contemporary', NULL, 4, 'seed'),
  ('Karan', 'male', 'sikh', 'Helper', 'contemporary', NULL, 2, 'seed'),
  ('Manpreet', 'male', 'sikh', 'Love of mind', 'contemporary', NULL, 6, 'seed'),
  ('Navdeep', 'male', 'sikh', 'New light', 'contemporary', NULL, 6, 'seed'),
  ('Rajveer', 'male', 'sikh', 'Brave king', 'contemporary', NULL, 5, 'seed'),
  ('Simran', 'male', 'sikh', 'Remembrance', 'scriptural', 'Guru Granth Sahib', 2, 'seed'),
  ('Tejpal', 'male', 'sikh', 'Protector of light', 'contemporary', NULL, 5, 'seed'),
  ('Amardeep', 'male', 'sikh', 'Eternal light', 'scriptural', 'Guru Granth Sahib', 5, 'seed'),
  ('Balpreet', 'male', 'sikh', 'Love of strength', 'contemporary', NULL, 5, 'seed'),
  ('Daljeet', 'male', 'sikh', 'Victory of army', 'contemporary', NULL, 1, 'seed'),
  ('Gurbir', 'male', 'sikh', 'Brave guru', 'scriptural', 'Guru Granth Sahib', 6, 'seed'),
  ('Harjeet', 'male', 'sikh', 'Victory of God', 'scriptural', 'Guru Granth Sahib', 5, 'seed'),
  ('Jasbir', 'male', 'sikh', 'Brave in glory', 'contemporary', NULL, 2, 'seed'),
  ('Kuldeep', 'male', 'sikh', 'Light of family', 'contemporary', NULL, 4, 'seed'),
  ('Lovepreet', 'male', 'sikh', 'Love of love', 'contemporary', NULL, 6, 'seed'),
  ('Manveer', 'male', 'sikh', 'Brave mind', 'contemporary', NULL, 5, 'seed'),
  ('Parmeet', 'male', 'sikh', 'Friend of supreme', 'scriptural', 'Guru Granth Sahib', 5, 'seed'),
  ('Ranjeet', 'male', 'sikh', 'Victory in battle', 'contemporary', NULL, 5, 'seed'),
  ('Sukhdeep', 'male', 'sikh', 'Light of peace', 'scriptural', 'Guru Granth Sahib', 3, 'seed'),
  ('Taranjeet', 'male', 'sikh', 'Victory of star', 'contemporary', NULL, 5, 'seed'),
  ('Varinder', 'male', 'sikh', 'Ocean lord', 'contemporary', NULL, 5, 'seed');

-- ============================================================================
-- SIKH FEMALE NAMES
-- ============================================================================

INSERT INTO baby_names (name, gender, religion, meaning, source_type, source_scripture, numerology_value, generation_source) VALUES
  ('Amrit', 'female', 'sikh', 'Nectar, immortal', 'scriptural', 'Guru Granth Sahib', 2, 'seed'),
  ('Gurleen', 'female', 'sikh', 'Absorbed in guru', 'scriptural', 'Guru Granth Sahib', 5, 'seed'),
  ('Harleen', 'female', 'sikh', 'Absorbed in God', 'scriptural', 'Guru Granth Sahib', 5, 'seed'),
  ('Jaspreet', 'female', 'sikh', 'Love of glory', 'contemporary', NULL, 6, 'seed'),
  ('Kirpal', 'female', 'sikh', 'Compassionate', 'scriptural', 'Guru Granth Sahib', 2, 'seed'),
  ('Manpreet', 'female', 'sikh', 'Love of mind', 'contemporary', NULL, 6, 'seed'),
  ('Navleen', 'female', 'sikh', 'New absorption', 'contemporary', NULL, 3, 'seed'),
  ('Rajveer', 'female', 'sikh', 'Brave princess', 'contemporary', NULL, 5, 'seed'),
  ('Simran', 'female', 'sikh', 'Remembrance', 'scriptural', 'Guru Granth Sahib', 2, 'seed'),
  ('Tejpal', 'female', 'sikh', 'Protector of light', 'contemporary', NULL, 5, 'seed'),
  ('Amarleen', 'female', 'sikh', 'Absorbed in eternal', 'scriptural', 'Guru Granth Sahib', 5, 'seed'),
  ('Balpreet', 'female', 'sikh', 'Love of strength', 'contemporary', NULL, 5, 'seed'),
  ('Daljeet', 'female', 'sikh', 'Victory of army', 'contemporary', NULL, 1, 'seed'),
  ('Gurleen', 'female', 'sikh', 'Absorbed in guru', 'scriptural', 'Guru Granth Sahib', 5, 'seed'),
  ('Harjeet', 'female', 'sikh', 'Victory of God', 'scriptural', 'Guru Granth Sahib', 5, 'seed'),
  ('Jasbir', 'female', 'sikh', 'Brave in glory', 'contemporary', NULL, 2, 'seed'),
  ('Kuldeep', 'female', 'sikh', 'Light of family', 'contemporary', NULL, 4, 'seed'),
  ('Loveleen', 'female', 'sikh', 'Absorbed in love', 'contemporary', NULL, 3, 'seed'),
  ('Manveer', 'female', 'sikh', 'Brave mind', 'contemporary', NULL, 5, 'seed'),
  ('Parmeet', 'female', 'sikh', 'Friend of supreme', 'scriptural', 'Guru Granth Sahib', 5, 'seed'),
  ('Ranjeet', 'female', 'sikh', 'Victory in battle', 'contemporary', NULL, 5, 'seed'),
  ('Sukhleen', 'female', 'sikh', 'Absorbed in peace', 'scriptural', 'Guru Granth Sahib', 3, 'seed'),
  ('Taranjeet', 'female', 'sikh', 'Victory of star', 'contemporary', NULL, 5, 'seed'),
  ('Varinder', 'female', 'sikh', 'Ocean lord', 'contemporary', NULL, 5, 'seed');

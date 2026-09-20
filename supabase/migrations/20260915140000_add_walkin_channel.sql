/*
# Add walk-in as a lead channel

Numerologists take walk-in clients at their physical practice, not just
digital leads. Additive only - widens the existing channel CHECK
constraint, nothing else changes.
*/

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_channel_check;
ALTER TABLE leads ADD CONSTRAINT leads_channel_check CHECK (channel IN (
  'website', 'youtube', 'instagram', 'facebook', 'linkedin',
  'whatsapp', 'referral', 'existing_customer', 'walk_in', 'organic', 'other'
));

/*
# Lead tags - HubSpot-parity pass

HubSpot's CRM is built around three primitives that generalize past any
one industry: a searchable record store, free-form tags/lists for
segmentation, and bulk property edits across many records at once. The
pipeline/activity/task pieces already exist (Part II Phase D1); this adds
the tagging primitive so leads/customers can be segmented the way a
HubSpot "list" would (e.g. "VIP", "Diwali campaign", "Referred by Asha")
without inventing a whole custom-properties system this app doesn't need.

Purely additive - one nullable-default array column, no existing row
changes shape.
*/

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- GIN index so "leads with tag X" filters stay fast as the list grows.
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN (tags);

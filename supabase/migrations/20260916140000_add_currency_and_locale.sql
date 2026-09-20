/*
# Currency setting - removing an India-only assumption

Every money figure in the native CRM (deal values, exports, backups) was
hardcoded to Indian Rupees. A numerologist practice outside India can't
use this CRM correctly while every deal value silently displays and
formats as INR regardless of what they actually charge in. This adds a
per-account currency, defaulting to INR so nothing changes for existing
accounts, but making the CRM genuinely usable for a subscriber billing
in USD, GBP, EUR, AED, SGD, or any other currency.

Date/time formatting is handled separately in the client (dropping the
hardcoded 'en-IN' locale argument so it follows each viewer's own browser
locale) - no schema change needed for that half.
*/

ALTER TABLE numerologist_profiles
  ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'INR';

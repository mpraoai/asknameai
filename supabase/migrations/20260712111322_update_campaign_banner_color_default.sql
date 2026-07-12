/*
# Update default campaign banner color to indigo

1. Changes
   - Updates the default banner_color in campaigns table from teal (#0F766E) to indigo (#4F46E5)
   - Updates the existing Diwali sample campaign banner color to indigo
*/

ALTER TABLE campaigns ALTER COLUMN banner_color SET DEFAULT '#4F46E5';

UPDATE campaigns SET banner_color = '#4F46E5' WHERE banner_color = '#0F766E';

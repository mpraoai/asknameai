/*
# Fix unit inconsistency: platform_modules prices should be plain rupees

The rest of this app stores money in paise (payments.amount,
subscription_plans.price_monthly_inr - both multiplied by 100, matching
Razorpay's own convention). The ops-console tables added a few minutes
ago (platform_modules, contracts, invoices, expense_entries) don't touch
Razorpay at all and are far more naturally admin-entered/read as plain
rupees - so this corrects the just-seeded platform_modules rows, which
were accidentally seeded as if they were paise (49900 instead of 499).
*/

UPDATE platform_modules SET monthly_price_inr = 499 WHERE code = 'mobile';
UPDATE platform_modules SET monthly_price_inr = 399 WHERE code = 'yantra';
UPDATE platform_modules SET monthly_price_inr = 599 WHERE code = 'brand';
UPDATE platform_modules SET monthly_price_inr = 499 WHERE code = 'domain';

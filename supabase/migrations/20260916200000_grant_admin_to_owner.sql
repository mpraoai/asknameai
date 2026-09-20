/*
# Grant admin access to the product owner's own account

Exactly one account exists in the system (mprao.ai@gmail.com, the
product owner's own account). Marking it as admin so /admin/dashboard
is actually reachable - it was correctly showing "access denied" until
now because no account had is_admin = true.
*/

UPDATE user_profiles SET is_admin = true WHERE email = 'mprao.ai@gmail.com';

/*
# Auto-create user_profiles row on signup

1. Problem
   - registerUser() in src/services/authService.ts calls supabase.auth.signUp()
     and then inserts into user_profiles from the client.
   - The insert_own_profile RLS policy requires an authenticated session
     (auth.uid() = auth_user_id). When "Confirm email" is enabled on the
     Supabase project, signUp() returns no active session until the user
     confirms their email, so the client-side insert runs as anon and is
     rejected by RLS.

2. Fix
   - A SECURITY DEFINER trigger function on auth.users that creates the
     matching user_profiles row server-side, immediately after the auth
     user is created. This runs regardless of session/email-confirmation
     state, so it is not subject to the same race.
   - Registration details (first_name, last_name, mobile_number) are read
     from the new user's raw_user_meta_data, which the client must set via
     supabase.auth.signUp({ options: { data: { ... } } }).
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (auth_user_id, first_name, last_name, mobile_number, email, is_admin)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'mobile_number', ''),
    new.email,
    false
  )
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- auth_user_id needs a unique constraint for the ON CONFLICT clause above
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_auth_user_id_key UNIQUE (auth_user_id);

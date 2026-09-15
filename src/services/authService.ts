import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  mobile_number: string;
  email: string;
  is_admin: boolean;
}

export interface RegistrationData {
  first_name: string;
  last_name: string;
  mobile_number: string;
  email: string;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(mobileNumber: string): Promise<{ success: boolean; error?: string }> {
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const { error } = await supabase
    .from('otp_codes')
    .insert({
      mobile_number: mobileNumber,
      code,
      expires_at: expiresAt.toISOString(),
      verified: false,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  // In production, send SMS here. For now, return the code for dev display.
  console.log(`[OTP for ${mobileNumber}]: ${code}`);
  return { success: true };
}

export async function verifyOTP(
  mobileNumber: string,
  otpCode: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('otp_codes')
    .select('id, expires_at, verified')
    .eq('mobile_number', mobileNumber)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: 'No pending OTP found. Please request a new code.' };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { success: false, error: 'OTP has expired. Please request a new code.' };
  }

  const { data: otpRecord } = await supabase
    .from('otp_codes')
    .select('code')
    .eq('id', data.id)
    .maybeSingle();

  if (!otpRecord || otpRecord.code !== otpCode) {
    return { success: false, error: 'Invalid OTP code. Please try again.' };
  }

  await supabase
    .from('otp_codes')
    .update({ verified: true })
    .eq('id', data.id);

  return { success: true };
}

export async function registerUser(
  data: RegistrationData
): Promise<{ success: boolean; error?: string; user?: any }> {
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('mobile_number', data.mobile_number)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'A user with this mobile number already exists. Please login instead.' };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.mobile_number,
    options: {
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        mobile_number: data.mobile_number,
      },
    },
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { success: false, error: 'An account with this email already exists. Please login instead.' };
    }
    return { success: false, error: authError.message };
  }

  // The user_profiles row is created server-side by the on_auth_user_created
  // trigger (see supabase/migrations/20260914130000_add_handle_new_user_trigger.sql),
  // which reads first_name/last_name/mobile_number from raw_user_meta_data above.
  // This avoids the RLS failure that occurs when signUp() returns without an
  // active session (e.g. when email confirmation is required).

  return { success: true, user: authData.user };
}

export async function loginWithMobile(
  mobileNumber: string
): Promise<{ success: boolean; error?: string; user?: any }> {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('email, first_name, last_name, is_admin')
    .eq('mobile_number', mobileNumber)
    .maybeSingle();

  if (error || !profile) {
    return { success: false, error: 'No account found with this mobile number. Please register first.' };
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: mobileNumber,
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  return { success: true, user: authData.user };
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function checkMobileExists(mobileNumber: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('mobile_number', mobileNumber)
    .maybeSingle();
  return !!data;
}

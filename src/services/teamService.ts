import { supabase } from '../lib/supabase';

export interface TeamMember {
  id: string;
  numerologist_id: string;
  user_profile_id: string | null;
  mobile_number: string;
  role: 'staff';
  status: 'invited' | 'active' | 'removed';
  invited_at: string;
  joined_at: string | null;
  member_name?: string | null;
}

export interface ActingProfile {
  numerologistId: string;
  isOwner: boolean;
}

/**
 * Resolves which numerologist_id the current logged-in user should act
 * as: their own (if they own a numerologist_profiles row), or their
 * employer's (if they're an active staff member of one). Returns null
 * if neither applies.
 */
export async function resolveActingProfile(userProfileId: string): Promise<ActingProfile | null> {
  const { data: owned } = await supabase
    .from('numerologist_profiles')
    .select('id')
    .eq('user_profile_id', userProfileId)
    .maybeSingle();

  if (owned) return { numerologistId: owned.id, isOwner: true };

  const { data: membership } = await supabase
    .from('team_members')
    .select('numerologist_id')
    .eq('user_profile_id', userProfileId)
    .eq('status', 'active')
    .maybeSingle();

  if (membership) return { numerologistId: membership.numerologist_id, isOwner: false };

  return null;
}

export async function getMyTeam(numerologistId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*, member:user_profiles(first_name, last_name)')
    .eq('numerologist_id', numerologistId)
    .neq('status', 'removed')
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('[teamService] getMyTeam error:', error.message);
    return [];
  }

  return (data as any[]).map((row) => ({
    ...row,
    member_name: row.member ? `${row.member.first_name} ${row.member.last_name}` : null,
  }));
}

/**
 * Adds a staff member by mobile number. If that mobile already has an
 * AskNameAI account, they're linked and active immediately. Otherwise
 * the invite is stored as 'invited' - they need to create an account
 * first, then be added again.
 */
export async function inviteTeamMember(
  numerologistId: string,
  mobileNumber: string
): Promise<{ success: boolean; error?: string; status?: 'active' | 'invited' }> {
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('mobile_number', mobileNumber)
    .maybeSingle();

  const { error } = await supabase.from('team_members').insert({
    numerologist_id: numerologistId,
    mobile_number: mobileNumber,
    user_profile_id: existingUser?.id || null,
    status: existingUser ? 'active' : 'invited',
    joined_at: existingUser ? new Date().toISOString() : null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, status: existingUser ? 'active' : 'invited' };
}

/** Re-checks an 'invited' team member against user_profiles, in case they've since registered. */
export async function recheckInvite(teamMemberId: string, mobileNumber: string): Promise<{ success: boolean; nowActive: boolean }> {
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('mobile_number', mobileNumber)
    .maybeSingle();

  if (!existingUser) return { success: true, nowActive: false };

  const { error } = await supabase
    .from('team_members')
    .update({ user_profile_id: existingUser.id, status: 'active', joined_at: new Date().toISOString() })
    .eq('id', teamMemberId);

  return { success: !error, nowActive: !error };
}

export async function removeTeamMember(teamMemberId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('team_members')
    .update({ status: 'removed' })
    .eq('id', teamMemberId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

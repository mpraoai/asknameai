import { supabase } from '../lib/supabase';
import { UserProfile } from './authService';

export interface MyReport {
  id: string;
  plan: string;
  driver: number;
  conductor: number;
  status: string;
  created_at: string;
}

/**
 * A logged-in customer's own report/purchase history. The `purchases`
 * table has no user_id column (same pre-existing limitation noted in
 * adminService.getCustomerPurchases), so this matches by the profile's
 * own name - the best link available without a schema change to a table
 * this app already relies on elsewhere unmodified.
 */
export async function getMyReports(profile: UserProfile): Promise<MyReport[]> {
  const { data } = await supabase
    .from('purchases')
    .select('id, plan, driver, conductor, status, created_at')
    .ilike('first_name', profile.first_name)
    .ilike('last_name', profile.last_name)
    .order('created_at', { ascending: false });
  return data || [];
}

export interface SavedName {
  id: string;
  name: string;
  category: 'baby_name' | 'business_name';
  created_at: string;
}

export async function getSavedNames(userProfileId: string): Promise<SavedName[]> {
  const { data } = await supabase
    .from('saved_names')
    .select('id, name, category, created_at')
    .eq('user_profile_id', userProfileId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function saveName(userProfileId: string, name: string, category: 'baby_name' | 'business_name' = 'baby_name'): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('saved_names').insert({ user_profile_id: userProfileId, name, category });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeSavedName(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('saved_names').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeSavedNameByName(userProfileId: string, name: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('saved_names').delete().eq('user_profile_id', userProfileId).eq('name', name);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export interface DeletionRequest {
  id: string;
  status: 'pending' | 'completed' | 'declined';
  requested_at: string;
}

export async function getMyDeletionRequest(userProfileId: string): Promise<DeletionRequest | null> {
  const { data } = await supabase
    .from('deletion_requests')
    .select('id, status, requested_at')
    .eq('user_profile_id', userProfileId)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function requestDataDeletion(userProfileId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('deletion_requests').insert({ user_profile_id: userProfileId, reason: reason || null });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

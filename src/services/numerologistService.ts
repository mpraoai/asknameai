import { supabase } from '../lib/supabase';
import { UserProfile } from './authService';

export interface NumerologistProfile {
  id: string;
  user_profile_id: string;
  business_name: string;
  brand_color: string;
  logo_url: string | null;
  subscription_status: 'trial' | 'active' | 'past_due' | 'cancelled';
  reports_used_this_month: number;
  reports_limit_per_month: number;
  currency_code: string;
}

export interface Lead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  mobile_number: string | null;
  email: string | null;
  source_type: 'free_check' | 'baby_names' | 'manual';
  channel: string;
  lead_score: 'hot' | 'warm' | 'cold';
  status: 'new' | 'contacted' | 'converted' | 'lost';
  assigned_numerologist_id: string | null;
  created_at: string;
  tags: string[];
  referred_by_lead_id: string | null;
}

/**
 * Upgrades an already-registered customer into a numerologist subscriber.
 * This reuses the existing user_profiles row created by registerUser()/
 * loginWithMobile() in authService.ts — it does not modify that file at all.
 */
export async function becomeNumerologist(
  userProfile: UserProfile,
  businessName: string
): Promise<{ success: boolean; error?: string; profile?: NumerologistProfile }> {
  const { error: roleError } = await supabase
    .from('user_profiles')
    .update({ role: 'numerologist' })
    .eq('id', userProfile.id);

  if (roleError) {
    return { success: false, error: roleError.message };
  }

  const { data: existing } = await supabase
    .from('numerologist_profiles')
    .select('*')
    .eq('user_profile_id', userProfile.id)
    .maybeSingle();

  if (existing) {
    return { success: true, profile: existing as NumerologistProfile };
  }

  const { data, error } = await supabase
    .from('numerologist_profiles')
    .insert({
      user_profile_id: userProfile.id,
      business_name: businessName,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, profile: data as NumerologistProfile };
}

export async function getNumerologistProfileById(id: string): Promise<NumerologistProfile | null> {
  const { data, error } = await supabase
    .from('numerologist_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return data as NumerologistProfile;
}

export async function getMyNumerologistProfile(): Promise<NumerologistProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('numerologist_profiles')
    .select('*, user_profiles!inner(auth_user_id)')
    .eq('user_profiles.auth_user_id', user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as NumerologistProfile;
}

export async function updateBranding(
  numerologistId: string,
  updates: { business_name?: string; brand_color?: string; logo_url?: string; currency_code?: string }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('numerologist_profiles')
    .update(updates)
    .eq('id', numerologistId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getMyLeads(numerologistId: string): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('assigned_numerologist_id', numerologistId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[numerologistService] getMyLeads error:', error.message);
    return [];
  }
  return data as Lead[];
}

export async function updateLeadStatus(
  leadId: string,
  status: Lead['status']
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function setLeadTags(leadId: string, tags: string[]): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('leads').update({ tags }).eq('id', leadId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Bulk property edits across many records at once - the HubSpot table
 * pattern (select rows, change one property for all of them in one action)
 * applied to our own leads table.
 */
export async function bulkUpdateLeads(
  leadIds: string[],
  updates: { status?: Lead['status']; lead_score?: Lead['lead_score']; channel?: string }
): Promise<{ success: boolean; error?: string }> {
  if (leadIds.length === 0) return { success: true };
  const { error } = await supabase.from('leads').update(updates).in('id', leadIds);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function bulkAddTag(leadIds: string[], tag: string, currentTagsByLead: Record<string, string[]>): Promise<{ success: boolean; error?: string }> {
  const cleanTag = tag.trim();
  if (!cleanTag || leadIds.length === 0) return { success: true };
  const results = await Promise.all(
    leadIds.map((id) => {
      const existing = currentTagsByLead[id] || [];
      if (existing.includes(cleanTag)) return Promise.resolve({ error: null });
      return supabase.from('leads').update({ tags: [...existing, cleanTag] }).eq('id', id);
    })
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { success: false, error: (failed.error as any).message };
  return { success: true };
}

/**
 * Captures a lead from the free-check funnel. Safe to call from anonymous
 * (not-logged-in) visitors — the Phase A migration allows anon INSERT on leads.
 * Wire this into FreeCheckForm.tsx (or wherever the free-check form submits)
 * right after the free result is shown, per the funnel logic in the PRD.
 */
export async function captureLead(input: {
  first_name?: string;
  last_name?: string;
  mobile_number?: string;
  email?: string;
  source_type?: Lead['source_type'];
  lead_score?: Lead['lead_score'];
  channel?: string;
  assigned_numerologist_id?: string;
  referred_by_lead_id?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('leads').insert({
    first_name: input.first_name,
    last_name: input.last_name,
    mobile_number: input.mobile_number,
    email: input.email,
    source_type: input.source_type ?? 'free_check',
    lead_score: input.lead_score ?? 'warm',
    channel: input.channel,
    assigned_numerologist_id: input.assigned_numerologist_id,
    referred_by_lead_id: input.referred_by_lead_id || null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export interface ReferralGroup {
  referrer: Lead;
  referred: Lead[];
}

/** Who referred whom, and what happened - Nestarmy PRD Pillar E (Retain). Computed client-side from the already-loaded book. */
export function buildReferralReport(leads: Lead[]): ReferralGroup[] {
  const byId = new Map(leads.map((l) => [l.id, l]));
  const groups = new Map<string, Lead[]>();
  for (const lead of leads) {
    if (!lead.referred_by_lead_id) continue;
    const list = groups.get(lead.referred_by_lead_id) || [];
    list.push(lead);
    groups.set(lead.referred_by_lead_id, list);
  }
  return Array.from(groups.entries())
    .map(([referrerId, referred]) => ({ referrer: byId.get(referrerId), referred }))
    .filter((g): g is ReferralGroup => !!g.referrer)
    .sort((a, b) => b.referred.length - a.referred.length);
}

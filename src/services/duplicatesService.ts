import { supabase } from '../lib/supabase';
import { Lead } from './numerologistService';

export interface DuplicateGroup {
  mobile_number: string;
  leads: Lead[];
}

/** Groups leads by matching mobile number - the most reliable duplicate signal for this book. */
export function findDuplicateGroups(leads: Lead[]): DuplicateGroup[] {
  const byMobile: Record<string, Lead[]> = {};
  for (const lead of leads) {
    if (!lead.mobile_number) continue;
    byMobile[lead.mobile_number] = byMobile[lead.mobile_number] || [];
    byMobile[lead.mobile_number].push(lead);
  }
  return Object.entries(byMobile)
    .filter(([, group]) => group.length > 1)
    .map(([mobile_number, group]) => ({ mobile_number, leads: group }))
    .sort((a, b) => b.leads.length - a.leads.length);
}

/**
 * Folds duplicateId's activity/report/tag history into primaryId, then
 * removes the duplicate. Runs as a SECURITY DEFINER DB function so the
 * multi-table update is atomic and permission-checked server-side.
 */
export async function mergeLeads(primaryId: string, duplicateId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('merge_leads', { primary_id: primaryId, duplicate_id: duplicateId });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

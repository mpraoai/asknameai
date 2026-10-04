import { supabase } from '../lib/supabase';
import type { captureLead } from './numerologistService';

// NOTE on appointments: this project already has an `appointments` table
// and a `bookingService.ts` (added in the ops-console commit). Do not add
// booking functions here — use bookingService.ts for that. This file only
// covers the lead-scoring and outreach-draft pieces that don't already exist.

export interface TriageResult {
  score_numeric: number;
  reasoning: string;
}

export interface LeadOutreachDraft {
  id: string;
  lead_id: string;
  platform: 'whatsapp' | 'instagram' | 'facebook' | 'email' | 'sms';
  content_text: string;
  status: 'draft' | 'approved' | 'sent';
  generated_by: string;
  created_at: string;
}

/**
 * Calls the lead-triage-agent Edge Function to give a lead an AI-generated
 * 0-100 score (stored in leads.score_numeric). This runs alongside the
 * existing leadScoringAgent.ts rule-based hot/warm/cold tier — neither
 * overwrites the other, by design, so they can be compared over time.
 */
export async function triageLead(leadId: string): Promise<TriageResult | null> {
  const { data, error } = await supabase.functions.invoke('lead-triage-agent', {
    body: { lead_id: leadId },
  });

  if (error) {
    console.error('[leadAutomationService] triageLead error:', error.message);
    return null;
  }

  return data as TriageResult;
}

/**
 * Captures a lead and asks the Triage Agent to give it an AI score. This is
 * what the free-check funnel calls instead of captureLead, so every new lead
 * gets both the rule-based tier (passed in as lead_score) and the AI score.
 *
 * Does its own insert rather than calling captureLead (numerologistService.ts
 * stays unchanged): the id is generated here, because anonymous visitors may
 * INSERT into leads but RLS won't let them read the row back to learn its id.
 * Columns and defaults mirror captureLead exactly.
 *
 * success reflects only whether the lead was saved. Triage runs in the
 * background and a failure there is logged, never shown to the visitor.
 */
export async function captureLeadAndTriage(
  input: Parameters<typeof captureLead>[0]
): Promise<{ success: boolean; error?: string; leadId?: string }> {
  const leadId = crypto.randomUUID();

  const { error } = await supabase.from('leads').insert({
    id: leadId,
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

  if (error) {
    console.error('[leadAutomationService] lead insert failed:', error.message);
    return { success: false, error: error.message };
  }

  void triageLead(leadId);
  return { success: true, leadId };
}

export async function getOutreachDraftsForLead(leadId: string): Promise<LeadOutreachDraft[]> {
  const { data, error } = await supabase
    .from('lead_outreach_drafts')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[leadAutomationService] getOutreachDraftsForLead error:', error.message);
    return [];
  }
  return data as LeadOutreachDraft[];
}

export async function approveOutreachDraft(
  draftId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('lead_outreach_drafts')
    .update({ status: 'approved' })
    .eq('id', draftId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
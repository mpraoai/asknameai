import { supabase } from '../lib/supabase';
import { Lead } from './numerologistService';

export interface CrmStage {
  id: string;
  numerologist_id: string;
  name: string;
  sort_order: number;
  is_default: boolean;
  playbook: string;
  probability_pct: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface Deal {
  id: string;
  lead_id: string;
  numerologist_id: string;
  stage_id: string;
  value: number;
  created_at: string;
  updated_at: string;
  lead?: Lead;
}

export interface Activity {
  id: string;
  lead_id: string;
  type: 'stage_change' | 'call' | 'message' | 'report_sent' | 'note';
  payload: Record<string, unknown>;
  created_at: string;
}

export async function getStages(numerologistId: string): Promise<CrmStage[]> {
  const { data, error } = await supabase
    .from('crm_stages')
    .select('*')
    .eq('numerologist_id', numerologistId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[crmService] getStages error:', error.message);
    return [];
  }
  return data as CrmStage[];
}

/** Pipeline configuration - matches the numerologist's real funnel instead of a fixed shared one (Nestarmy PRD Pillar C). */
export async function addStage(
  numerologistId: string,
  name: string,
  probabilityPct: number = 0
): Promise<{ success: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from('crm_stages')
    .select('sort_order')
    .eq('numerologist_id', numerologistId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;
  const { error } = await supabase
    .from('crm_stages')
    .insert({ numerologist_id: numerologistId, name, sort_order: nextOrder, probability_pct: probabilityPct });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateStage(
  stageId: string,
  updates: { name?: string; playbook?: string; probability_pct?: number; sort_order?: number }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('crm_stages').update(updates).eq('id', stageId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteStage(stageId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('crm_stages').delete().eq('id', stageId);
  if (error) {
    if (error.message.includes('foreign key') || error.code === '23503') {
      return { success: false, error: 'Move the deals out of this stage before deleting it.' };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getMyDeals(numerologistId: string): Promise<Deal[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('*, lead:leads(*)')
    .eq('numerologist_id', numerologistId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[crmService] getMyDeals error:', error.message);
    return [];
  }
  return data as unknown as Deal[];
}

export async function moveDealStage(
  dealId: string,
  stageId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('deals')
    .update({ stage_id: stageId })
    .eq('id', dealId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateDealValue(
  dealId: string,
  value: number
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('deals')
    .update({ value })
    .eq('id', dealId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getActivitiesForLead(leadId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[crmService] getActivitiesForLead error:', error.message);
    return [];
  }
  return data as Activity[];
}

export async function addNote(
  leadId: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('activities')
    .insert({ lead_id: leadId, type: 'note', payload: { note } });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Manually logs a call or message touch on a lead - until D4 (Voice AI)
 * exists to log calls automatically, this is how a numerologist records
 * that they actually reached out the old-fashioned way. Per §II.3, every
 * touch on a lead belongs in the activity timeline, not just notes.
 */
export async function logTouch(
  leadId: string,
  type: 'call' | 'message',
  note: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('activities')
    .insert({ lead_id: leadId, type, payload: { note } });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export interface Task {
  id: string;
  lead_id: string;
  deal_id: string;
  numerologist_id: string;
  reason: string;
  due_at: string;
  completed_at: string | null;
  created_at: string;
  lead?: Lead;
}

/**
 * Asks the database to create (or leave alone) a follow-up task for every
 * deal that has sat untouched for 7+ days. Called on every dashboard
 * load - no pg_cron dependency, so it works the same on every Supabase
 * plan and the tasks are "auto-created" the moment anyone opens the app,
 * not by a human deciding a lead needs chasing.
 */
export async function ensureFollowupTasks(): Promise<void> {
  await supabase.rpc('create_followup_tasks');
}

export async function getOpenTasks(numerologistId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, lead:leads(*)')
    .eq('numerologist_id', numerologistId)
    .is('completed_at', null)
    .order('due_at', { ascending: true });

  if (error) {
    console.error('[crmService] getOpenTasks error:', error.message);
    return [];
  }
  return data as unknown as Task[];
}

export async function completeTask(taskId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('tasks')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

import { supabase } from '../../lib/supabase';

/**
 * Frontend client for the 3 new multi-agent Phase 3 edge functions:
 * Explainer, Numerologist Assistant, and Retention agents. Kept in a
 * new directory (not src/services/agents/) since that folder is
 * off-limits to edits per project rules - this is new code, not a
 * modification of the existing baby-name agent trio.
 */

async function invoke<T>(fn: string, body: unknown): Promise<{ success: boolean; data?: T; error?: string }> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: data?.error || 'Unknown error' };
  return { success: true, data };
}

export async function explainNumerologyReport(input: {
  firstName: string;
  driver: number;
  conductor: number;
  lifePathNumber?: number;
  destinyNumber?: number;
  soulUrgeNumber?: number;
  isAuspicious?: boolean;
}): Promise<{ success: boolean; explanation?: string; error?: string }> {
  const res = await invoke<{ explanation: string }>('explain-numerology-report', input);
  return { success: res.success, explanation: (res.data as any)?.explanation, error: res.error };
}

export async function draftClientMessage(input: {
  numerologistBusinessName: string;
  clientFirstName: string;
  driver: number;
  conductor: number;
  verdict?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await invoke<{ message: string }>('draft-client-message', input);
  return { success: res.success, message: (res.data as any)?.message, error: res.error };
}

export async function draftRetentionMessage(input: {
  leadFirstName: string;
  daysSinceContact: number;
  leadStatus: string;
  numerologistBusinessName?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await invoke<{ message: string }>('draft-retention-message', input);
  return { success: res.success, message: (res.data as any)?.message, error: res.error };
}

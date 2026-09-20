import { supabase } from '../lib/supabase';
import { calculateNumerology, NumerologyInput, NumerologyResult } from '../lib/numerology';

export interface NumerologyReport {
  id: string;
  lead_id: string | null;
  numerologist_id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  result: NumerologyResult;
  created_at: string;
}

/**
 * Runs the existing (unmodified) numerology engine against a lead's
 * details and saves the result. This is what powers "Generate Report"
 * from the numerologist dashboard.
 */
export async function generateAndSaveReport(
  numerologistId: string,
  leadId: string | null,
  input: NumerologyInput
): Promise<{ success: boolean; error?: string; result?: NumerologyResult }> {
  const result = calculateNumerology(input);

  const { error } = await supabase.from('numerology_reports').insert({
    lead_id: leadId,
    numerologist_id: numerologistId,
    first_name: input.firstName,
    last_name: input.lastName,
    dob: input.dob,
    gender: input.gender,
    result,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, result };
}

export async function getReportsForLead(leadId: string): Promise<NumerologyReport[]> {
  const { data, error } = await supabase
    .from('numerology_reports')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[reportsService] getReportsForLead error:', error.message);
    return [];
  }
  return data as unknown as NumerologyReport[];
}

export async function getMyReports(numerologistId: string): Promise<NumerologyReport[]> {
  const { data, error } = await supabase
    .from('numerology_reports')
    .select('*')
    .eq('numerologist_id', numerologistId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[reportsService] getMyReports error:', error.message);
    return [];
  }
  return data as unknown as NumerologyReport[];
}

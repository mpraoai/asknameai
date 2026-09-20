import { supabase } from '../lib/supabase';

export interface Contract {
  id: string;
  numerologist_id: string;
  plan_id: string | null;
  modules: string[];
  monthly_total_inr: number;
  status: 'draft' | 'sent' | 'signed';
  sent_at: string | null;
  signed_at: string | null;
  created_at: string;
}

export async function getContractsForSubscriber(numerologistId: string): Promise<Contract[]> {
  const { data } = await supabase.from('contracts').select('*').eq('numerologist_id', numerologistId).order('created_at', { ascending: false });
  return data || [];
}

export async function markContractSigned(contractId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('contracts').update({ status: 'signed', signed_at: new Date().toISOString() }).eq('id', contractId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export interface Invoice {
  id: string;
  numerologist_id: string;
  contract_id: string | null;
  invoice_number: string;
  line_items: { label: string; amount_inr: number }[];
  total_inr: number;
  status: 'sent' | 'paid' | 'overdue';
  due_date: string | null;
  created_at: string;
}

export async function getInvoicesForSubscriber(numerologistId: string): Promise<Invoice[]> {
  const { data } = await supabase.from('invoices').select('*').eq('numerologist_id', numerologistId).order('created_at', { ascending: false });
  return data || [];
}

export async function markInvoicePaid(invoiceId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getAllInvoices(): Promise<(Invoice & { business_name: string })[]> {
  const { data } = await supabase
    .from('invoices')
    .select('*, numerologist_profiles(business_name)')
    .order('created_at', { ascending: false })
    .limit(50);
  return (data || []).map((row: any) => ({ ...row, business_name: row.numerologist_profiles?.business_name || 'Unknown' }));
}

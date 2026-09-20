import { supabase } from '../lib/supabase';
import { Lead } from './numerologistService';

export interface Ticket {
  id: string;
  numerologist_id: string;
  lead_id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  due_at: string | null;
  created_at: string;
  resolved_at: string | null;
  lead?: Lead;
}

export async function getTickets(numerologistId: string): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*, lead:leads(*)')
    .eq('numerologist_id', numerologistId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ticketService] getTickets error:', error.message);
    return [];
  }
  return data as unknown as Ticket[];
}

export async function getTicketsForLead(leadId: string): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ticketService] getTicketsForLead error:', error.message);
    return [];
  }
  return data as Ticket[];
}

export async function createTicket(
  numerologistId: string,
  leadId: string,
  subject: string,
  dueAt?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('tickets').insert({
    numerologist_id: numerologistId,
    lead_id: leadId,
    subject,
    due_at: dueAt || null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateTicketStatus(
  ticketId: string,
  status: Ticket['status']
): Promise<{ success: boolean; error?: string }> {
  const updates: Record<string, unknown> = { status };
  if (status === 'resolved') updates.resolved_at = new Date().toISOString();
  const { error } = await supabase.from('tickets').update(updates).eq('id', ticketId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

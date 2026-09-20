import { supabase } from '../lib/supabase';

export interface SupportTicket {
  id: string;
  numerologist_id: string;
  subject: string;
  priority: 'hot' | 'warm' | 'cold';
  status: 'open' | 'in_progress' | 'resolved';
  sla_due_at: string | null;
  created_at: string;
  resolved_at: string | null;
  business_name?: string;
}

export async function getAllSupportTickets(): Promise<SupportTicket[]> {
  const { data } = await supabase
    .from('support_tickets')
    .select('*, numerologist_profiles(business_name)')
    .order('created_at', { ascending: false });
  return (data || []).map((row: any) => ({ ...row, business_name: row.numerologist_profiles?.business_name || 'Unknown' }));
}

export async function updateSupportTicketStatus(id: string, status: SupportTicket['status']): Promise<{ success: boolean; error?: string }> {
  const updates: Record<string, unknown> = { status };
  if (status === 'resolved') updates.resolved_at = new Date().toISOString();
  const { error } = await supabase.from('support_tickets').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender: 'subscriber' | 'admin';
  sender_name: string;
  message: string;
  created_at: string;
}

export async function getTicketMessages(ticketId: string): Promise<SupportTicketMessage[]> {
  const { data } = await supabase.from('support_ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
  return data || [];
}

export async function addTicketMessage(ticketId: string, senderName: string, message: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('support_ticket_messages').insert({ ticket_id: ticketId, sender: 'admin', sender_name: senderName, message });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

import { supabase } from '../lib/supabase';

export interface MarketingCampaign {
  id: string;
  name: string;
  channel: 'whatsapp' | 'instagram' | 'google_ads' | 'referral' | 'other';
  leads_generated: number;
  cost_inr: number;
  status: 'active' | 'paused';
  created_at: string;
}

export async function getMarketingCampaigns(): Promise<MarketingCampaign[]> {
  const { data } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function createMarketingCampaign(input: Omit<MarketingCampaign, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('marketing_campaigns').insert(input);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function toggleCampaignStatus(id: string, status: 'active' | 'paused'): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('marketing_campaigns').update({ status }).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

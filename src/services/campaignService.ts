import { supabase } from '../lib/supabase';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  discount_label: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  original_price: number;
  features: string[];
  is_popular: boolean;
}
export interface EffectivePrice {
  price: number;
  hasDiscount: boolean;
  campaign: Campaign | null;
}
export function getEffectivePrice(plan: PricingPlan, campaigns: Campaign[]): EffectivePrice {
  const now = new Date();
  const activeCampaign = campaigns.find(c => {
    if (!c.is_active) return false;
    const start = new Date(c.start_date);
    const end = new Date(c.end_date);
    return now >= start && now <= end;
  });
  if (!activeCampaign) {
    return { price: plan.original_price, hasDiscount: false, campaign: null };
  }
  let discountedPrice = plan.original_price;
  if (activeCampaign.discount_type === 'percentage') {
    discountedPrice = Math.round(plan.original_price * (1 - activeCampaign.discount_value / 100));
  } else {
    discountedPrice = Math.max(0, plan.original_price - activeCampaign.discount_value);
  }
  return { price: discountedPrice, hasDiscount: true, campaign: activeCampaign };
}

export async function getActiveCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase.from('campaigns').select('*').eq('is_active', true);
  if (error) throw error;
  return data as Campaign[];
}
export async function getAllCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Campaign[];
}
export async function createCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign> {
  const { data, error } = await supabase.from('campaigns').insert(campaign).select().single();
  if (error) throw error;
  return data as Campaign;
}
export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
  const { data, error } = await supabase.from('campaigns').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Campaign;
}
export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw error;
}
export async function getPricingPlans(): Promise<PricingPlan[]> {
  const { data, error } = await supabase.from('pricing_plans').select('*').order('original_price', { ascending: true });
  if (error) throw error;
  return data as PricingPlan[];
}
export async function getAllPricingPlans(): Promise<PricingPlan[]> {
  const { data, error } = await supabase.from('pricing_plans').select('*').order('original_price', { ascending: true });
  if (error) throw error;
  return data as PricingPlan[];
}
export async function updatePricingPlan(id: string, updates: Partial<PricingPlan>): Promise<PricingPlan> {
  const { data, error } = await supabase.from('pricing_plans').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as PricingPlan;
}



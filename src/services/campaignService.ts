import { supabase } from '../lib/supabase';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  discount_label: string | null;
  discount_percentage: number;
  fixed_price: number | null;
  banner_color: string | null;
  cta_text: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  festival_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  original_price: number;
  discounted_price: number | null;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export async function getActiveCampaigns(): Promise<Campaign[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Campaign[];
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Campaign[];
}

export async function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('campaigns')
    .insert(campaign);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('campaigns')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteCampaign(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getPricingPlans(): Promise<PricingPlan[]> {
  const { data, error } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data as PricingPlan[];
}

export async function getAllPricingPlans(): Promise<PricingPlan[]> {
  const { data, error } = await supabase
    .from('pricing_plans')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data as PricingPlan[];
}

export async function updatePricingPlan(id: string, updates: Partial<PricingPlan>): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('pricing_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export function getEffectivePrice(plan: PricingPlan, campaigns: Campaign[]): { price: number; hasDiscount: boolean; campaign?: Campaign } {
  if (plan.discounted_price && plan.discounted_price < plan.original_price) {
    return { price: plan.discounted_price, hasDiscount: true };
  }

  const applicableCampaign = campaigns.find(c => c.discount_percentage > 0 || c.fixed_price !== null);
  if (applicableCampaign) {
    if (applicableCampaign.fixed_price !== null) {
      return { price: applicableCampaign.fixed_price, hasDiscount: applicableCampaign.fixed_price < plan.original_price, campaign: applicableCampaign };
    }
    if (applicableCampaign.discount_percentage > 0) {
      const discounted = Math.round(plan.original_price * (1 - applicableCampaign.discount_percentage / 100));
      return { price: discounted, hasDiscount: true, campaign: applicableCampaign };
    }
  }

  return { price: plan.original_price, hasDiscount: false };
}

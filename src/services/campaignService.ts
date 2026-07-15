import { supabase } from '../lib/supabase';

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  original_price: number;
  discounted_price: number;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  discount_label: string;
  discount_percentage: number;
  fixed_price: number | null;
  banner_color: string;
  cta_text: string;
  festival_name: string;
  is_active: boolean;
}

export function getEffectivePrice(plan: PricingPlan, campaign: Campaign | null): number {
  if (campaign) {
    if (campaign.fixed_price !== null) {
      return campaign.fixed_price;
    }
    if (campaign.discount_percentage > 0) {
      return Math.round(plan.original_price * (1 - campaign.discount_percentage / 100));
    }
  }
  return plan.discounted_price || plan.original_price;
}

export async function fetchPricingPlans(): Promise<PricingPlan[]> {
  const { data, error } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchActiveCampaign(): Promise<Campaign | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

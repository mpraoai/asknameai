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

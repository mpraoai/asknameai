import React, { useEffect, useState } from 'react';
import { Check, Star, ArrowRight, Loader as Loader2, Tag, ArrowLeft } from 'lucide-react';
import { PricingPlan, Campaign, fetchPricingPlans, fetchActiveCampaign, getEffectivePrice } from '../services/campaignService';

interface PlanSelectionProps {
  onSelectPlan: (plan: PricingPlan, campaign: Campaign | null) => void;
  onBack: () => void;
}

export const PlanSelection: React.FC<PlanSelectionProps> = ({ onSelectPlan, onBack }) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const [p, c] = await Promise.all([fetchPricingPlans(), fetchActiveCampaign()]);
        setPlans(p);
        setCampaign(c);
      } catch (err) {
        console.error('Failed to load plans:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSelect = (plan: PricingPlan) => {
    setSelectedId(plan.id);
    setTimeout(() => onSelectPlan(plan, campaign), 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-purple-50">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-brand-600 transition-colors mb-6">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Choose Your Plan</h1>
          <p className="text-gray-500 text-lg">Select a plan to unlock your complete numerology report</p>
        </div>

        {campaign && (
          <div className="mb-8 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-2xl p-5 flex items-center gap-4 animate-fade-in">
            <div className="bg-white/20 p-3 rounded-xl"><Tag className="w-6 h-6" /></div>
            <div>
              <div className="font-bold text-lg">{campaign.title}</div>
              <div className="text-sm text-white/90">{campaign.description}</div>
              {campaign.discount_label && (
                <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm mt-1">{campaign.discount_label}</div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price = getEffectivePrice(plan, campaign);
            const isSelected = selectedId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => handleSelect(plan)}
                className={`relative bg-white rounded-2xl p-6 cursor-pointer transition-all duration-300 border-2 ${
                  isSelected ? 'border-brand-600 shadow-xl scale-105'
                  : plan.is_popular ? 'border-brand-300 shadow-lg hover:shadow-xl'
                  : 'border-gray-200 hover:border-brand-300 hover:shadow-lg'
                } ${plan.is_popular ? 'ring-2 ring-brand-200' : ''}`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" /> POPULAR
                  </div>
                )}
                {isSelected && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                {plan.description && <p className="text-sm text-gray-500 mb-4">{plan.description}</p>}
                <div className="mb-4">
                  {campaign && campaign.discount_percentage > 0 && (
                    <span className="text-gray-400 line-through text-sm mr-2">₹{plan.original_price}</span>
                  )}
                  <span className="text-3xl font-bold text-brand-600">₹{price}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  isSelected ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                }`}>
                  {isSelected ? 'Selected!' : 'Select Plan'} {!isSelected && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

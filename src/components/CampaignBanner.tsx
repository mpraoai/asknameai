import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { Campaign } from '../services/campaignService';

interface CampaignBannerProps {
  campaigns: Campaign[];
}

export const CampaignBanner: React.FC<CampaignBannerProps> = ({ campaigns }) => {
  const [dismissed, setDismissed] = React.useState(false);
  const [currentIdx, setCurrentIdx] = React.useState(0);

  const activeCampaigns = campaigns.filter(c => {
    const now = new Date();
    const start = new Date(c.start_date);
    const end = new Date(c.end_date);
    return now >= start && now <= end;
  });

  React.useEffect(() => {
    if (activeCampaigns.length > 1) {
      const timer = setInterval(() => {
        setCurrentIdx(prev => (prev + 1) % activeCampaigns.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [activeCampaigns.length]);

  if (dismissed || activeCampaigns.length === 0) return null;

  const campaign = activeCampaigns[currentIdx];

  return (
    <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white">
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
        <Sparkles className="w-4 h-4 flex-shrink-0" />
        <p className="text-sm font-medium text-center">
          {campaign.description || campaign.name} — {campaign.discount_label}
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-1/2 -translate-y-1/2 hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

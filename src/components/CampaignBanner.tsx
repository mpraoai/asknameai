import React, { useState, useEffect } from 'react';
import { Sparkles, X, ChevronDown } from 'lucide-react';
import { Campaign } from '../services/campaignService';

interface CampaignBannerProps {
  campaigns: Campaign[];
}

export const CampaignBanner: React.FC<CampaignBannerProps> = ({ campaigns }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (campaigns.length <= 1 || dismissed) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [campaigns.length, dismissed]);

  if (campaigns.length === 0 || dismissed) return null;

  const campaign = campaigns[currentIndex];

  return (
    <div
      className="relative z-40 text-white shadow-lg overflow-hidden"
      style={{ backgroundColor: campaign.banner_color || '#4F46E5' }}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-3 relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {campaign.festival_name && (
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide">
                    {campaign.festival_name}
                  </span>
                )}
                {campaign.discount_label && (
                  <span className="bg-white text-sm font-bold px-2.5 py-0.5 rounded-full" style={{ color: campaign.banner_color || '#4F46E5' }}>
                    {campaign.discount_label}
                  </span>
                )}
                <span className="font-semibold text-sm md:text-base truncate">{campaign.title}</span>
              </div>
              {expanded && (
                <p className="text-sm text-white/90 mt-1 animate-fadeIn">{campaign.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="bg-white text-sm font-semibold px-4 py-1.5 rounded-full hover:shadow-lg transition-all whitespace-nowrap"
              style={{ color: campaign.banner_color || '#4F46E5' }}
            >
              {campaign.cta_text}
            </button>
            {campaigns.length > 1 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {campaigns.length > 1 && (
          <div className="flex gap-1.5 mt-2 justify-center">
            {campaigns.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

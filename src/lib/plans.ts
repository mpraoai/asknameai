import { Star, Zap, Crown } from 'lucide-react';

/**
 * Single source of truth for the 3 paid plans - previously duplicated
 * only inside PlansPage.tsx. Pulled out so the report page's "select a
 * plan" CTA can show the real prices without them drifting out of sync.
 */
export const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 299,
    currency: '₹',
    icon: Star,
    features: [
      'All name correction suggestions',
      'Driver & Conductor detailed analysis',
      'Name value breakdown',
      'Basic numerology report',
    ],
    color: 'from-blue-500/20 to-blue-600/5',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 599,
    currency: '₹',
    icon: Zap,
    features: [
      'Everything in Basic',
      'Full numerology dashboard',
      'Life Path, Destiny, Soul Urge numbers',
      'Personality & Kua number analysis',
      'Lucky dates & colors guide',
    ],
    color: 'from-gold-400/20 to-gold-500/5',
    borderColor: 'border-gold-400/40',
    popular: true,
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: 999,
    currency: '₹',
    icon: Crown,
    features: [
      'Everything in Premium',
      'Personalized name correction',
      'Yearly numerology predictions',
      'Compatibility with partner/business',
      'Priority expert consultation',
    ],
    color: 'from-purple-500/20 to-purple-600/5',
    borderColor: 'border-purple-500/30',
  },
];

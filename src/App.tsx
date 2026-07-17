import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { NumerologyPage } from './components/NumerologyPage';
import { BabyNamesPage } from './components/BabyNamesPage';
import { Campaign, PricingPlan } from './services/campaignService';

export const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'numerology' | 'babynames'>('landing');
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const campaigns: Campaign[] = [];

  const pricingPlans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Basic numerology tools',
      original_price: 0,
      features: ['Name value calculator', 'Basic Lo Shu grid', 'Daily numerology tip'],
      is_popular: false,
    },
    {
      id: 'basic',
      name: 'Basic',
      description: 'Essential numerology report',
      original_price: 299,
      features: ['Name correction suggestions', 'Birth chart analysis', 'Lucky numbers & colors', 'Email support'],
      is_popular: false,
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Comprehensive numerology suite',
      original_price: 599,
      features: ['Everything in Basic', 'Detailed name correction', '10-year prediction', 'Mobile numerology', 'Priority support'],
      is_popular: true,
    },
    {
      id: 'business',
      name: 'Business',
      description: 'For entrepreneurs & businesses',
      original_price: 1499,
      features: ['Everything in Premium', 'Business name correction', 'Founder compatibility', 'Royal Number alignment', 'Dedicated consultant'],
      is_popular: false,
    },
  ];

  const handleSelectService = (service: string) => {
    if (service === 'babynames') {
      setView('babynames');
    } else {
      setView('numerology');
    }
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
  };

  const handleBack = () => {
    setView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'numerology') {
    return <NumerologyPage onBack={handleBack} />;
  }

  if (view === 'babynames') {
    return <BabyNamesPage onBack={handleBack} />;
  }

  return (
    <LandingPage
      campaigns={campaigns}
      pricingPlans={pricingPlans}
      onSelectService={handleSelectService}
      onSelectPlan={handleSelectPlan}
      onOpenAuth={() => setShowAuth(true)}
      onOpenAdmin={() => setShowAdmin(true)}
    />
  );
};

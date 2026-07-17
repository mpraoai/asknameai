import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { PlanSelection } from './components/PlanSelection';
import { OTPAuthentication } from './components/OTPAuthentication';
import { CheckoutModal } from './components/CheckoutModal';
import { ReportViewer } from './components/ReportViewer';
import { PricingPlan, Campaign } from './services/campaignService';
import { NameAnalysisResult } from './services/numerologyService';

type FlowStep = 'landing' | 'plan_selection' | 'otp_auth' | 'payment' | 'report';

export default function App() {
  const [step, setStep] = useState<FlowStep>('landing');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [nameAnalysis, setNameAnalysis] = useState<NameAnalysisResult | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [userName, setUserName] = useState('');

  const handleNameCheckContinue = (enteredName: string, enteredDob: string, analysis: NameAnalysisResult) => {
    setName(enteredName);
    setDob(enteredDob);
    setNameAnalysis(analysis);
    setStep('plan_selection');
  };

  const handlePlanSelected = (plan: PricingPlan, camp: Campaign | null) => {
    setSelectedPlan(plan);
    setCampaign(camp);
    setStep('otp_auth');
  };

  const handleOtpAuthenticated = (mobile: string, firstName: string, _lastName: string) => {
    setMobileNumber(mobile);
    setUserName(firstName);
    setStep('payment');
  };

  const handlePaymentSuccess = () => {
    setStep('report');
  };

  const handleReportComplete = () => {
    setStep('landing');
    setName('');
    setDob('');
    setNameAnalysis(null);
    setSelectedPlan(null);
  };

  return (
    <>
      {step === 'landing' && (
        <LandingPage onContinue={handleNameCheckContinue} />
      )}

      {step === 'plan_selection' && (
        <PlanSelection
          onSelectPlan={handlePlanSelected}
          onBack={() => setStep('landing')}
        />
      )}

      {step === 'otp_auth' && (
        <OTPAuthentication
          onAuthenticated={handleOtpAuthenticated}
          onBack={() => setStep('plan_selection')}
        />
      )}

      {step === 'payment' && (
        <CheckoutModal
          isOpen={true}
          onClose={() => setStep('plan_selection')}
          onPaymentSuccess={handlePaymentSuccess}
          plan={selectedPlan}
          campaign={campaign}
          userName={userName}
        />
      )}

      {step === 'report' && selectedPlan && (
        <ReportViewer
          name={name}
          dob={dob}
          mobileNumber={mobileNumber}
          planName={selectedPlan.name}
          onComplete={handleReportComplete}
        />
      )}
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PersonData, NumerologyCalculation, NameAnalysis, BabyNameSuggestion } from './types/numerology';
import { Header } from './components/Header';
import { PersonalInfoForm } from './components/PersonalInfoForm';
import { NumerologyResults } from './components/NumerologyResults';
import { NameAnalysis as NameAnalysisComponent } from './components/NameAnalysis';
import { BabyNameSuggestions } from './components/BabyNameSuggestions';
import { AINameGenerator } from './components/AINameGenerator';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { CheckoutModal } from './components/CheckoutModal';
import { NumerologyLogo } from './components/NumerologyLogo';
import FreeCheckForm from './screens/FreeCheckForm';
import CompatibilityReport from './screens/CompatibilityReport';
import PlansPage from './screens/PlansPage';
import NumerologyDashboard from './screens/NumerologyDashboard';
import { calculateDriver, calculateConductor, calculateKua, createLoshuGrid, analyzePlanes } from './utils/numerologyCalculations';
import { getCompatibility } from './utils/compatibility';
import { analyzeNameSpelling, generateNameCorrectionsWithParents, generateCorrectedNamesWithCompleteFormula } from './utils/nameCorrection';
import { generateBabyNameSuggestions } from './utils/babyNames';
import { User, Baby, Calculator, Sparkles, LogOut, ShieldCheck, Home } from 'lucide-react';
import { UserProfile } from './services/authService';
import { getCurrentProfile, signOut } from './services/authService';
import { Campaign, PricingPlan, getActiveCampaigns, getPricingPlans } from './services/campaignService';

type AnalysisType = 'numerology' | 'babynames' | null;
type View = 'landing' | 'app';
type CurrentStep = 'choice' | 'form' | 'results';

function App() {
  const [view, setView] = useState<View>('landing');
  const [currentStep, setCurrentStep] = useState<CurrentStep>('choice');
  const [analysisType, setAnalysisType] = useState<AnalysisType>(null);
  const [personData, setPersonData] = useState<PersonData | null>(null);
  const [numerologyResult, setNumerologyResult] = useState<NumerologyCalculation | null>(null);
  const [nameAnalysis, setNameAnalysis] = useState<NameAnalysis | null>(null);
  const [babyNameSuggestions, setBabyNameSuggestions] = useState<{
    boys: BabyNameSuggestion[];
    girls: BabyNameSuggestion[];
  }>({ boys: [], girls: [] });

  // Auth state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  // Checkout state
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Pending service selection (when user clicks before logging in)
  const [pendingService, setPendingService] = useState<string | null>(null);

  // Campaign & pricing state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);

  useEffect(() => {
    loadCampaignsAndPricing();
    checkExistingSession();
  }, []);

  const loadCampaignsAndPricing = async () => {
    const [activeCampaigns, plans] = await Promise.all([
      getActiveCampaigns(),
      getPricingPlans(),
    ]);
    setCampaigns(activeCampaigns);
    setPricingPlans(plans);
  };

  const checkExistingSession = async () => {
    const profile = await getCurrentProfile();
    if (profile) setUser(profile);
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile);
    setAuthModalOpen(false);
    if (pendingService) {
      setAnalysisType(pendingService as AnalysisType);
      setView('app');
      setCurrentStep('form');
      setPendingService(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setView('landing');
  };

  const handleSelectService = (service: string) => {
    if (!user) {
      setPendingService(service);
      setAuthModalOpen(true);
      return;
    }
    setAnalysisType(service as AnalysisType);
    setView('app');
    setCurrentStep('form');
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    if (!user) {
      setPendingService('numerology');
      setAuthModalOpen(true);
      setCheckoutPlan(plan);
      return;
    }
    setCheckoutPlan(plan);
    setCheckoutOpen(true);
  };

  const handleAnalysisChoice = (type: AnalysisType) => {
    setAnalysisType(type);
    setCurrentStep('form');
  };

  const handleFormSubmit = async (data: PersonData) => {
    setPersonData(data);

    if (analysisType === 'numerology') {
      const driver = calculateDriver(data.dateOfBirth);
      const conductor = calculateConductor(data.dateOfBirth);
      const kua = calculateKua(data.dateOfBirth, data.gender);
      const loshuGrid = createLoshuGrid(data.dateOfBirth, driver, conductor, kua, data.gender);
      const planes = analyzePlanes(loshuGrid);
      const compatibility = getCompatibility(driver, conductor);

      const numerologyCalc: NumerologyCalculation = {
        driver,
        conductor,
        kua,
        loshuGrid,
        planes,
        compatibility
      };
      setNumerologyResult(numerologyCalc);

      const nameAnalysisResult = analyzeNameSpelling(
        data.name,
        data.surname,
        driver,
        conductor,
        loshuGrid
      );

      if (data.fatherInitial || data.motherInitial) {
        const correctedNamesWithParents = generateNameCorrectionsWithParents(
          data.name,
          data.surname,
          driver,
          conductor,
          loshuGrid,
          data.fatherInitial,
          data.motherInitial
        );
        nameAnalysisResult.correctedNames = correctedNamesWithParents;
      } else {
        const basicCorrections = generateCorrectedNamesWithCompleteFormula(
          data.name,
          data.surname,
          driver,
          conductor,
          loshuGrid
        );
        nameAnalysisResult.correctedNames = basicCorrections;
      }

      setNameAnalysis(nameAnalysisResult);
    } else if (analysisType === 'babynames') {
      const driver = calculateDriver(data.dateOfBirth);
      const conductor = calculateConductor(data.dateOfBirth);
      const kua = calculateKua(data.dateOfBirth, data.gender);
      const loshuGrid = createLoshuGrid(data.dateOfBirth, driver, conductor, kua, data.gender);

      const numerologyCalc: NumerologyCalculation = {
        driver,
        conductor,
        kua,
        loshuGrid,
        planes: analyzePlanes(loshuGrid),
        compatibility: getCompatibility(driver, conductor)
      };
      setNumerologyResult(numerologyCalc);

      const boysSuggestions = await generateBabyNameSuggestions(
        'male',
        data.religion || 'hindu',
        driver,
        conductor,
        loshuGrid,
        data.name,
        data.surname
      );
      const girlsSuggestions = await generateBabyNameSuggestions(
        'female',
        data.religion || 'hindu',
        driver,
        conductor,
        loshuGrid,
        data.name,
        data.surname
      );

      setBabyNameSuggestions({
        boys: boysSuggestions,
        girls: girlsSuggestions
      });
    }

    setCurrentStep('results');
  };

  const handleStartOver = () => {
    setCurrentStep('choice');
    setAnalysisType(null);
    setPersonData(null);
    setNumerologyResult(null);
    setNameAnalysis(null);
    setBabyNameSuggestions({ boys: [], girls: [] });
  };

  const handleBackToLanding = () => {
    setView('landing');
    handleStartOver();
  };

  const renderAnalysisChoice = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <button
          onClick={handleBackToLanding}
          className="text-indigo-600 hover:text-indigo-800 font-medium mb-6 inline-flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Choose Your Analysis</h2>
        <p className="text-lg text-gray-600">Select the type of numerological analysis you need</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div
          onClick={() => handleAnalysisChoice('numerology')}
          className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-transparent hover:border-indigo-200"
        >
          <div className="text-center">
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Calculator className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Date of Birth & Name Analysis</h3>
            <p className="text-gray-600 mb-6">
              Complete numerological analysis including Lo Shu grid, Driver-Conductor compatibility,
              and name spelling correction based on Chaldean numerology.
            </p>
            <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
              <li>• Driver, Conductor & Kua Number calculation</li>
              <li>• Lo Shu Grid with 8 Planes analysis</li>
              <li>• Name spelling correction recommendations</li>
              <li>• Career compatibility analysis</li>
            </ul>
            <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all">
              Analyze My Numerology
            </button>
          </div>
        </div>

        <div
          onClick={() => handleAnalysisChoice('babynames')}
          className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-transparent hover:border-pink-200"
        >
          <div className="text-center">
            <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Baby className="w-10 h-10 text-pink-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Baby Name Suggestions</h3>
            <p className="text-gray-600 mb-6">
              Get numerologically perfect baby name suggestions based on your birth details
              and religious preferences for maximum auspiciousness.
            </p>
            <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
              <li>• Religion-specific name suggestions</li>
              <li>• Numerologically auspicious names only</li>
              <li>• Names compatible with your numerology</li>
              <li>• Separate suggestions for boys & girls</li>
            </ul>
            <button className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold py-3 px-6 rounded-lg transition-all">
              Get Baby Names
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Landing Page View
  if (view === 'landing') {
    return (
      <>
        <Routes>
          <Route path="/" element={
            <>
              <LandingPage
                campaigns={campaigns}
                pricingPlans={pricingPlans}
                onSelectService={handleSelectService}
                onSelectPlan={handleSelectPlan}
                onOpenAuth={() => setAuthModalOpen(true)}
                onOpenAdmin={() => setAdminPanelOpen(true)}
              />
              <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                onAuthSuccess={handleAuthSuccess}
              />
              <AdminPanel
                isOpen={adminPanelOpen}
                onClose={() => setAdminPanelOpen(false)}
              />
              <CheckoutModal
                isOpen={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                plan={checkoutPlan}
                campaigns={campaigns}
                userEmail={user?.email}
                userName={user ? `${user.first_name} ${user.last_name}` : undefined}
              />
            </>
          } />
          <Route path="/free-check" element={<FreeCheckForm />} />
          <Route path="/report/:data" element={<CompatibilityReport />} />
          <Route path="/plans/:data" element={<PlansPage />} />
          <Route path="/numerology/:data" element={<NumerologyDashboard />} />
        </Routes>
      </>
    );
  }

  // App View (existing numerology screens)
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Top bar with user info and navigation */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <NumerologyLogo size="md" variant="dark" onClick={handleBackToLanding} />

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Hi, {user.first_name}</span>
                  {user.is_admin && (
                    <button
                      onClick={() => setAdminPanelOpen(true)}
                      className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold hover:bg-indigo-100 transition-all"
                    >
                      Admin Panel
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Header />

      <main className="container mx-auto px-4 py-8">
        {currentStep === 'choice' && renderAnalysisChoice()}

        {currentStep === 'form' && (
          <div>
            <div className="text-center mb-6 flex items-center justify-center gap-6">
              <button
                onClick={handleBackToLanding}
                className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setCurrentStep('choice')}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ← Back to Analysis Choice
              </button>
            </div>
            <PersonalInfoForm onSubmit={handleFormSubmit} analysisType={analysisType!} />
          </div>
        )}

        {currentStep === 'results' && personData && numerologyResult && (
          <div className="space-y-8">
            <div className="text-center flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleBackToLanding}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all inline-flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </button>
              <button
                onClick={handleStartOver}
                className="bg-white border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-6 py-2 rounded-lg transition-all"
              >
                Start New Analysis
              </button>
              <button
                onClick={() => setCurrentStep('choice')}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-2 rounded-lg transition-all"
              >
                Choose Different Analysis
              </button>
            </div>

            {analysisType === 'numerology' && (
              <>
                <NumerologyResults
                  person={personData}
                  calculation={numerologyResult}
                />

                {nameAnalysis && (
                  <NameAnalysisComponent
                    analysis={nameAnalysis}
                    originalFirstName={personData.name}
                    originalLastName={personData.surname}
                    driver={numerologyResult.driver}
                    conductor={numerologyResult.conductor}
                  />
                )}
              </>
            )}

            {analysisType === 'babynames' && (
              <div className="space-y-8">
                <NumerologyResults
                  person={personData}
                  calculation={numerologyResult}
                />

                <div className="grid lg:grid-cols-2 gap-8">
                  <BabyNameSuggestions
                    suggestions={babyNameSuggestions.boys}
                    gender="male"
                    religion={personData.religion || 'hindu'}
                    driver={numerologyResult.driver}
                    conductor={numerologyResult.conductor}
                    providedName={personData.name}
                    providedLastName={personData.surname}
                  />
                  <BabyNameSuggestions
                    suggestions={babyNameSuggestions.girls}
                    gender="female"
                    religion={personData.religion || 'hindu'}
                    driver={numerologyResult.driver}
                    conductor={numerologyResult.conductor}
                    providedName={personData.name}
                    providedLastName={personData.surname}
                  />
                </div>

                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">AI-Powered Name Generation</h2>
                    <p className="text-gray-600">Generate unlimited auspicious names using advanced AI with numerological precision</p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    <AINameGenerator
                      gender="male"
                      religion={personData.religion || 'hindu'}
                      driver={numerologyResult.driver}
                      conductor={numerologyResult.conductor}
                      targetNumbers={
                        Object.values(numerologyResult.loshuGrid)
                          .flat()
                          .filter((num, idx, arr) => arr.indexOf(num) === idx && num > 0)
                          .filter(num => ![numerologyResult.loshuGrid.flat()[0]].includes(num))
                          .slice(0, 4)
                      }
                      loshuGrid={numerologyResult.loshuGrid}
                      providedLastName={personData.surname}
                    />
                    <AINameGenerator
                      gender="female"
                      religion={personData.religion || 'hindu'}
                      driver={numerologyResult.driver}
                      conductor={numerologyResult.conductor}
                      targetNumbers={
                        Object.values(numerologyResult.loshuGrid)
                          .flat()
                          .filter((num, idx, arr) => arr.indexOf(num) === idx && num > 0)
                          .filter(num => ![numerologyResult.loshuGrid.flat()[0]].includes(num))
                          .slice(0, 4)
                      }
                      loshuGrid={numerologyResult.loshuGrid}
                      providedLastName={personData.surname}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-300">
            © 2025 AskNameAI - Ancient Wisdom Meets Modern Technology
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Based on authentic Chaldean numerology and Lo Shu grid methodology
          </p>
        </div>
      </footer>

      <AdminPanel
        isOpen={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
      />
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        plan={checkoutPlan}
        campaigns={campaigns}
        userEmail={user?.email}
        userName={user ? `${user.first_name} ${user.last_name}` : undefined}
      />
    </div>
  );
}

export default App;

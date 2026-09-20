import React, { useEffect, useState } from 'react';
import { Home, Calculator, Baby, Smartphone, Moon, Sparkles as YantraIcon, ArrowLeft, Star, Building2, Globe } from 'lucide-react';
import { ExtendedNumerologyTool } from './ExtendedNumerologyTool';
import { PersonData, NumerologyCalculation, NameAnalysis, BabyNameSuggestion } from '../types/numerology';
import { PersonalInfoForm } from './PersonalInfoForm';
import { NumerologyResults } from './NumerologyResults';
import { NameAnalysis as NameAnalysisComponent } from './NameAnalysis';
import { BabyNameSuggestions } from './BabyNameSuggestions';
import { AINameGenerator } from './AINameGenerator';
import { AINameGeneratorV2 } from './AINameGeneratorV2';
import { calculateDriver, calculateConductor, calculateKua, createLoshuGrid, analyzePlanes } from '../utils/numerologyCalculations';
import { getCompatibility } from '../utils/compatibility';
import { analyzeNameSpelling, generateNameCorrectionsWithParents, generateCorrectedNamesWithCompleteFormula } from '../utils/nameCorrection';
import { generateBabyNameSuggestions } from '../utils/babyNames';
import { Lead } from '../services/numerologistService';
import { getReportsForLead } from '../services/reportsService';
import { getCustomerPlan, CustomerPayment } from '../services/customerPlanService';
import { formatMoney } from '../utils/locale';

export type NumerologyToolId = 'name_correction' | 'baby_names' | 'mobile_numerology' | 'business_numerology' | 'domain_numerology' | 'astrology' | 'yantras';

interface NumerologyToolsPanelProps {
  tool: NumerologyToolId;
  contextLead: Lead | null;
  currencyCode: string;
  onHome: () => void;
  onClearContext: () => void;
}

export const NUMEROLOGY_TOOLS: { id: NumerologyToolId; label: string; icon: React.ElementType; built: boolean }[] = [
  { id: 'name_correction', label: 'Name Correction', icon: Calculator, built: true },
  { id: 'baby_names', label: 'Baby Name Suggestion', icon: Baby, built: true },
  { id: 'mobile_numerology', label: 'Mobile Numerology', icon: Smartphone, built: true },
  { id: 'business_numerology', label: 'Business Name Numerology', icon: Building2, built: true },
  { id: 'domain_numerology', label: 'Domain Name Numerology', icon: Globe, built: true },
  { id: 'astrology', label: 'Astrology', icon: Moon, built: false },
  { id: 'yantras', label: 'Yantras', icon: YantraIcon, built: false },
];

const EXTENDED_TOOL_IDS: NumerologyToolId[] = ['mobile_numerology', 'business_numerology', 'domain_numerology'];

/**
 * The same numerology engine customers use (src/lib/numerology.ts via the
 * existing components/utils), reused as-is inside the numerologist's own
 * workspace so they can run it for a specific lead. Nothing here touches
 * the protected numerology.ts, agents/, or razorpay-payment - it only
 * imports and re-renders the existing, already-working components.
 */
export const NumerologyToolsPanel: React.FC<NumerologyToolsPanelProps> = ({ tool, contextLead, currencyCode, onHome, onClearContext }) => {
  const [step, setStep] = useState<'form' | 'results'>('form');
  const [personData, setPersonData] = useState<PersonData | null>(null);
  const [numerologyResult, setNumerologyResult] = useState<NumerologyCalculation | null>(null);
  const [nameAnalysis, setNameAnalysis] = useState<NameAnalysis | null>(null);
  const [babyNames, setBabyNames] = useState<{ boys: BabyNameSuggestion[]; girls: BabyNameSuggestion[] }>({ boys: [], girls: [] });
  const [generating, setGenerating] = useState(false);
  const [customerPlan, setCustomerPlan] = useState<CustomerPayment | null | 'loading'>(null);
  const [prefill, setPrefill] = useState<Partial<PersonData>>({});

  useEffect(() => {
    setStep('form');
    setPersonData(null);
    setNumerologyResult(null);
    setNameAnalysis(null);
    setBabyNames({ boys: [], girls: [] });
  }, [tool]);

  useEffect(() => {
    if (!contextLead) {
      setCustomerPlan(null);
      setPrefill({});
      return;
    }
    setCustomerPlan('loading');
    (async () => {
      const [plan, reports] = await Promise.all([
        getCustomerPlan(contextLead.mobile_number, contextLead.email),
        getReportsForLead(contextLead.id),
      ]);
      setCustomerPlan(plan);
      const latestReport = reports[0];
      setPrefill({
        name: contextLead.first_name || '',
        surname: contextLead.last_name || '',
        dateOfBirth: latestReport?.dob || '',
        gender: (latestReport?.gender as 'male' | 'female') || 'male',
      });
    })();
  }, [contextLead]);

  const targetNumbers = (result: NumerologyCalculation) =>
    Object.values(result.loshuGrid)
      .flat()
      .filter((num, idx, arr) => arr.indexOf(num) === idx && num > 0)
      .filter((num) => ![result.loshuGrid.flat()[0]].includes(num))
      .slice(0, 4);

  const handleSubmit = async (data: PersonData) => {
    setPersonData(data);
    setGenerating(true);

    const driver = calculateDriver(data.dateOfBirth);
    const conductor = calculateConductor(data.dateOfBirth);
    const kua = calculateKua(data.dateOfBirth, data.gender);
    const loshuGrid = createLoshuGrid(data.dateOfBirth, driver, conductor, kua, data.gender);
    const calc: NumerologyCalculation = {
      driver, conductor, kua, loshuGrid,
      planes: analyzePlanes(loshuGrid),
      compatibility: getCompatibility(driver, conductor),
    };
    setNumerologyResult(calc);

    if (tool === 'name_correction') {
      const analysis = analyzeNameSpelling(data.name, data.surname, driver, conductor, loshuGrid);
      analysis.correctedNames = data.fatherInitial || data.motherInitial
        ? generateNameCorrectionsWithParents(data.name, data.surname, driver, conductor, loshuGrid, data.fatherInitial, data.motherInitial)
        : generateCorrectedNamesWithCompleteFormula(data.name, data.surname, driver, conductor, loshuGrid);
      setNameAnalysis(analysis);
    } else if (tool === 'baby_names') {
      const [boys, girls] = await Promise.all([
        generateBabyNameSuggestions('male', data.religion || 'hindu', driver, conductor, loshuGrid, data.name, data.surname),
        generateBabyNameSuggestions('female', data.religion || 'hindu', driver, conductor, loshuGrid, data.name, data.surname),
      ]);
      setBabyNames({ boys, girls });
    }

    setGenerating(false);
    setStep('results');
  };

  const activeToolMeta = NUMEROLOGY_TOOLS.find((t) => t.id === tool)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={onHome} className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1.5">
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>
        {contextLead && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
            <span className="text-xs text-indigo-700">
              Working with <b>{contextLead.first_name} {contextLead.last_name}</b>
            </span>
            {customerPlan === 'loading' ? (
              <span className="text-[10px] text-indigo-400">checking plan...</span>
            ) : customerPlan ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                <Star className="w-2.5 h-2.5" />
                {customerPlan.plan_name} · {formatMoney(customerPlan.amount / 100, customerPlan.currency)}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400">no purchased plan found</span>
            )}
            <button onClick={onClearContext} className="text-indigo-400 hover:text-indigo-700 text-xs">
              &times;
            </button>
          </div>
        )}
      </div>

      {!activeToolMeta.built ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center border-2 border-dashed border-gray-200">
          <activeToolMeta.icon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">{activeToolMeta.label} — Coming Soon</p>
          <p className="text-sm text-gray-400 mt-1">Not built yet — Name Correction and Baby Name Suggestion are live today.</p>
        </div>
      ) : EXTENDED_TOOL_IDS.includes(tool) ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <ExtendedNumerologyTool tool={tool as 'mobile_numerology' | 'business_numerology' | 'domain_numerology'} />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          {step === 'form' && (
            <PersonalInfoForm
              onSubmit={handleSubmit}
              analysisType={tool === 'name_correction' ? 'numerology' : 'babynames'}
              initialData={prefill}
            />
          )}

          {step === 'results' && personData && numerologyResult && (
            <div className="space-y-8">
              <button onClick={() => setStep('form')} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                Edit details
              </button>

              <NumerologyResults person={personData} calculation={numerologyResult} />

              {tool === 'name_correction' && nameAnalysis && (
                <NameAnalysisComponent
                  analysis={nameAnalysis}
                  originalFirstName={personData.name}
                  originalLastName={personData.surname}
                  driver={numerologyResult.driver}
                  conductor={numerologyResult.conductor}
                />
              )}

              {tool === 'baby_names' && (
                <div className="space-y-8">
                  <div className="grid lg:grid-cols-2 gap-8">
                    <BabyNameSuggestions
                      suggestions={babyNames.boys}
                      gender="male"
                      religion={personData.religion || 'hindu'}
                      driver={numerologyResult.driver}
                      conductor={numerologyResult.conductor}
                      providedName={personData.name}
                      providedLastName={personData.surname}
                    />
                    <BabyNameSuggestions
                      suggestions={babyNames.girls}
                      gender="female"
                      religion={personData.religion || 'hindu'}
                      driver={numerologyResult.driver}
                      conductor={numerologyResult.conductor}
                      providedName={personData.name}
                      providedLastName={personData.surname}
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">AI-Powered Name Generation</h3>
                    <div className="grid lg:grid-cols-2 gap-8">
                      <AINameGenerator gender="male" religion={personData.religion || 'hindu'} driver={numerologyResult.driver} conductor={numerologyResult.conductor} targetNumbers={targetNumbers(numerologyResult)} loshuGrid={numerologyResult.loshuGrid} providedLastName={personData.surname} />
                      <AINameGenerator gender="female" religion={personData.religion || 'hindu'} driver={numerologyResult.driver} conductor={numerologyResult.conductor} targetNumbers={targetNumbers(numerologyResult)} loshuGrid={numerologyResult.loshuGrid} providedLastName={personData.surname} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Fast Engine (Beta)</h3>
                    <div className="grid lg:grid-cols-2 gap-8">
                      <AINameGeneratorV2 gender="male" religion={personData.religion || 'hindu'} driver={numerologyResult.driver} conductor={numerologyResult.conductor} targetNumbers={targetNumbers(numerologyResult)} loshuGrid={numerologyResult.loshuGrid} providedLastName={personData.surname} />
                      <AINameGeneratorV2 gender="female" religion={personData.religion || 'hindu'} driver={numerologyResult.driver} conductor={numerologyResult.conductor} targetNumbers={targetNumbers(numerologyResult)} loshuGrid={numerologyResult.loshuGrid} providedLastName={personData.surname} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {generating && <p className="text-sm text-gray-400 text-center py-4">Generating...</p>}
        </div>
      )}
    </div>
  );
};

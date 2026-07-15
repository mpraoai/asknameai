import React, { useState } from 'react';
import { Check, ArrowRight, ArrowLeft, FileText, Smartphone, Baby, Star, TriangleAlert as AlertTriangle, Sparkles, Grid2x2 as Grid, User, Calendar } from 'lucide-react';
import {
  analyzeName, analyzeMobileNumber, calculateMulank, calculateBhagyank,
  calculateLoShuGrid, getNumberInfo, generateBabyNameSuggestions,
  NameAnalysisResult, MobileAnalysisResult, BabyNameSuggestion,
} from '../services/numerologyService';

interface ReportViewerProps {
  name: string;
  dob: string;
  mobileNumber?: string;
  planName: string;
  onComplete: () => void;
}

type ReportSection = 'name_correction' | 'mobile_numerology' | 'baby_names';

const SECTIONS: { id: ReportSection; title: string; icon: React.ReactNode; description: string }[] = [
  { id: 'name_correction', title: 'Name Correction Report', icon: <FileText className="w-5 h-5" />, description: 'Complete Chaldean name analysis & correction' },
  { id: 'mobile_numerology', title: 'Mobile Number Numerology', icon: <Smartphone className="w-5 h-5" />, description: 'Mobile number compatibility & alignment check' },
  { id: 'baby_names', title: 'Baby Name Suggestions', icon: <Baby className="w-5 h-5" />, description: 'Numerology-aligned baby name suggestions' },
];

export const ReportViewer: React.FC<ReportViewerProps> = ({ name, dob, mobileNumber, planName, onComplete }) => {
  const [activeSection, setActiveSection] = useState<ReportSection>('name_correction');
  const [mobileNum, setMobileNum] = useState(mobileNumber || '');
  const [mobileAnalysis, setMobileAnalysis] = useState<MobileAnalysisResult | null>(null);
  const [mobileChecked, setMobileChecked] = useState(false);
  const [babyGender, setBabyGender] = useState<'male' | 'female' | 'unisex'>('male');
  const [babyTargetNumber, setBabyTargetNumber] = useState<number>(1);
  const [babyNames, setBabyNames] = useState<BabyNameSuggestion[]>([]);
  const [babyChecked, setBabyChecked] = useState(false);

  const nameAnalysis: NameAnalysisResult = analyzeName(name);
  const mulank = calculateMulank(dob);
  const bhagyank = calculateBhagyank(dob);
  const loShuGrid = calculateLoShuGrid(dob);
  const mulankInfo = getNumberInfo(mulank);
  const bhagyankInfo = getNumberInfo(bhagyank);

  const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
  const isLastSection = currentIndex === SECTIONS.length - 1;

  const checkMobile = () => {
    if (mobileNum.replace(/[^0-9]/g, '').length < 10) return;
    setMobileAnalysis(analyzeMobileNumber(mobileNum, dob));
    setMobileChecked(true);
  };

  const generateBabyNames = () => {
    setBabyNames(generateBabyNameSuggestions(babyTargetNumber, babyGender, 10));
    setBabyChecked(true);
  };

  const goNext = () => {
    if (isLastSection) { onComplete(); }
    else { setActiveSection(SECTIONS[currentIndex + 1].id); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const goPrev = () => {
    if (currentIndex > 0) { setActiveSection(SECTIONS[currentIndex - 1].id); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Check className="w-4 h-4" /> Payment Complete - {planName}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Complete Numerology Report</h1>
          <p className="text-gray-500">Follow the sections below in sequence</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
          {SECTIONS.map((section, i) => (
            <React.Fragment key={section.id}>
              <button onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeSection === section.id ? 'bg-brand-600 text-white shadow-lg'
                  : i < currentIndex ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {i < currentIndex && <Check className="w-4 h-4" />}
                {i >= currentIndex && section.icon}
                <span>{i + 1}. {section.title}</span>
              </button>
              {i < SECTIONS.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-fade-in">
          {activeSection === 'name_correction' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-brand-600" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Name Correction Report</h2>
                  <p className="text-gray-500 text-sm">Complete Chaldean numerology analysis</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-brand-50 rounded-xl p-4 text-center">
                  <User className="w-5 h-5 text-brand-400 mx-auto mb-2" />
                  <div className="text-xs text-gray-500">Name</div>
                  <div className="font-bold text-gray-900 text-sm">{name}</div>
                </div>
                <div className="bg-brand-50 rounded-xl p-4 text-center">
                  <Calendar className="w-5 h-5 text-brand-400 mx-auto mb-2" />
                  <div className="text-xs text-gray-500">Mulank</div>
                  <div className="font-bold text-brand-600 text-lg">{mulank}</div>
                </div>
                <div className="bg-brand-50 rounded-xl p-4 text-center">
                  <Star className="w-5 h-5 text-brand-400 mx-auto mb-2" />
                  <div className="text-xs text-gray-500">Bhagyank</div>
                  <div className="font-bold text-brand-600 text-lg">{bhagyank}</div>
                </div>
                <div className="bg-brand-50 rounded-xl p-4 text-center">
                  <Sparkles className="w-5 h-5 text-brand-400 mx-auto mb-2" />
                  <div className="text-xs text-gray-500">Name Number</div>
                  <div className="font-bold text-brand-600 text-lg">{nameAnalysis.nameNumber}</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl p-6 border border-brand-100">
                <h3 className="font-bold text-gray-900 mb-3">Ruling Planet & Traits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Ruling Planet</div>
                    <div className="text-lg font-bold text-brand-600">{nameAnalysis.planet}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Key Traits</div>
                    <div className="flex flex-wrap gap-2">
                      {nameAnalysis.traits.map((trait, i) => (
                        <span key={i} className="bg-white px-3 py-1 rounded-full text-xs text-gray-700 border border-gray-200">{trait}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Letter-by-Letter Chaldean Values</h3>
                <div className="flex flex-wrap gap-2">
                  {nameAnalysis.letterValues.map((lv, i) => (
                    <div key={i} className="bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                      <span className="font-bold text-brand-600 text-lg">{lv.letter}</span>
                      <span className="text-gray-400 mx-1">=</span>
                      <span className="text-gray-700 font-medium">{lv.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  Compound Number: <span className="font-bold text-brand-600">{nameAnalysis.compoundNumber}</span>
                  {' → '}Reduced to: <span className="font-bold text-brand-600">{nameAnalysis.nameNumber}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Grid className="w-5 h-5 text-brand-600" /> Lo Shu Grid (from DOB)</h3>
                <div className="inline-block">
                  <div className="grid grid-cols-3 gap-1 bg-gray-200 p-1 rounded-xl">
                    {[4, 9, 2, 3, 5, 7, 8, 1, 6].map((label, i) => {
                      const r = Math.floor(i / 3);
                      const c = i % 3;
                      const count = loShuGrid[r][c];
                      return (
                        <div key={i} className="bg-white w-20 h-20 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-xs text-gray-400">{label}</span>
                          <span className={`text-xl font-bold ${count > 0 ? 'text-brand-600' : 'text-gray-200'}`}>
                            {count > 0 ? Array(count).fill(label).join('') : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border-2 border-brand-100 rounded-2xl p-5">
                  <h4 className="font-bold text-gray-900 mb-2">Mulank (Driver) - {mulank}</h4>
                  <div className="text-sm text-gray-600 mb-2">Planet: <span className="font-medium">{mulankInfo.planet}</span></div>
                  <div className="flex flex-wrap gap-1">
                    {mulankInfo.traits.map((t, i) => <span key={i} className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-full">{t}</span>)}
                  </div>
                </div>
                <div className="bg-white border-2 border-purple-100 rounded-2xl p-5">
                  <h4 className="font-bold text-gray-900 mb-2">Bhagyank (Destiny) - {bhagyank}</h4>
                  <div className="text-sm text-gray-600 mb-2">Planet: <span className="font-medium">{bhagyankInfo.planet}</span></div>
                  <div className="flex flex-wrap gap-1">
                    {bhagyankInfo.traits.map((t, i) => <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">{t}</span>)}
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-5 border-2 ${nameAnalysis.isFavorable ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-start gap-3">
                  {nameAnalysis.isFavorable ? <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{nameAnalysis.isFavorable ? 'Name is Favorable' : 'Name Needs Correction'}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{nameAnalysis.suggestion}</p>
                    <div className="mt-3 text-sm text-gray-600"><span className="font-medium">Lucky colors:</span> {nameAnalysis.luckyColors.join(', ')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'mobile_numerology' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center"><Smartphone className="w-6 h-6 text-brand-600" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Mobile Number Numerology</h2>
                  <p className="text-gray-500 text-sm">Check your mobile number compatibility</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter your mobile number</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-3 bg-gray-200 rounded-xl text-gray-700 font-medium">+91</span>
                    <input type="tel" value={mobileNum} onChange={(e) => { setMobileNum(e.target.value); setMobileChecked(false); }}
                      placeholder="98765 43210" maxLength={10}
                      className="w-48 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all" />
                  </div>
                  <button onClick={checkMobile} disabled={mobileNum.replace(/[^0-9]/g, '').length < 10}
                    className="bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-700 transition-all disabled:opacity-50">Check</button>
                </div>
              </div>

              {mobileChecked && mobileAnalysis && (
                <div className="animate-fade-in-up space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-brand-50 rounded-xl p-4 text-center">
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="text-xl font-bold text-brand-600">{mobileAnalysis.total}</div>
                    </div>
                    <div className="bg-brand-50 rounded-xl p-4 text-center">
                      <div className="text-xs text-gray-500">Reduced</div>
                      <div className="text-xl font-bold text-brand-600">{mobileAnalysis.reducedNumber}</div>
                    </div>
                    <div className="bg-brand-50 rounded-xl p-4 text-center">
                      <div className="text-xs text-gray-500">Planet</div>
                      <div className="text-lg font-bold text-gray-900">{mobileAnalysis.planet}</div>
                    </div>
                  </div>

                  <div className={`rounded-2xl p-5 border-2 ${mobileAnalysis.isFavorable ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-start gap-3">
                      {mobileAnalysis.isFavorable ? <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">{mobileAnalysis.isFavorable ? 'Mobile Number is Compatible' : 'Mobile Number Needs Alignment'}</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{mobileAnalysis.recommendation}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Digit Frequency Analysis</h4>
                    <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div key={i} className={`rounded-lg p-2 text-center ${mobileAnalysis.digitCount[i] > 0 ? 'bg-brand-50' : 'bg-gray-100'}`}>
                          <div className="text-xs text-gray-500">{i}</div>
                          <div className={`font-bold ${mobileAnalysis.digitCount[i] > 0 ? 'text-brand-600' : 'text-gray-300'}`}>{mobileAnalysis.digitCount[i]}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {mobileAnalysis.missingDigits.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-4">
                      <div className="text-sm font-semibold text-amber-800 mb-1">Missing Digits</div>
                      <div className="text-sm text-amber-700">{mobileAnalysis.missingDigits.join(', ')}</div>
                    </div>
                  )}
                  {mobileAnalysis.repeatedDigits.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="text-sm font-semibold text-blue-800 mb-1">Repeated Digits</div>
                      <div className="text-sm text-blue-700">{mobileAnalysis.repeatedDigits.join(', ')}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSection === 'baby_names' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center"><Baby className="w-6 h-6 text-brand-600" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Baby Name Suggestions</h2>
                  <p className="text-gray-500 text-sm">Numerology-aligned names for your baby</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                    <select value={babyGender} onChange={(e) => { setBabyGender(e.target.value as any); setBabyChecked(false); }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 outline-none transition-all bg-white">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Target Numerology Number</label>
                    <select value={babyTargetNumber} onChange={(e) => { setBabyTargetNumber(parseInt(e.target.value)); setBabyChecked(false); }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 outline-none transition-all bg-white">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <option key={n} value={n}>Number {n} ({getNumberInfo(n).planet})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={generateBabyNames} className="w-full bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-all">
                  Generate Baby Names
                </button>
              </div>

              {babyChecked && babyNames.length > 0 && (
                <div className="animate-fade-in-up">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {babyNames.map((baby, i) => (
                      <div key={i} className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-brand-300 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{baby.name}</h4>
                          <span className="bg-brand-100 text-brand-700 text-sm font-bold px-3 py-1 rounded-full">#{baby.numerologyValue}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{baby.meaning}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-medium text-gray-700">{baby.compatibilityScore}% match</span>
                          </div>
                          <span className="text-xs text-gray-400 capitalize">{baby.gender}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {babyChecked && babyNames.length === 0 && (
                <div className="text-center py-8 text-gray-500">No names found for this combination. Try a different number or gender.</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button onClick={goPrev} disabled={currentIndex === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all disabled:opacity-40">
            <ArrowLeft className="w-5 h-5" /> Previous
          </button>
          <div className="text-sm text-gray-500">Section {currentIndex + 1} of {SECTIONS.length}</div>
          <button onClick={goNext}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all">
            {isLastSection ? 'Finish Report' : 'Next Section'} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

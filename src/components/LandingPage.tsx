import React, { useState } from 'react';
import { Sparkles, Search, Loader as Loader2, CircleAlert as AlertCircle, ArrowRight, Star, Shield, Check, TrendingUp, Baby, Smartphone, FileText, Zap, Award, Heart } from 'lucide-react';
import { analyzeName, NameAnalysisResult } from '../services/numerologyService';

interface LandingPageProps {
  onContinue: (name: string, dob: string, analysis: NameAnalysisResult) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onContinue }) => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<NameAnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!dob) {
      setError('Please enter your date of birth');
      return;
    }

    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const result = analyzeName(name);
    setAnalysis(result);
    setLoading(false);

    setTimeout(() => {
      document.getElementById('name-preview')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AskName<span className="text-brand-600">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How It Works</a>
            <a href="#plans" className="hover:text-brand-600 transition-colors">Plans</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Headline + Form */}
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
                <Zap className="w-4 h-4" />
                Powered by Chaldean Numerology
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
                Discover Your Name's <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">Hidden Power</span>
              </h1>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                Get a free instant name numerology preview. Unlock complete name correction, mobile number analysis, and baby name suggestions.
              </p>

              {/* Free Name Check Form */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Your Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                      placeholder="e.g., Rahul Kumar Sharma"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-gray-900"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  <button
                    onClick={handleCheck}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold py-4 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Search className="w-5 h-5" /> Start Free Name Check</>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-6 text-sm text-gray-400">
                <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Secure & Private</div>
                <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> Instant Results</div>
                <div className="flex items-center gap-2"><Award className="w-4 h-4" /> 10,000+ Checks</div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="hidden lg:block relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-purple-600 rounded-3xl blur-2xl opacity-20" />
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Star className="w-10 h-10 text-white fill-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Chaldean Numerology</h3>
                    <p className="text-sm text-gray-500 mt-1">Ancient wisdom, modern insights</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { icon: <FileText className="w-5 h-5 text-brand-600" />, label: 'Name Correction', desc: 'Align your name for success' },
                      { icon: <Smartphone className="w-5 h-5 text-brand-600" />, label: 'Mobile Numerology', desc: 'Check number compatibility' },
                      { icon: <Baby className="w-5 h-5 text-brand-600" />, label: 'Baby Name Suggestions', desc: 'Find the perfect name' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          {item.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{item.label}</div>
                          <div className="text-xs text-gray-500">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Name Check Preview Result */}
      {analysis && (
        <section id="name-preview" className="py-16 px-4 bg-gradient-to-br from-brand-50 to-purple-50 animate-fade-in-up">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-brand-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Your Name Analysis Preview</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  analysis.isFavorable ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {analysis.isFavorable ? 'Favorable' : 'Needs Correction'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-brand-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Name Number</div>
                  <div className="text-3xl font-bold text-brand-600">{analysis.nameNumber}</div>
                </div>
                <div className="bg-brand-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Ruling Planet</div>
                  <div className="text-xl font-bold text-gray-900">{analysis.planet}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">Key Traits</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.traits.map((trait, i) => (
                    <span key={i} className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-medium">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="text-sm text-gray-600 leading-relaxed">{analysis.suggestion}</div>
              </div>

              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-700 mb-2">Letter Values</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.letterValues.map((lv, i) => (
                    <div key={i} className="bg-gray-50 px-2 py-1 rounded-lg text-xs border border-gray-200">
                      <span className="font-bold text-brand-600">{lv.letter}</span>
                      <span className="text-gray-400 mx-1">=</span>
                      <span className="text-gray-700">{lv.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    This is a preview. To see your complete name correction report, mobile number analysis, and baby name suggestions, select a plan below.
                  </div>
                </div>
              </div>

              <button
                onClick={() => onContinue(name, dob, analysis)}
                className="w-full bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold py-4 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                View Plans & Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything You Get</h2>
            <p className="text-gray-500 text-lg">Complete numerology insights in one platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <FileText className="w-6 h-6" />, title: 'Name Correction', desc: 'Full Chaldean name analysis with letter-by-letter breakdown, compound numbers, and correction suggestions.' },
              { icon: <Smartphone className="w-6 h-6" />, title: 'Mobile Numerology', desc: 'Check if your mobile number aligns with your birth numbers. Get compatibility scores and recommendations.' },
              { icon: <Baby className="w-6 h-6" />, title: 'Baby Name Suggestions', desc: 'Generate numerology-aligned baby names with meanings, compatibility scores, and gender options.' },
            ].map((feat, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 mb-4">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 text-lg">Simple 4-step process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Free Name Check', desc: 'Enter your name & DOB for instant preview', icon: <Search className="w-5 h-5" /> },
              { num: '2', title: 'Choose a Plan', desc: 'Select from our numerology report plans', icon: <Star className="w-5 h-5" /> },
              { num: '3', title: 'OTP Login & Pay', desc: 'Secure login with mobile OTP & pay', icon: <Shield className="w-5 h-5" /> },
              { num: '4', title: 'View Full Report', desc: 'Access complete reports sequentially', icon: <Check className="w-5 h-5" /> },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-brand-600 rounded-full flex items-center justify-center text-xs font-bold text-brand-600">
                    {step.num}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">AskNAMEAI</span>
          </div>
          <p className="text-sm text-gray-400">Powered by Chaldean Numerology · Secure & Private</p>
        </div>
      </footer>
    </div>
  );
};

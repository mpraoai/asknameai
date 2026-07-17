import React, { useState } from 'react';
import { Search, Loader as Loader2, Sparkles, CircleAlert as AlertCircle, Check, ArrowRight } from 'lucide-react';
import { analyzeName, NameAnalysisResult } from '../services/numerologyService';

interface FreeNameCheckProps {
  onContinue: (name: string, dob: string, analysis: NameAnalysisResult) => void;
}

export const FreeNameCheck: React.FC<FreeNameCheckProps> = ({ onContinue }) => {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Free Name Check
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Discover Your Name's Numerology
          </h1>
          <p className="text-gray-500 text-lg">
            Enter your name and date of birth to get a free numerology preview
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Rahul Kumar Sharma"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-gray-900"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleCheck}
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold py-4 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Start Free Name Check
                </>
              )}
            </button>
          </div>

          {analysis && (
            <div className="mt-8 animate-fade-in-up">
              <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl p-6 border border-brand-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Name Analysis Preview</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    analysis.isFavorable ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {analysis.isFavorable ? 'Favorable' : 'Needs Correction'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Name Number</div>
                    <div className="text-2xl font-bold text-brand-600">{analysis.nameNumber}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Ruling Planet</div>
                    <div className="text-lg font-bold text-gray-900">{analysis.planet}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Key Traits</div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.traits.map((trait, i) => (
                      <span key={i} className="bg-white px-3 py-1 rounded-full text-xs text-gray-700 border border-gray-200">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 mb-4">
                  <div className="text-sm text-gray-600 leading-relaxed">{analysis.suggestion}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Letter Values (Chaldean)</div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.letterValues.map((lv, i) => (
                      <div key={i} className="bg-white px-2 py-1 rounded-lg text-xs border border-gray-200">
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
          )}
        </div>
      </div>
    </div>
  );
};

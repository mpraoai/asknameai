import React, { useState } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import {
  calculateMobileNumerology, calculateBusinessNameNumerology, calculateDomainNumerology,
  ExtendedNumerologyResult,
} from '../lib/numerologyExtensions';

type ExtendedTool = 'mobile_numerology' | 'business_numerology' | 'domain_numerology';

const TOOL_COPY: Record<ExtendedTool, { title: string; placeholder: string; inputType: string; hint: string }> = {
  mobile_numerology: { title: 'Mobile Numerology', placeholder: 'e.g. 9876543210', inputType: 'tel', hint: 'Every digit of your mobile number is added and reduced, the same way a birth date is.' },
  business_numerology: { title: 'Business Name Numerology', placeholder: 'e.g. Shree Enterprises', inputType: 'text', hint: 'Uses the same Chaldean letter values as a personal name, applied to your trading or brand name.' },
  domain_numerology: { title: 'Domain Name Numerology', placeholder: 'e.g. asknameai.com', inputType: 'text', hint: "Only the name before the dot is analyzed - the .com/.in doesn't carry a numerological value." },
};

const CALCULATORS: Record<ExtendedTool, (input: string) => ExtendedNumerologyResult> = {
  mobile_numerology: calculateMobileNumerology,
  business_numerology: calculateBusinessNameNumerology,
  domain_numerology: calculateDomainNumerology,
};

export const ExtendedNumerologyTool: React.FC<{ tool: ExtendedTool }> = ({ tool }) => {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<ExtendedNumerologyResult | null>(null);
  const copy = TOOL_COPY[tool];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setResult(CALCULATORS[tool](value.trim()));
  };

  if (result) {
    return (
      <div className="space-y-6">
        <button onClick={() => setResult(null)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Check another
        </button>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-center text-white">
          <p className="text-sm opacity-80 mb-1">{copy.title} for</p>
          <p className="text-lg font-semibold mb-4">{result.input}</p>
          <div className="text-6xl font-bold mb-2">{result.reduced}</div>
          {result.meaning && <p className="text-sm opacity-90">{result.meaning.title}</p>}
        </div>

        {result.meaning && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              What number {result.reduced} means
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-3">{result.meaning.description}</p>
            <div className="flex flex-wrap gap-2">
              {result.meaning.traits.map((t) => (
                <span key={t} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Breakdown (total: {result.total})</p>
          <div className="flex flex-wrap gap-2">
            {result.breakdown.map((b, i) => (
              <span key={i} className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 font-mono">
                {b.digit} = {b.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{copy.title}</h2>
      <p className="text-sm text-gray-500 mb-6">{copy.hint}</p>
      <input
        type={copy.inputType}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={copy.placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all mb-4"
      />
      <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all">
        Calculate
      </button>
    </form>
  );
};

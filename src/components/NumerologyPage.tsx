import React, { useState } from 'react';
import { ArrowLeft, Calculator, Sparkles, User, Calendar, Phone, Building2, Hand, CircleCheck as CheckCircle2 } from 'lucide-react';
import { NumerologyLogo } from './NumerologyLogo';

interface NumerologyPageProps {
  onBack: () => void;
}

export const NumerologyPage: React.FC<NumerologyPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'name' | 'mobile' | 'business' | 'palmistry'>('name');
  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    mobile: '',
    businessName: '',
  });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'name', label: 'Name Correction', icon: User },
    { id: 'mobile', label: 'Mobile Numerology', icon: Phone },
    { id: 'business', label: 'Business Name', icon: Building2 },
    { id: 'palmistry', label: 'Palmistry', icon: Hand },
  ] as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setResult('Based on Chaldean numerology analysis, your name aligns with driver number 3 and conductor number 6. Consider adding the letter "A" to balance the vibration.');
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <NumerologyLogo size="md" variant="dark" showText={false} />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Numerology Services</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setResult(null); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl w-12 h-12 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-gray-500">Enter your details for AI-powered analysis</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {activeTab === 'name' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>
              </>
            )}

            {activeTab === 'mobile' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="Enter your 10-digit mobile number"
                  maxLength={10}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
            )}

            {activeTab === 'business' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Enter your business name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Founder's Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>
              </>
            )}

            {activeTab === 'palmistry' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Palm Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                  <Hand className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Click to upload or drag and drop your palm image</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                  <input type="file" accept="image/*" className="hidden" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Get Analysis
                </>
              )}
            </button>
          </form>

          {result && (
            <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 animate-fadeIn">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Your Numerology Result</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{result}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {[
            { icon: Calculator, title: 'Chaldean Method', desc: 'Authentic Chaldean numerology system' },
            { icon: Sparkles, title: 'AI Verified', desc: 'Verified by expert numerologists' },
            { icon: CheckCircle2, title: '4-Step Check', desc: 'Multiple verification layers' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-md text-center">
                <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

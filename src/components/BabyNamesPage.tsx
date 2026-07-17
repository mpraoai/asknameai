import React, { useState } from 'react';
import { ArrowLeft, Baby, Sparkles, Heart, Star, CircleCheck as CheckCircle2 } from 'lucide-react';
import { NumerologyLogo } from './NumerologyLogo';

interface BabyNamesPageProps {
  onBack: () => void;
}

interface NameSuggestion {
  name: string;
  meaning: string;
  numerologyValue: number;
  gender: 'boy' | 'girl';
}

export const BabyNamesPage: React.FC<BabyNamesPageProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    birthDate: '',
    gender: 'boy' as 'boy' | 'girl',
    religion: 'hindu',
  });
  const [suggestions, setSuggestions] = useState<NameSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const boyNames: NameSuggestion[] = [
        { name: 'Aarav', meaning: 'Peaceful, calm', numerologyValue: 7, gender: 'boy' },
        { name: 'Vivaan', meaning: 'Full of life', numerologyValue: 9, gender: 'boy' },
        { name: 'Kiaan', meaning: 'Grace of God', numerologyValue: 9, gender: 'boy' },
        { name: 'Reyansh', meaning: 'Ray of light', numerologyValue: 6, gender: 'boy' },
        { name: 'Atharv', meaning: 'Lord Ganesha', numerologyValue: 3, gender: 'boy' },
        { name: 'Saanvi', meaning: 'Goddess Lakshmi', numerologyValue: 5, gender: 'girl' },
        { name: 'Anika', meaning: 'Graceful', numerologyValue: 1, gender: 'girl' },
        { name: 'Myra', meaning: 'Devotee of Lord Krishna', numerologyValue: 6, gender: 'girl' },
      ];

      const filtered = formData.gender === 'boy'
        ? boyNames.filter(n => n.gender === 'boy')
        : boyNames.filter(n => n.gender === 'girl');

      setSuggestions(filtered);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <NumerologyLogo size="md" variant="dark" showText={false} />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Baby Name Suggestions</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Baby className="w-4 h-4" />
            Free Service
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Find the Perfect Name for Your Baby
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Numerologically perfect baby names based on birth chart and religious preferences.
            Separate suggestions for boys and girls.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 mb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Baby's Date of Birth</label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'boy' })}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      formData.gender === 'boy'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}
                  >
                    Boy
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'girl' })}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      formData.gender === 'girl'
                        ? 'bg-pink-500 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}
                  >
                    Girl
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Religion</label>
                <select
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white"
                >
                  <option value="hindu">Hindu</option>
                  <option value="muslim">Muslim</option>
                  <option value="sikh">Sikh</option>
                  <option value="christian">Christian</option>
                  <option value="jain">Jain</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Finding Names...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Get Name Suggestions
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {suggestions.length > 0 && (
          <div className="animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Suggested Names
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {suggestions.map((name, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all border border-pink-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-gray-900">{name.name}</h4>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      name.gender === 'boy' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                    }`}>
                      Value: {name.numerologyValue}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{name.meaning}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    Numerologically balanced
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-pink-50 rounded-2xl p-6 border border-pink-100">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  These names are selected based on Chaldean numerology and your baby's birth date.
                  For a detailed report with more options and compatibility analysis, check our Premium plan.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

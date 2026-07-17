import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, AlertCircle,
  TrendingUp, Moon, Sun, Sparkles, Lock, User
} from 'lucide-react'
import { NumerologyResult, NUMBER_MEANINGS, generateNameSuggestions } from '../lib/numerology'

export default function CompatibilityReport() {
  const { data } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState<NumerologyResult | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (data) {
      try {
        const decoded = JSON.parse(atob(data)) as NumerologyResult
        setResult(decoded)
      } catch {
        navigate('/')
      }
    }
  }, [data, navigate])

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/50">Loading...</div>
      </div>
    )
  }

  const driverMeaning = NUMBER_MEANINGS[result.driver]
  const conductorMeaning = NUMBER_MEANINGS[result.conductor]
  const suggestions = showSuggestions
    ? generateNameSuggestions(result.firstName, result.lastName, result.driver, 10)
    : []

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/free-check')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <span className="text-lg font-semibold gradient-text">AskNameAI</span>
      </header>

      <main className="flex-1 px-6 py-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Name Compatibility Report</h1>
            <p className="text-white/50 text-sm">
              For {result.fullName} - Born {result.dob}
            </p>
          </div>

          {/* Verdict Banner */}
          <div
            className={`card p-6 border-2 ${
              result.isAuspicious
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-orange-500/30 bg-orange-500/5'
            }`}
          >
            <div className="flex items-start gap-4">
              {result.isAuspicious ? (
                <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
              )}
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  {result.isAuspicious ? 'Your Name is Auspicious!' : 'Name Correction Recommended'}
                </h2>
                <p className="text-white/60 text-sm leading-relaxed">{result.verdict}</p>
              </div>
            </div>
          </div>

          {/* Driver & Conductor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Driver */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center">
                  <Sun className="w-6 h-6 text-gold-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Driver Number</h3>
                  <p className="text-xs text-white/40">From your full date of birth</p>
                </div>
              </div>
              <div className="text-5xl font-bold gradient-text mb-3">{result.driver}</div>
              {driverMeaning && (
                <>
                  <p className="text-sm font-medium text-white/80 mb-2">{driverMeaning.title}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{driverMeaning.description}</p>
                </>
              )}
            </div>

            {/* Conductor */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center">
                  <Moon className="w-6 h-6 text-gold-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Conductor Number</h3>
                  <p className="text-xs text-white/40">From your day of birth</p>
                </div>
              </div>
              <div className="text-5xl font-bold gradient-text mb-3">{result.conductor}</div>
              {conductorMeaning && (
                <>
                  <p className="text-sm font-medium text-white/80 mb-2">{conductorMeaning.title}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{conductorMeaning.description}</p>
                </>
              )}
            </div>
          </div>

          {/* Name Value Breakdown */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-400" />
              Name Value Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-white/40 mb-1">First Name Value</p>
                <p className="text-2xl font-bold">{result.firstNameValue}</p>
                <p className="text-xs text-white/40 mt-1">Reduces to: <span className="text-gold-400 font-semibold">{result.firstNameReduced}</span></p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-white/40 mb-1">Full Name Value</p>
                <p className="text-2xl font-bold">{result.fullNameValue}</p>
                <p className="text-xs text-white/40 mt-1">Reduces to: <span className="text-gold-400 font-semibold">{result.fullNameReduced}</span></p>
              </div>
            </div>
          </div>

          {/* Name Suggestions Preview (Free) */}
          {!result.isAuspicious && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold-400" />
                  Suggested Name Corrections
                </h3>
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-sm text-gold-400 hover:text-gold-500 transition-colors"
                >
                  {showSuggestions ? 'Hide' : 'Preview'}
                </button>
              </div>

              {showSuggestions && suggestions.length > 0 ? (
                <div className="space-y-2">
                  {suggestions.slice(0, 3).map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span className="font-medium">{s.name} {result.lastName}</span>
                      </div>
                      <div className="text-sm text-white/40">
                        Value: {s.value} → <span className="text-gold-400">{s.reduced}</span>
                      </div>
                    </div>
                  ))}
                  {suggestions.length > 3 && (
                    <div className="relative">
                      <div className="space-y-2 blur-sm pointer-events-none">
                        {suggestions.slice(3, 6).map((s, i) => (
                          <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                            <span className="font-medium">{s.name} {result.lastName}</span>
                            <span className="text-sm text-white/40">Value: {s.value} → {s.reduced}</span>
                          </div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-navy-900/90 backdrop-blur-sm rounded-xl px-6 py-4 text-center border border-white/10">
                          <Lock className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                          <p className="text-sm text-white/70 mb-3">Unlock all {suggestions.length} suggestions</p>
                          <button
                            onClick={() => navigate(`/plans/${data}`)}
                            className="btn-primary text-sm px-4 py-2"
                          >
                            View Plans
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : showSuggestions && suggestions.length === 0 ? (
                <p className="text-sm text-white/40">No compatible variations found. Try our premium plans for advanced suggestions.</p>
              ) : (
                <p className="text-sm text-white/50">
                  Your name needs correction to align with your Driver {result.driver}. Unlock personalized spelling suggestions.
                </p>
              )}
            </div>
          )}

          {/* Additional Numbers (locked) */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gold-400" />
              Deep Numerology Numbers
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Life Path', value: result.lifePathNumber },
                { label: 'Destiny', value: result.destinyNumber },
                { label: 'Soul Urge', value: result.soulUrgeNumber },
                { label: 'Personality', value: result.personalityNumber },
                { label: 'Birth Day', value: result.birthDayNumber },
                { label: 'Kua Number', value: result.kuaNumber },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-xs text-white/40 mb-1">{item.label}</p>
                  <p className="text-2xl font-bold text-white/80">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {!result.isAuspicious ? (
            <div className="card p-6 text-center bg-gradient-to-r from-gold-400/10 to-gold-500/5 border-gold-400/20">
              <h3 className="text-xl font-semibold mb-2">Unlock Your Full Report</h3>
              <p className="text-white/60 text-sm mb-4">
                Get all name suggestions, detailed number meanings, and your personalized numerology dashboard.
              </p>
              <button
                onClick={() => navigate(`/plans/${data}`)}
                className="btn-primary text-lg px-8 py-4 animate-pulse-glow"
              >
                View Plans & Unlock
              </button>
            </div>
          ) : (
            <div className="card p-6 text-center bg-gradient-to-r from-green-500/10 to-green-600/5 border-green-500/20">
              <h3 className="text-xl font-semibold mb-2">Your Name is Lucky!</h3>
              <p className="text-white/60 text-sm mb-4">
                Explore your full numerology dashboard with detailed insights and predictions.
              </p>
              <button
                onClick={() => navigate(`/plans/${data}`)}
                className="btn-primary text-lg px-8 py-4"
              >
                Explore Full Numerology
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

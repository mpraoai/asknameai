import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  ArrowLeft, CheckCircle2,
  TrendingUp, Sparkles, Lock, User, Phone, Mail, Loader2, Check, X, MinusCircle
} from 'lucide-react'
import { NumerologyResult, NUMBER_MEANINGS, generateNameSuggestions } from '../lib/numerology'
import { getLetterBreakdown, getAnalysisSteps, PLANET_RULERS } from '../lib/nameAnalysisDisplay'
import { PLANS } from '../lib/plans'
import { captureLead } from '../services/numerologistService'
import { scoreLead } from '../services/newAgents/leadScoringAgent'
import { explainNumerologyReport } from '../services/newAgents/aiAssistantService'

const ANALYSIS_STEPS_COPY = [
  'Mapping Chaldean letter values...',
  'Checking spelling patterns...',
  'Calculating compound number...',
  'Verifying birth number alignment...',
  'Preparing your results...',
]

export default function CompatibilityReport() {
  const { data } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState<NumerologyResult | null>(null)
  const [analyzing, setAnalyzing] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [leadMobile, setLeadMobile] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [leadError, setLeadError] = useState('')
  const [explanation, setExplanation] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [explainError, setExplainError] = useState('')

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadMobile.trim() && !leadEmail.trim()) {
      setLeadError('Please enter a mobile number or email so a numerologist can reach you.')
      return
    }
    setLeadError('')
    setLeadSubmitting(true)
    const res = await captureLead({
      first_name: result?.firstName,
      last_name: result?.lastName,
      mobile_number: leadMobile.trim() || undefined,
      email: leadEmail.trim() || undefined,
      source_type: 'free_check',
      lead_score: scoreLead({
        isAuspicious: !!result?.isAuspicious,
        hasMobile: !!leadMobile.trim(),
        hasEmail: !!leadEmail.trim(),
        sourceType: 'free_check',
      }),
    })
    setLeadSubmitting(false)
    if (!res.success) {
      setLeadError(res.error || 'Could not submit your details. Please try again.')
      return
    }
    setLeadSubmitted(true)
  }

  const handleExplain = async () => {
    if (!result || explaining) return
    setExplaining(true)
    setExplainError('')
    const res = await explainNumerologyReport({
      firstName: result.firstName,
      driver: result.driver,
      conductor: result.conductor,
      lifePathNumber: result.lifePathNumber,
      destinyNumber: result.destinyNumber,
      soulUrgeNumber: result.soulUrgeNumber,
      isAuspicious: result.isAuspicious,
    })
    setExplaining(false)
    if (!res.success) {
      setExplainError(res.error || 'Could not generate an explanation right now.')
      return
    }
    setExplanation(res.explanation || '')
  }

  useEffect(() => {
    if (data) {
      try {
        const decoded = JSON.parse(atob(data.replace(/-/g, '+').replace(/_/g, '/'))) as NumerologyResult
        setResult(decoded)
      } catch {
        navigate('/')
      }
    }
  }, [data, navigate])

  // Same "analyzing" beat as the reference site - purely presentational,
  // the real calculation already happened instantly on the form.
  useEffect(() => {
    if (!result) return
    setAnalyzing(true)
    const t = setTimeout(() => setAnalyzing(false), 2200)
    return () => clearTimeout(t)
  }, [result?.fullName, result?.dob])

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/50">Loading...</div>
      </div>
    )
  }

  if (analyzing) {
    return <AnalyzingScreen name={result.fullName} />
  }

  const driverMeaning = NUMBER_MEANINGS[result.driver]
  const conductorMeaning = NUMBER_MEANINGS[result.conductor]
  const suggestions = showSuggestions
    ? generateNameSuggestions(result.firstName, result.lastName, result.driver, 10)
    : []
  const letterBreakdown = getLetterBreakdown(result.fullName)
  const analysisSteps = getAnalysisSteps(result)
  const firstNameLetterCount = result.firstName.replace(/[^A-Za-z]/g, '').length

  return (
    <div className="min-h-screen flex flex-col lovable-bg">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/free-check')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <span className="text-lg font-semibold lovable-hero-text">AskNameAI</span>
      </header>

      <main className="flex-1 px-6 py-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          {/* Title */}
          <div className="text-center mb-6">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Name analysis result for</p>
            <h1 className="text-3xl font-bold mb-3">{result.fullName.toUpperCase()}</h1>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1.5 rounded-full ${
              result.isAuspicious ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
            }`}>
              {result.isAuspicious ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              {result.isAuspicious ? 'Auspicious' : 'Needs Correction'}
            </span>
            <p className="text-white/50 text-sm mt-4 max-w-lg mx-auto">{result.verdict}</p>
          </div>

          {/* Checked against your birth numbers - Mulank & Bhagyank */}
          <div className="card p-6">
            <p className="text-center text-xs text-white/40 uppercase tracking-widest mb-1">Checked against your birth numbers</p>
            <h3 className="text-center font-semibold mb-5">Mulank &amp; Bhagyank</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-[10px] text-white/40 uppercase tracking-wide mb-2">Mulank (Conductor)</p>
                <div className="text-4xl font-bold lovable-hero-text mb-1">{result.conductor}</div>
                <p className="text-xs text-white/40 mb-2">{PLANET_RULERS[result.conductor]}</p>
                {conductorMeaning && <p className="text-[11px] text-white/40 leading-relaxed">{conductorMeaning.title}</p>}
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-[10px] text-white/40 uppercase tracking-wide mb-2">Bhagyank (Driver)</p>
                <div className="text-4xl font-bold lovable-hero-text mb-1">{result.driver}</div>
                <p className="text-xs text-white/40 mb-2">{PLANET_RULERS[result.driver]}</p>
                {driverMeaning && <p className="text-[11px] text-white/40 leading-relaxed">{driverMeaning.title}</p>}
              </div>
            </div>

            {/* Letter-by-letter Chaldean breakdown */}
            <div className="flex flex-wrap justify-center gap-1.5 mb-3">
              {letterBreakdown.map((l, i) => (
                <div key={i} className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-xs font-semibold ${i < firstNameLetterCount ? 'bg-gold-400/10 text-gold-300' : 'bg-white/5 text-white/60'}`}>
                  <span>{l.letter}</span>
                  <span className="text-[9px] opacity-60 leading-none">{l.value}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-white/30 font-mono">
              {letterBreakdown.map((l) => l.value).join(' + ')} = <span className="text-gold-400">{result.fullNameValue} = {result.fullNameReduced}</span>
            </p>
          </div>

          {/* Step-by-step validation */}
          <div className="space-y-2.5">
            {analysisSteps.map((step, i) => (
              <div key={step.title} className="card p-4 flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                  step.status === 'pass' ? 'bg-green-500/20 text-green-400' : step.status === 'fail' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/40'
                }`}>
                  {step.status === 'pass' ? <Check className="w-3.5 h-3.5" /> : step.status === 'fail' ? <X className="w-3.5 h-3.5" /> : (i + 1)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">Step {i + 1}: {step.title}</p>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                      step.status === 'pass' ? 'bg-green-500/15 text-green-400' : step.status === 'fail' ? 'bg-red-500/15 text-red-400' : 'bg-white/10 text-white/40'
                    }`}>{step.status}</span>
                  </div>
                  <p className="text-xs text-white/50 mt-1">{step.detail}</p>
                </div>
              </div>
            ))}
            {!result.isAuspicious && (
              <div className="card p-4 border-2 border-red-500/20 bg-red-500/5">
                <p className="text-xs text-red-300">
                  <MinusCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  No need to check further. Your name number isn't fully friendly with your birth numbers — this is the most fundamental requirement. Further checks are irrelevant until this is fixed.
                </p>
              </div>
            )}
          </div>

          {/* Premium report CTA - matches the reference's "select a plan" moment */}
          <div className="card p-6 text-center border-2 border-gold-400/20 bg-gold-400/5">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-gold-400 bg-gold-400/10 px-2.5 py-1 rounded-full mb-3">Premium report</span>
            <h3 className="text-xl font-semibold mb-2">{result.isAuspicious ? 'See Your Full Numerology Report' : 'Your Name Needs Correction'}</h3>
            <p className="text-white/60 text-sm mb-4 max-w-md mx-auto">
              {result.isAuspicious
                ? 'Get your complete Life Path, Destiny, and Soul Urge reading, expert-reviewed.'
                : 'Your free check found the issue. The paid report gives you the exact corrected spelling, compound logic, and remedies — reviewed by expert numerologists.'}
            </p>
            <div className="flex items-center justify-center gap-3 text-sm text-white/50 mb-4 flex-wrap">
              {PLANS.map((p, i) => (
                <span key={p.id} className="flex items-center gap-3">
                  {i > 0 && <span className="text-white/20">·</span>}
                  {p.name} {p.currency}{p.price}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate(`/plans/${data}`)}
              className="btn-lovable-primary text-lg px-8 py-4"
            >
              View Premium Plans
            </button>
          </div>

          {/* Unlock wall - captures contact info BEFORE the deeper breakdown, Lo Shu-level detail, and problem-name findings below */}
          {!leadSubmitted && (
            <div className="card p-6 border-2 border-gold-400/20 bg-gold-400/5">
              <form onSubmit={handleLeadSubmit}>
                <div className="flex items-center gap-3 mb-1">
                  <Lock className="w-5 h-5 text-gold-400 flex-shrink-0" />
                  <h3 className="font-semibold">Unlock your full breakdown</h3>
                </div>
                <p className="text-sm text-white/50 mb-4">
                  Enter your number or email to see your complete name value breakdown, deep numerology numbers, and any corrections found.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="tel"
                      value={leadMobile}
                      onChange={(e) => setLeadMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Mobile number"
                      className="input-field-lovable pl-9 text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="Email (optional)"
                      className="input-field-lovable pl-9 text-sm"
                    />
                  </div>
                </div>
                {leadError && <p className="text-red-400 text-sm mb-3">{leadError}</p>}
                <button
                  type="submit"
                  disabled={leadSubmitting}
                  className="btn-lovable-primary text-sm px-6 py-3 flex items-center gap-2 disabled:opacity-50"
                >
                  {leadSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Unlock My Full Report
                </button>
              </form>
            </div>
          )}

          {leadSubmitted && (
            <div className="card p-4 border-2 border-green-500/20 bg-green-500/5 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-white/70">Unlocked, {result.firstName} — a numerologist will also reach out personally with your complete reading.</p>
            </div>
          )}

          {/* Everything below is the "second reveal" - stays gated until the form above is submitted */}
          <div className={!leadSubmitted ? 'relative' : undefined}>
          {!leadSubmitted && (
            <div className="absolute inset-0 z-10 backdrop-blur-md bg-navy-900/40 rounded-2xl" />
          )}
          <div className={`space-y-6 ${!leadSubmitted ? 'pointer-events-none select-none' : ''}`}>

          {/* AI Explainer Agent - turns the raw numbers above into a personalized plain-language reading */}
          <div className="card p-6 border-2 border-indigo-400/20 bg-indigo-400/5">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Your Personalized Reading
            </h3>
            {explanation ? (
              <p className="text-sm text-white/70 leading-relaxed mt-3">{explanation}</p>
            ) : (
              <>
                <p className="text-sm text-white/50 mb-4">Get an AI-written, plain-language explanation of what your numbers actually mean for you.</p>
                {explainError && <p className="text-red-400 text-sm mb-3">{explainError}</p>}
                <button
                  onClick={handleExplain}
                  disabled={explaining}
                  className="btn-lovable-primary text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50"
                >
                  {explaining && <Loader2 className="w-4 h-4 animate-spin" />}
                  {explaining ? 'Writing your reading...' : 'Get My Personalized Reading'}
                </button>
              </>
            )}
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
                            className="btn-lovable-primary text-sm px-4 py-2"
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
                className="btn-lovable-primary text-lg px-8 py-4"
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
                className="btn-lovable-primary text-lg px-8 py-4"
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

function AnalyzingScreen({ name }: { name: string }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS_COPY.length - 1)), 400)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen flex flex-col lovable-bg">
      <header className="px-6 py-5 flex items-center justify-between">
        <span className="text-lg font-semibold lovable-hero-text">AskNameAI</span>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gold-400/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Sparkles className="w-8 h-8 text-gold-400" />
          </div>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Analyzing your name</p>
          <h1 className="text-2xl font-bold mb-1">{name}</h1>
          <p className="text-sm text-white/40 mb-8">This usually takes a few seconds</p>
          <div className="space-y-2.5 text-left">
            {ANALYSIS_STEPS_COPY.map((label, i) => (
              <div key={label} className={`flex items-center gap-2.5 text-sm transition-opacity ${i <= step ? 'opacity-100' : 'opacity-30'}`}>
                {i < step ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : i === step ? (
                  <Loader2 className="w-4 h-4 text-gold-400 flex-shrink-0 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                )}
                <span className="text-white/60">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

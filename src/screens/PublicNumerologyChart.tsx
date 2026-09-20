import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Users, Sparkles, Loader2 } from 'lucide-react'
import { calculateDriver, calculateConductor, calculateKua, createLoshuGrid, analyzePlanes } from '../utils/numerologyCalculations'
import { getCompatibility } from '../utils/compatibility'
import { calculateNameValue, reduceNumber } from '../lib/numerology'
import { PLANET_RULERS } from '../lib/nameAnalysisDisplay'
import { calculatePersonalYear, PERSONAL_YEAR_MEANINGS } from '../lib/personalYear'
import { NumerologyResults } from '../components/NumerologyResults'
import { PersonData, NumerologyCalculation } from '../types/numerology'
import { PublicTrustBar, PublicMarketingSections } from '../components/PublicMarketingSections'
import { logToolUsage } from '../services/opsModulesService'

/**
 * "Free Numerology Chart" - an instant, no-unlock-wall chart (Mulank,
 * Bhagyank, name number, Lo Shu grid, Personal Year) matching the
 * reference site's "five free tools" pattern. Reuses the existing
 * calculation utilities (numerologyCalculations.ts, compatibility.ts)
 * and the existing NumerologyResults display component unmodified -
 * only new display logic, nothing in numerology.ts touched.
 */
export default function PublicNumerologyChart() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [chart, setChart] = useState<{ person: PersonData; calc: NumerologyCalculation; nameNumber: number | null; personalYear: number } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dob) {
      setError("Please enter your date of birth")
      return
    }
    if (!consent) {
      setError('Please agree to the Privacy Policy to continue')
      return
    }
    setError('')
    setLoading(true)
    const driver = calculateDriver(dob)
    const conductor = calculateConductor(dob)
    const kua = calculateKua(dob, gender)
    const loshuGrid = createLoshuGrid(dob, driver, conductor, kua, gender)
    const calc: NumerologyCalculation = {
      driver, conductor, kua, loshuGrid,
      planes: analyzePlanes(loshuGrid),
      compatibility: getCompatibility(driver, conductor),
    }
    const person: PersonData = { name, surname: '', dateOfBirth: dob, gender }
    const nameNumber = name.trim() ? reduceNumber(calculateNameValue(name.trim())) : null
    const personalYear = calculatePersonalYear(dob)
    setTimeout(() => {
      setChart({ person, calc, nameNumber, personalYear })
      logToolUsage('numerology')
      setLoading(false)
    }, 400)
  }

  if (chart) {
    return (
      <div className="min-h-screen flex flex-col lovable-bg">
        <header className="px-6 py-5 flex items-center gap-4">
          <button onClick={() => setChart(null)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold lovable-hero-text">AskNameAI</span>
        </header>
        <main className="flex-1 px-6 py-4 pb-20">
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="text-center mb-2">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Your free numerology chart</p>
              <h1 className="text-2xl font-bold">Mulank {chart.calc.conductor} · Bhagyank {chart.calc.driver}{chart.nameNumber ? ` · Name Number ${chart.nameNumber}` : ''}</h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="card p-4 text-center">
                <p className="text-[10px] text-white/40 uppercase mb-1">Mulank</p>
                <p className="text-3xl font-bold lovable-hero-text">{chart.calc.conductor}</p>
                <p className="text-[10px] text-white/40 mt-1">{PLANET_RULERS[chart.calc.conductor]}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-[10px] text-white/40 uppercase mb-1">Bhagyank</p>
                <p className="text-3xl font-bold lovable-hero-text">{chart.calc.driver}</p>
                <p className="text-[10px] text-white/40 mt-1">{PLANET_RULERS[chart.calc.driver]}</p>
              </div>
              {chart.nameNumber != null && (
                <div className="card p-4 text-center">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Name Number</p>
                  <p className="text-3xl font-bold lovable-hero-text">{chart.nameNumber}</p>
                </div>
              )}
              <div className="card p-4 text-center">
                <p className="text-[10px] text-white/40 uppercase mb-1">Personal Year</p>
                <p className="text-3xl font-bold lovable-hero-text">{chart.personalYear}</p>
              </div>
            </div>

            <div className="card p-6 border-2 border-indigo-400/20 bg-indigo-400/5">
              <h3 className="font-semibold mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-300" />Your {new Date().getFullYear()} Personal Year</h3>
              <p className="text-sm text-white/60">{PERSONAL_YEAR_MEANINGS[chart.personalYear] || 'A year of steady, personal transformation.'}</p>
            </div>

            <div className="bg-white rounded-2xl p-6">
              <NumerologyResults person={chart.person} calculation={chart.calc} />
            </div>

            <div className="card p-6 text-center border-2 border-gold-400/20 bg-gold-400/5">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-gold-400 bg-gold-400/10 px-2.5 py-1 rounded-full mb-3">Go deeper</span>
              <h3 className="text-xl font-semibold mb-2">Want the full name correction report?</h3>
              <p className="text-white/60 text-sm mb-4">Run a full name check to see if your spelling aligns with these numbers, and get expert-reviewed corrections.</p>
              <button onClick={() => navigate('/free-check')} className="btn-lovable-primary text-lg px-8 py-4">Check My Name</button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lovable-bg">
      <header className="px-6 py-5 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold lovable-hero-text">AskNameAI</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-400/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-indigo-300" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Free Numerology Chart</h1>
            <p className="text-white/50 text-sm">See your Mulank, Bhagyank, name number, Lo Shu planes and current Personal Year — instantly, no report needed.</p>
          </div>

          <form onSubmit={handleSubmit} className="card p-8 space-y-5">
            <div>
              <label className="text-sm text-white/70 mb-2 block">Name (optional)</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" className="input-field-lovable" />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-2 block"><Calendar className="w-4 h-4 inline mr-1" />Date of Birth</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="input-field-lovable" />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-2 block"><Users className="w-4 h-4 inline mr-1" />Gender</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setGender('male')} className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${gender === 'male' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent' : 'border-white/10 text-white/60'}`}>Male</button>
                <button type="button" onClick={() => setGender('female')} className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${gender === 'female' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent' : 'border-white/10 text-white/60'}`}>Female</button>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-white/50 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-purple-400 flex-shrink-0" />
              <span>I agree to the <Link to="/privacy-policy" target="_blank" className="text-purple-300 hover:underline">Privacy Policy</Link> and consent to this information being used to calculate my chart.</span>
            </label>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="btn-lovable-primary w-full text-lg py-4 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? 'Building your chart...' : 'Create My Chart'}
            </button>
          </form>
          <PublicTrustBar />
        </div>
      </main>
      <PublicMarketingSections />
    </div>
  )
}

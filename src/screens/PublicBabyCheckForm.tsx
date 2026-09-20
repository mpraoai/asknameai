import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Baby, Calendar, Users, Loader2 } from 'lucide-react'
import { calculateDriver, calculateConductor, calculateKua, createLoshuGrid } from '../utils/numerologyCalculations'
import { generateBabyNameSuggestions } from '../utils/babyNames'
import { BabyNameSuggestion } from '../types/numerology'
import { BabyNameSuggestions } from '../components/BabyNameSuggestions'
import { PublicTrustBar, PublicMarketingSections } from '../components/PublicMarketingSections'
import { logToolUsage } from '../services/opsModulesService'

/**
 * Public, no-login baby name suggestion check - the customer-facing
 * counterpart to /free-check, matching the reference site's "Get Baby
 * Name Suggestions" flow (DOB, gender, religion, family name, parent
 * initials -> instant suggestions). Reuses the existing baby-name engine
 * (utils/babyNames.ts) and result display component unmodified.
 */
export default function PublicBabyCheckForm() {
  const navigate = useNavigate()
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [religion, setReligion] = useState('hindu')
  const [lastName, setLastName] = useState('')
  const [fatherInitial, setFatherInitial] = useState('')
  const [motherInitial, setMotherInitial] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<BabyNameSuggestion[] | null>(null)
  const [resultMeta, setResultMeta] = useState<{ driver: number; conductor: number } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dob) {
      setError('Please enter the baby\'s date of birth')
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
    const names = await generateBabyNameSuggestions(gender, religion, driver, conductor, loshuGrid, undefined, lastName || undefined)
    setSuggestions(names)
    logToolUsage('numerology')
    setResultMeta({ driver, conductor })
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col lovable-bg">
      <header className="px-6 py-5 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold lovable-hero-text">AskNameAI</span>
      </header>

      <main className="flex-1 px-6 py-4 pb-20">
        {!suggestions ? (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-pink-400/10 flex items-center justify-center mx-auto mb-4">
                <Baby className="w-7 h-7 text-pink-400" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Get Baby Name Suggestions</h1>
              <p className="text-white/50 text-sm">
                Enter your baby's birth details. We'll suggest auspicious names aligned with the child's Driver, Conductor & Lo Shu grid.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="card p-8 space-y-5">
              <div>
                <label className="text-sm text-white/70 mb-2 block"><Calendar className="w-4 h-4 inline mr-1" />Baby's date of birth</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="input-field-lovable" />
              </div>

              <div>
                <label className="text-sm text-white/70 mb-2 block">Baby's gender</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setGender('male')} className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${gender === 'male' ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white border-transparent' : 'border-white/10 text-white/60'}`}>Boy</button>
                  <button type="button" onClick={() => setGender('female')} className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${gender === 'female' ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white border-transparent' : 'border-white/10 text-white/60'}`}>Girl</button>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/70 mb-2 block"><Users className="w-4 h-4 inline mr-1" />Religion / naming tradition</label>
                <select value={religion} onChange={(e) => setReligion(e.target.value)} className="input-field-lovable appearance-none">
                  <option value="hindu" className="bg-navy-800">Hindu</option>
                  <option value="muslim" className="bg-navy-800">Muslim</option>
                  <option value="christian" className="bg-navy-800">Christian</option>
                  <option value="sikh" className="bg-navy-800">Sikh</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-white/70 mb-2 block">Family last name (optional)</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Sharma" className="input-field-lovable" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Father's initial</label>
                  <input type="text" maxLength={1} value={fatherInitial} onChange={(e) => setFatherInitial(e.target.value.toUpperCase())} placeholder="R" className="input-field-lovable" />
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Mother's initial</label>
                  <input type="text" maxLength={1} value={motherInitial} onChange={(e) => setMotherInitial(e.target.value.toUpperCase())} placeholder="S" className="input-field-lovable" />
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-white/50 cursor-pointer">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-pink-400 flex-shrink-0" />
                <span>
                  I agree to the <Link to="/privacy-policy" target="_blank" className="text-pink-300 hover:underline">Privacy Policy</Link> and consent to this information being used to suggest names.
                </span>
              </label>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button type="submit" disabled={loading} className="btn-lovable-secondary w-full text-lg py-4 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Finding names...' : 'Get Baby Name Suggestions'}
              </button>
            </form>

            <p className="text-center text-sm text-white/40 mt-6">
              Checking your own name instead? <Link to="/free-check" className="text-pink-300 hover:underline">Try it free</Link>
            </p>
            <PublicTrustBar />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <button onClick={() => setSuggestions(null)} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Try different details
            </button>
            <div className="bg-white rounded-2xl p-6">
              <BabyNameSuggestions
                suggestions={suggestions}
                gender={gender}
                religion={religion}
                driver={resultMeta?.driver || 0}
                conductor={resultMeta?.conductor || 0}
                providedLastName={lastName}
              />
            </div>
          </div>
        )}
      </main>

      {!suggestions && <PublicMarketingSections />}
    </div>
  )
}

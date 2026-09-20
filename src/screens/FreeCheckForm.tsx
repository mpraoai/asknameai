import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, User, Calendar, Users, AlertTriangle, Check } from 'lucide-react'
import { calculateNumerology, generateNameSuggestions, NumerologyInput, NumerologyResult } from '../lib/numerology'
import { PublicTrustBar, PublicMarketingSections } from '../components/PublicMarketingSections'
import { logToolUsage } from '../services/opsModulesService'

export default function FreeCheckForm() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<NumerologyResult | null>(null)

  const goToReport = (result: NumerologyResult) => {
    logToolUsage('numerology')
    const encoded = btoa(JSON.stringify(result)).replace(/\+/g, '-').replace(/\//g, '_')
    navigate(`/report/${encoded}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !dob) {
      setError('Please fill in all fields')
      return
    }
    if (!consent) {
      setError('Please agree to the Privacy Policy to continue')
      return
    }
    setError('')
    const input: NumerologyInput = { firstName, lastName, dob, gender }
    const result = calculateNumerology(input)

    // Same pattern as the reference site: surface the mismatch and a
    // suggested spelling right on the form, instead of jumping straight
    // to the report - the person can pick the correction or continue anyway.
    if (!result.isAuspicious && !preview) {
      setPreview(result)
      return
    }
    goToReport(result)
  }

  const suggestedSpelling = preview
    ? generateNameSuggestions(preview.firstName, preview.lastName, preview.driver, 1)[0]
    : null

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

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">Free Name Check</h1>
            <p className="text-white/50 text-sm">
              Enter your details to check if your name is numerologically aligned with your birth date.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card p-8 space-y-5">
            {/* First Name */}
            <div>
              <label className="text-sm text-white/70 mb-2 block">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setPreview(null) }}
                  placeholder="e.g. SAIKIRAN"
                  className="input-field-lovable pl-11"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="text-sm text-white/70 mb-2 block">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setPreview(null) }}
                  placeholder="e.g. KADABOINA"
                  className="input-field-lovable pl-11"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="text-sm text-white/70 mb-2 block">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => { setDob(e.target.value); setPreview(null) }}
                  className="input-field-lovable pl-11"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="text-sm text-white/70 mb-2 block">Gender</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="input-field-lovable pl-11 appearance-none"
                >
                  <option value="male" className="bg-navy-800">Male</option>
                  <option value="female" className="bg-navy-800">Female</option>
                  <option value="other" className="bg-navy-800">Other</option>
                </select>
              </div>
            </div>

            {/* DPDP consent */}
            <label className="flex items-start gap-2.5 text-xs text-white/50 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-purple-400 flex-shrink-0"
              />
              <span>
                I agree to the{' '}
                <Link to="/privacy-policy" target="_blank" className="text-purple-300 hover:underline">
                  Privacy Policy
                </Link>
                {' '}and consent to my name and date of birth being used to calculate my numerology reading.
              </span>
            </label>

            {preview && (
              <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-300">Name is not aligned with your birth energy</p>
                    <p className="text-xs text-white/60 mt-1">{preview.verdict}</p>
                  </div>
                </div>
                {suggestedSpelling && (
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1.5">Suggested correction</p>
                    <div className="inline-flex items-center gap-1.5 bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-sm px-3 py-1.5 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                      {suggestedSpelling.name} {preview.lastName}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => goToReport(preview)}
                  className="text-sm text-white/60 hover:text-white underline underline-offset-4"
                >
                  Continue anyway
                </button>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button type="submit" className="btn-lovable-primary w-full text-lg py-4">
              {preview ? 'Get My Free Report' : 'Check My Name'}
            </button>
          </form>
          <p className="text-center text-xs text-white/30 mt-3">We never store your details until you choose a plan.</p>
        </div>
        <PublicTrustBar />
      </main>

      <PublicMarketingSections />
    </div>
  )
}

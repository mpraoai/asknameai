import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, Building2, Globe, Smartphone, Loader2 } from 'lucide-react'
import {
  calculateBusinessNameNumerology, calculateDomainNumerology, calculateMobileNumerology, ExtendedNumerologyResult,
} from '../lib/numerologyExtensions'
import { captureLead } from '../services/numerologistService'
import { logToolUsage } from '../services/opsModulesService'

type PublicTool = 'business-check' | 'domain-check' | 'mobile-check'

const COPY: Record<PublicTool, { title: string; label: string; placeholder: string; hint: string; icon: typeof Building2; inputType: string }> = {
  'business-check': {
    title: 'Business Name Numerology',
    label: 'Business or brand name',
    placeholder: 'e.g. Shree Enterprises',
    hint: "Uses the same Chaldean values as a personal name, applied to your business's trading name.",
    icon: Building2,
    inputType: 'text',
  },
  'domain-check': {
    title: 'Domain Name Numerology',
    label: 'Domain name',
    placeholder: 'e.g. asknameai.com',
    hint: "Only the name before the dot is analyzed — the .com/.in doesn't carry a numerological value.",
    icon: Globe,
    inputType: 'text',
  },
  'mobile-check': {
    title: 'Mobile Number Analysis',
    label: 'Mobile number',
    placeholder: 'e.g. 9876543210',
    hint: 'Every digit of your mobile number is added and reduced, the same way a birth date is.',
    icon: Smartphone,
    inputType: 'tel',
  },
}

const CALCULATORS: Record<PublicTool, (input: string) => ExtendedNumerologyResult> = {
  'business-check': calculateBusinessNameNumerology,
  'domain-check': calculateDomainNumerology,
  'mobile-check': calculateMobileNumerology,
}

export default function PublicNumerologyToolPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTool: PublicTool = location.pathname === '/domain-check' ? 'domain-check' : location.pathname === '/mobile-check' ? 'mobile-check' : 'business-check'
  const copy = COPY[activeTool]
  const Icon = copy.icon

  const [value, setValue] = useState('')
  const [result, setResult] = useState<ExtendedNumerologyResult | null>(null)
  const [leadMobile, setLeadMobile] = useState('')
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setResult(CALCULATORS[activeTool](value.trim()))
    const moduleCode = activeTool === 'business-check' ? 'brand' : activeTool === 'domain-check' ? 'domain' : 'mobile'
    logToolUsage(moduleCode)
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadMobile.trim() || !result) return
    setLeadSubmitting(true)
    await captureLead({
      first_name: result.input,
      mobile_number: leadMobile.trim(),
      source_type: 'manual',
      lead_score: 'warm',
    })
    setLeadSubmitting(false)
    setLeadSubmitted(true)
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
        <div className="max-w-md mx-auto animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-400/10 flex items-center justify-center mx-auto mb-4">
              <Icon className="w-7 h-7 text-indigo-300" />
            </div>
            <h1 className="text-3xl font-bold mb-3">{copy.title}</h1>
            <p className="text-white/50 text-sm">{copy.hint}</p>
          </div>

          {!result ? (
            <form onSubmit={handleSubmit} className="card p-8 space-y-5">
              <div>
                <label className="text-sm text-white/70 mb-2 block">{copy.label}</label>
                <input
                  type={copy.inputType}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={copy.placeholder}
                  className="input-field-lovable"
                />
              </div>
              <button type="submit" className="btn-lovable-primary w-full text-lg py-4">Calculate</button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="card p-8 text-center border-2 border-gold-400/20">
                <p className="text-sm text-white/50 mb-1">{copy.title} for</p>
                <p className="text-lg font-semibold mb-4">{result.input}</p>
                <div className="text-6xl font-bold lovable-hero-text mb-2">{result.reduced}</div>
                {result.meaning && <p className="text-sm text-white/70">{result.meaning.title}</p>}
              </div>

              {result.meaning && (
                <div className="card p-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold-400" />
                    What number {result.reduced} means
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">{result.meaning.description}</p>
                </div>
              )}

              {/* Lead capture - same "unlock wall" pattern as the personal name check */}
              <div className="card p-6 border-2 border-gold-400/20 bg-gold-400/5">
                {leadSubmitted ? (
                  <p className="text-sm text-white/70">Thanks — a numerologist will reach out with a deeper reading for {result.input}.</p>
                ) : (
                  <form onSubmit={handleLeadSubmit}>
                    <h3 className="font-semibold mb-1">Want a full reading?</h3>
                    <p className="text-sm text-white/50 mb-4">Leave your number and a numerologist will personally review {result.input} in detail.</p>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={leadMobile}
                        onChange={(e) => setLeadMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Mobile number"
                        className="input-field-lovable flex-1"
                      />
                      <button type="submit" disabled={leadSubmitting} className="btn-lovable-primary px-5 flex items-center gap-2 disabled:opacity-50">
                        {leadSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Send
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <button onClick={() => { setResult(null); setValue(''); setLeadSubmitted(false) }} className="text-sm text-white/50 hover:text-white w-full text-center">
                Check another {activeTool === 'domain-check' ? 'domain' : activeTool === 'mobile-check' ? 'mobile number' : 'business name'}
              </button>
            </div>
          )}

          <p className="text-center text-sm text-white/40 mt-6">
            Looking for a personal name check instead? <Link to="/free-check" className="text-indigo-300 hover:underline">Try it free</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

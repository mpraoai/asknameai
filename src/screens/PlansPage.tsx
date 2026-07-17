import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Star, Zap, Crown } from 'lucide-react'
import { NumerologyResult } from '../lib/numerology'
import { supabase } from '../lib/supabase'

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 299,
    currency: '₹',
    icon: Star,
    features: [
      'All name correction suggestions',
      'Driver & Conductor detailed analysis',
      'Name value breakdown',
      'Basic numerology report',
    ],
    color: 'from-blue-500/20 to-blue-600/5',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 599,
    currency: '₹',
    icon: Zap,
    features: [
      'Everything in Basic',
      'Full numerology dashboard',
      'Life Path, Destiny, Soul Urge numbers',
      'Personality & Kua number analysis',
      'Lucky dates & colors guide',
    ],
    color: 'from-gold-400/20 to-gold-500/5',
    borderColor: 'border-gold-400/40',
    popular: true,
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: 999,
    currency: '₹',
    icon: Crown,
    features: [
      'Everything in Premium',
      'Personalized name correction',
      'Yearly numerology predictions',
      'Compatibility with partner/business',
      'Priority expert consultation',
    ],
    color: 'from-purple-500/20 to-purple-600/5',
    borderColor: 'border-purple-500/30',
  },
]

export default function PlansPage() {
  const { data } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState<NumerologyResult | null>(null)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (data) {
      try {
        setResult(JSON.parse(atob(data)) as NumerologyResult)
      } catch {
        navigate('/')
      }
    }
  }, [data, navigate])

  const handlePurchase = async (planId: string) => {
    if (!result) return
    setPurchasing(planId)
    setError('')

    try {
      const plan = PLANS.find((p) => p.id === planId)!
      const { error: insertError } = await supabase.from('purchases').insert({
        first_name: result.firstName,
        last_name: result.lastName,
        dob: result.dob,
        gender: result.gender,
        driver: result.driver,
        conductor: result.conductor,
        plan: planId,
        amount: plan.price,
        status: 'completed',
      })

      if (insertError) throw insertError

      navigate(`/numerology/${data}`)
    } catch (err: any) {
      setError(err.message || 'Purchase failed. Please try again.')
      setPurchasing(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between">
        <button
          onClick={() => navigate(`/report/${data}`)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back to Report</span>
        </button>
        <span className="text-lg font-semibold gradient-text">AskNameAI</span>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-5xl mx-auto animate-fade-in">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-3">Choose Your Plan</h1>
            <p className="text-white/50 text-sm max-w-xl mx-auto">
              Unlock your full numerology report, name corrections, and personalized insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const Icon = plan.icon
              return (
                <div
                  key={plan.id}
                  className={`card p-6 bg-gradient-to-b ${plan.color} border ${plan.borderColor} relative ${
                    plan.popular ? 'md:-translate-y-4' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gold-400 text-navy-900 text-xs font-bold">
                      Most Popular
                    </div>
                  )}

                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-gold-400" />
                  </div>

                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-3xl font-bold">{plan.currency}{plan.price}</span>
                    <span className="text-white/40 text-sm"> one-time</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                        <Check className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchase(plan.id)}
                    disabled={purchasing === plan.id}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      plan.popular
                        ? 'btn-primary'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    } ${purchasing === plan.id ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {purchasing === plan.id ? 'Processing...' : `Get ${plan.name}`}
                  </button>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="mt-6 text-center text-red-400 text-sm">{error}</div>
          )}

          <p className="text-center text-white/30 text-xs mt-8">
            Secure payment - Instant access - 100% money-back guarantee
          </p>
        </div>
      </main>
    </div>
  )
}

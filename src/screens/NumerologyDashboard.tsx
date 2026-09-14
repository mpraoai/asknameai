import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  ArrowLeft, Sun, Moon, Star, Heart, Eye, Shield, Calendar,
  Sparkles, TrendingUp, Palette, CheckCircle2
} from 'lucide-react'
import { NumerologyResult, NUMBER_MEANINGS, generateNameSuggestions } from '../lib/numerology'

export default function NumerologyDashboard() {
  const { data } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState<NumerologyResult | null>(null)

  useEffect(() => {
    if (data) {
      try {
        setResult(JSON.parse(atob(data.replace(/-/g, '+').replace(/_/g, '/'))) as NumerologyResult)
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

  const suggestions = generateNameSuggestions(result.firstName, result.lastName, result.driver, 20)
  const driverMeaning = NUMBER_MEANINGS[result.driver]
  const conductorMeaning = NUMBER_MEANINGS[result.conductor]
  const lifePathMeaning = NUMBER_MEANINGS[result.lifePathNumber]
  const destinyMeaning = NUMBER_MEANINGS[result.destinyNumber]
  const soulUrgeMeaning = NUMBER_MEANINGS[result.soulUrgeNumber]
  const personalityMeaning = NUMBER_MEANINGS[result.personalityNumber]

  // Lucky colors per number
  const luckyColors: Record<number, string[]> = {
    1: ['Gold', 'Orange', 'Yellow'],
    2: ['White', 'Silver', 'Light Green'],
    3: ['Yellow', 'Orange', 'Purple'],
    4: ['Grey', 'Electric Blue'],
    5: ['Green', 'Light Grey'],
    6: ['White', 'Pink', 'Light Blue'],
    7: ['Light Green', 'White'],
    8: ['Dark Blue', 'Black'],
    9: ['Red', 'Maroon'],
  }
  const colors = luckyColors[result.driver] || ['Gold']

  // Lucky dates (dates that reduce to friendly numbers)
  const friendlyDates: number[] = []
  const friendlyGroups: Record<number, number[]> = {
    1: [1, 2, 3, 5, 6, 9],
    2: [1, 2, 3, 5, 6, 9],
    3: [1, 2, 3, 5, 6, 8, 9],
    4: [5],
    5: [1, 2, 3, 5, 6, 8, 9],
    6: [1, 2, 3, 5, 6, 9],
    7: [5],
    8: [3, 5],
    9: [1, 2, 3, 5, 6, 9],
  }
  const driverFriends = friendlyGroups[result.driver] || [1, 5, 6]
  for (let d = 1; d <= 31; d++) {
    const reduced = d > 9 ? d.toString().split('').map(Number).reduce((a, b) => a + b, 0) : d
    if (driverFriends.includes(reduced)) friendlyDates.push(d)
  }

  const numberCards = [
    { label: 'Life Path', value: result.lifePathNumber, icon: Star, meaning: lifePathMeaning, desc: 'Your life journey and purpose' },
    { label: 'Destiny', value: result.destinyNumber, icon: TrendingUp, meaning: destinyMeaning, desc: 'What you are destined to achieve' },
    { label: 'Soul Urge', value: result.soulUrgeNumber, icon: Heart, meaning: soulUrgeMeaning, desc: 'Your inner desires and motivations' },
    { label: 'Personality', value: result.personalityNumber, icon: Shield, meaning: personalityMeaning, desc: 'How others perceive you' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between sticky top-0 bg-navy-900/80 backdrop-blur-md z-10 border-b border-white/5">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Home</span>
        </button>
        <span className="text-lg font-semibold gradient-text">AskNameAI</span>
      </header>

      <main className="flex-1 px-6 py-8 pb-20">
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          {/* Welcome */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">Premium Access Unlocked</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Your Numerology Dashboard</h1>
            <p className="text-white/50 text-sm">
              {result.fullName} - Born {result.dob}
            </p>
          </div>

          {/* Driver & Conductor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center">
                  <Sun className="w-6 h-6 text-gold-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Driver Number</h3>
                  <p className="text-xs text-white/40">Your life force energy</p>
                </div>
              </div>
              <div className="text-5xl font-bold gradient-text mb-3">{result.driver}</div>
              {driverMeaning && (
                <>
                  <p className="text-sm font-medium text-white/80 mb-2">{driverMeaning.title}</p>
                  <p className="text-xs text-white/50 leading-relaxed mb-3">{driverMeaning.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {driverMeaning.traits.map((t) => (
                      <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/60">{t}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center">
                  <Moon className="w-6 h-6 text-gold-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Conductor Number</h3>
                  <p className="text-xs text-white/40">Your guiding influence</p>
                </div>
              </div>
              <div className="text-5xl font-bold gradient-text mb-3">{result.conductor}</div>
              {conductorMeaning && (
                <>
                  <p className="text-sm font-medium text-white/80 mb-2">{conductorMeaning.title}</p>
                  <p className="text-xs text-white/50 leading-relaxed mb-3">{conductorMeaning.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {conductorMeaning.traits.map((t) => (
                      <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/60">{t}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Deep Numbers */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-400" />
              Core Numerology Numbers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {numberCards.map((card) => {
                const Icon = card.icon
                return (
                  <div key={card.label} className="card p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-gold-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium">{card.label}</h3>
                          <span className="text-2xl font-bold gradient-text">{card.value}</span>
                        </div>
                        <p className="text-xs text-white/40 mb-2">{card.desc}</p>
                        {card.meaning && (
                          <>
                            <p className="text-sm text-white/70 mb-1">{card.meaning.title}</p>
                            <p className="text-xs text-white/50 leading-relaxed">{card.meaning.description}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Name Value Breakdown */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-gold-400" />
              Name Value Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-white/40 mb-1">First Name: {result.firstName}</p>
                <p className="text-2xl font-bold">{result.firstNameValue}</p>
                <p className="text-xs text-white/40 mt-1">Reduces to: <span className="text-gold-400 font-semibold">{result.firstNameReduced}</span></p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-white/40 mb-1">Full Name: {result.fullName}</p>
                <p className="text-2xl font-bold">{result.fullNameValue}</p>
                <p className="text-xs text-white/40 mt-1">Reduces to: <span className="text-gold-400 font-semibold">{result.fullNameReduced}</span></p>
              </div>
            </div>
          </div>

          {/* Name Suggestions (Full) */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold-400" />
              Name Correction Suggestions
            </h3>
            {suggestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <div>
                        <span className="font-medium">{s.name} {result.lastName}</span>
                        <p className="text-xs text-white/40">Value: {s.value} → {s.reduced}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">
                      Compatible
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-white/60">
                  Your name is already perfectly aligned with your birth numbers. No corrections needed!
                </p>
              </div>
            )}
          </div>

          {/* Lucky Colors & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-gold-400" />
                Lucky Colors
              </h3>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ background: color.toLowerCase() }}
                    />
                    <span className="text-sm">{color}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold-400" />
                Lucky Dates
              </h3>
              <div className="flex flex-wrap gap-2">
                {friendlyDates.map((d) => (
                  <span
                    key={d}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-gold-400/10 text-gold-400 text-sm font-medium"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Verdict */}
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
                <Sparkles className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
              )}
              <div>
                <h3 className="text-lg font-semibold mb-1">Summary</h3>
                <p className="text-white/60 text-sm leading-relaxed">{result.verdict}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

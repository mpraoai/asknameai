import { useState } from 'react'
import { Zap, ShieldCheck, Star, Users2, Grid3x3, Sparkles, Baby, Plus, Minus } from 'lucide-react'

const STEPS = [
  { n: '01', title: 'Enter your details', body: 'Just your name, date of birth, and gender — takes 20 seconds.' },
  { n: '02', title: 'Get instant verdict', body: 'We compute your Driver, Conductor, and Chaldean name value on the spot.' },
  { n: '03', title: 'Unlock corrections', body: 'Choose a plan for expert-reviewed name spellings that align every plane of your Lo Shu grid.' },
]

const FEATURES = [
  { icon: Grid3x3, title: 'Lo Shu Grid', body: 'Visualise the 9-cell energy grid and see which planes are missing or overloaded.' },
  { icon: Sparkles, title: 'Chaldean spelling engine', body: 'Every corrected name is validated against Chaldean values, pairings, and forbidden series.' },
  { icon: Baby, title: 'Auspicious baby names', body: 'AI-curated, religion-aware baby name suggestions matched to your family numerology.' },
]

const TESTIMONIALS = [
  { quote: 'Within a month of using the corrected spelling I closed a role I had been chasing for two years.', author: 'Priya S., Bengaluru' },
  { quote: 'The Lo Shu grid explanation finally made numerology click for me.', author: 'Rahul M., Dubai' },
  { quote: 'We used the baby name suggestions for our daughter. Every relative loved the shortlist.', author: 'Anitha R., Chennai' },
]

const FAQS = [
  { q: 'Is the free check really free?', a: 'Yes — the Driver, Conductor, and name-alignment verdict cost nothing and need no signup. You only pay if you want a full name-correction report.' },
  { q: 'What system do you use?', a: 'Chaldean numerology, not Pythagorean — the older, letter-frequency-based system most professional numerologists use for name corrections.' },
  { q: 'Do I need to change my legal name?', a: 'No. Most people use a corrected spelling only on social media, business cards, or informally — a legal name change is entirely optional.' },
  { q: 'How is this different from other numerology sites?', a: 'Every corrected name is checked against your Driver, Conductor, and Lo Shu grid together, not just a single lucky number, and reviewed by a numerologist before it reaches you.' },
]

export function PublicTrustBar() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-white/50 text-sm py-6">
      <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-gold-400" />Instant analysis</span>
      <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-gold-400" />Private &amp; secure</span>
      <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-gold-400" />4.9 / 5 rating</span>
      <span className="flex items-center gap-1.5"><Users2 className="w-4 h-4 text-gold-400" />50k+ readings</span>
    </div>
  )
}

export function PublicMarketingSections() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="max-w-5xl mx-auto px-6 pb-20 space-y-20">
      {/* How it works */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">How it works</h2>
          <p className="text-white/50 text-sm">Three simple steps to a name that finally works with you.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-6">
              <p className="text-gold-400 text-xs font-mono mb-2">{s.n}</p>
              <h3 className="font-semibold mb-1.5">{s.title}</h3>
              <p className="text-sm text-white/50">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="card p-6">
                <div className="w-10 h-10 rounded-xl bg-gold-400/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-gold-400" />
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-white/50">{f.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-10">What people say</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.author} className="card p-6">
              <div className="flex gap-0.5 mb-3 text-gold-400">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <p className="text-sm text-white/70 mb-3 leading-relaxed">"{t.quote}"</p>
              <p className="text-xs text-white/40">— {t.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-10">Frequently asked</h2>
        <div className="max-w-2xl mx-auto space-y-2">
          {FAQS.map((f, i) => (
            <div key={f.q} className="card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="font-medium text-sm">{f.q}</span>
                {openFaq === i ? <Minus className="w-4 h-4 text-gold-400 flex-shrink-0" /> : <Plus className="w-4 h-4 text-gold-400 flex-shrink-0" />}
              </button>
              {openFaq === i && <p className="px-4 pb-4 text-sm text-white/50">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

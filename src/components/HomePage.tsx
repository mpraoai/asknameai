import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, ArrowRight, Star, ShieldCheck, LogIn, Calculator, Baby, Smartphone,
  Building2, Globe, Grid3x3, Plus, Minus,
} from 'lucide-react'
import { PublicFreeToolsGrid } from './PublicFreeToolsGrid'

interface HomePageProps {
  onOpenAuth: () => void
  onOpenAdmin: () => void
}

const STEPS = [
  { n: '01', title: 'Pick a free tool', body: 'Name check, baby names, mobile, business, domain, or a full instant chart — no signup needed.' },
  { n: '02', title: 'See your result instantly', body: 'Every free tool gives a real, calculated answer in seconds, not a generic teaser.' },
  { n: '03', title: 'Go deeper if you want to', body: 'Unlock a full expert-reviewed report and corrected spelling, or talk to a numerologist directly.' },
]

const TESTIMONIALS = [
  { quote: 'The letter-by-letter breakdown finally made me understand why my name needed correcting.', author: 'Priya S., Bengaluru' },
  { quote: 'Checked my business name before registering it — worth five minutes.', author: 'Arjun M., Pune' },
  { quote: 'Used the baby name tool for our daughter. Every relative loved the shortlist.', author: 'Anitha R., Chennai' },
]

const FAQS = [
  { q: 'Are the free tools actually free?', a: "Yes — every tool on this page runs a real calculation with no signup and no payment. You only pay if you want an expert-reviewed full report." },
  { q: 'What numerology system do you use?', a: 'Chaldean numerology — the older, letter-frequency-based system most professional numerologists use for name corrections, not the simpler Pythagorean system.' },
  { q: 'Is my information stored?', a: "Nothing is stored unless you choose to unlock a full report or ask a numerologist to follow up. See our Privacy Policy for details." },
  { q: 'How is this different from a generic numerology app?', a: 'Every result here is grounded in your real Driver, Conductor and Lo Shu grid together, and a human numerologist reviews anything you choose to pay for.' },
]

export function HomePage({ onOpenAuth, onOpenAdmin }: HomePageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen lovable-bg">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#0d0b1f]/70 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold lovable-hero-text">AskNameAI</span>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
          <a href="#tools" className="hover:text-white transition-colors">Free tools</a>
          <Link to="/free-check" className="hover:text-white transition-colors">Name check</Link>
          <Link to="/numerology-chart" className="hover:text-white transition-colors">Free chart</Link>
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={onOpenAdmin} className="hidden sm:block text-xs text-white/30 hover:text-white/60 transition-colors">Admin</button>
          <button onClick={onOpenAuth} className="btn-lovable-primary text-sm px-5 py-2.5 flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            Login / Sign Up
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16 text-center">
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 text-xs px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            Chaldean Numerology · Name Correction · Baby Names
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Every number in your name,
            <span className="lovable-hero-text"> decoded instantly.</span>
          </h1>
          <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
            Six free tools, real Chaldean calculations, zero signup. Find out what your name, your baby's name, or your business name is really saying — then go deeper if you want to.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Link to="/free-check" className="btn-lovable-primary text-lg px-8 py-4 flex items-center justify-center gap-2">
              Check My Name Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#tools" className="bg-white/5 border border-white/15 text-white text-lg px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all">
              See all free tools
            </a>
          </div>
          <p className="text-white/30 text-sm">No signup · Instant result · 100% private</p>
        </div>

        <div className="relative max-w-3xl mx-auto mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Names Checked', value: '1,00,000+' },
            { label: 'Reports Delivered', value: '21,000+' },
            { label: 'Rating', value: '4.8★' },
            { label: 'Free Tools', value: '6' },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/10 rounded-2xl py-5">
              <p className="text-2xl font-bold lovable-hero-text">{s.value}</p>
              <p className="text-xs text-white/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div id="tools">
        <PublicFreeToolsGrid />
      </div>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Three steps, no guesswork.</h2>
            <p className="text-white/50">From curiosity to a real answer, in under a minute.</p>
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
        </div>
      </section>

      {/* What we check */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Built around your whole identity, not just your first name.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Calculator, label: 'Personal name', color: 'text-indigo-300' },
              { icon: Baby, label: 'Baby name', color: 'text-pink-300' },
              { icon: Grid3x3, label: 'Full birth chart', color: 'text-cyan-300' },
              { icon: Smartphone, label: 'Mobile number', color: 'text-sky-300' },
              { icon: Building2, label: 'Business name', color: 'text-emerald-300' },
              { icon: Globe, label: 'Domain name', color: 'text-violet-300' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4">
                <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                <span className="text-sm text-white/70">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <h2 className="text-3xl font-bold text-center mb-12">What people say</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
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
      <section className="py-20 px-6 bg-white/[0.02]">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently asked</h2>
        <div className="max-w-2xl mx-auto space-y-2">
          {FAQS.map((f, i) => (
            <div key={f.q} className="card overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
                <span className="font-medium text-sm">{f.q}</span>
                {openFaq === i ? <Minus className="w-4 h-4 text-gold-400 flex-shrink-0" /> : <Plus className="w-4 h-4 text-gold-400 flex-shrink-0" />}
              </button>
              {openFaq === i && <p className="px-4 pb-4 text-sm text-white/50">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto card p-10 text-center border-2 border-purple-400/20 bg-gradient-to-br from-indigo-500/10 to-purple-600/10">
          <ShieldCheck className="w-8 h-8 text-purple-300 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to see what your name says?</h2>
          <p className="text-white/50 mb-6">Start with any free tool above — no signup required.</p>
          <Link to="/free-check" className="btn-lovable-primary text-lg px-8 py-4 inline-flex items-center gap-2">
            Check My Name Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <span>© {new Date().getFullYear()} AskNameAI — Chaldean Numerology &amp; Lo Shu analysis.</span>
          <div className="flex items-center gap-5">
            <Link to="/free-check" className="hover:text-white/60 transition-colors">Free Check</Link>
            <Link to="/numerology-chart" className="hover:text-white/60 transition-colors">Free Chart</Link>
            <Link to="/privacy-policy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

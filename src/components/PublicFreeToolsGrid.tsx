import { Link } from 'react-router-dom'
import { Calculator, Baby, Sparkles, Smartphone, Building2, Globe, ArrowRight } from 'lucide-react'

interface ToolCard {
  code: string
  badge: string
  title: string
  description: string
  features: string[]
  cta: string
  href: string
  icon: typeof Calculator
  from: string
  to: string
  glow: string
}

const TOOLS: ToolCard[] = [
  {
    code: 'NC', badge: 'FREE CHECK', title: 'Name Correction',
    description: 'Check if your name is numerologically aligned with your birth date, and see a suggested correction instantly.',
    features: ['Instant Driver/Conductor verdict', 'Letter-by-letter Chaldean breakdown', 'Suggested spelling if misaligned'],
    cta: 'Check my name', href: '/free-check', icon: Calculator,
    from: 'from-indigo-500', to: 'to-purple-600', glow: 'shadow-purple-500/20',
  },
  {
    code: 'BN', badge: 'FREE CHECK', title: 'Baby Name Suggestions',
    description: "Get auspicious baby names matched to your child's Driver, Conductor and Lo Shu grid.",
    features: ['Religion-aware suggestions', 'Numerology score per name', 'Save your favorites'],
    cta: 'Find baby names', href: '/baby-check', icon: Baby,
    from: 'from-orange-400', to: 'to-pink-500', glow: 'shadow-pink-500/20',
  },
  {
    code: 'FC', badge: 'INSTANT', title: 'Free Numerology Chart',
    description: 'See your Mulank, Bhagyank, name number, Lo Shu planes and current Personal Year — no report needed.',
    features: ['Full Lo Shu grid visual', 'Personal Year meaning', 'No unlock wall'],
    cta: 'Create my chart', href: '/numerology-chart', icon: Sparkles,
    from: 'from-teal-400', to: 'to-cyan-600', glow: 'shadow-cyan-500/20',
  },
  {
    code: 'MN', badge: 'FREE CHECK', title: 'Mobile Number Analysis',
    description: 'Find the numerology value hiding in your mobile number and what it means.',
    features: ['Every digit added and reduced', 'Instant compound meaning', 'Works for any number'],
    cta: 'Analyse my number', href: '/mobile-check', icon: Smartphone,
    from: 'from-blue-500', to: 'to-sky-600', glow: 'shadow-sky-500/20',
  },
  {
    code: 'BC', badge: 'FREE CHECK', title: 'Business Name Correction',
    description: 'Analyse your business or brand name the same way we analyse a personal name.',
    features: ['Chaldean values on trading name', 'Instant compound meaning', 'Talk to a numerologist after'],
    cta: 'Check a business name', href: '/business-check', icon: Building2,
    from: 'from-emerald-500', to: 'to-green-600', glow: 'shadow-emerald-500/20',
  },
  {
    code: 'DN', badge: 'FREE CHECK', title: 'Domain Name Numerology',
    description: 'See what your website domain adds up to, before or after you register it.',
    features: ['TLD ignored automatically', 'Great for naming a new brand', 'Instant compound meaning'],
    cta: 'Check a domain', href: '/domain-check', icon: Globe,
    from: 'from-fuchsia-500', to: 'to-violet-600', glow: 'shadow-violet-500/20',
  },
]

export function PublicFreeToolsGrid() {
  return (
    <section className="py-20 bg-gradient-to-b from-[#0d0b1f] to-[#150f2e]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-300 bg-indigo-400/10 px-3 py-1 rounded-full mb-4">No payment required</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-4">Six free tools you can use right now.</h2>
        <p className="text-white/50 text-center max-w-xl mx-auto mb-14">Try a focused calculation before deciding whether you need a full name correction report.</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.code}
                to={tool.href}
                className={`group relative bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-xl ${tool.glow}`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.from} ${tool.to} flex items-center justify-center text-white font-bold text-xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wide text-white/40 bg-white/5 px-2 py-1 rounded-full">{tool.badge}</span>
                </div>
                <p className="text-[10px] font-mono text-white/30 mb-1">{tool.code}</p>
                <h3 className="text-lg font-bold text-white mb-2">{tool.title}</h3>
                <p className="text-sm text-white/50 mb-4 leading-relaxed">{tool.description}</p>
                <ul className="space-y-1.5 mb-5">
                  {tool.features.map((f) => (
                    <li key={f} className="text-xs text-white/40 flex items-start gap-1.5">
                      <span className={`mt-1.5 w-1 h-1 rounded-full bg-gradient-to-r ${tool.from} ${tool.to} flex-shrink-0`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <span className={`text-sm font-semibold bg-gradient-to-r ${tool.from} ${tool.to} bg-clip-text text-transparent flex items-center gap-1.5 group-hover:gap-2.5 transition-all`}>
                  {tool.cta}
                  <ArrowRight className="w-3.5 h-3.5 text-white/60" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

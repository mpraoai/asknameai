import { useNavigate } from 'react-router-dom'
import { Sparkles, Star, Moon, Zap } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
            <Star className="w-5 h-5 text-navy-900" fill="currentColor" />
          </div>
          <span className="text-xl font-bold gradient-text">AskNameAI</span>
        </div>
        <button
          onClick={() => navigate('/free-check')}
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          Free Check
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-3xl text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span className="text-sm text-white/70">Ancient Chaldean Numerology + AI</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Is Your Name <span className="gradient-text">Lucky</span> for You?
          </h1>
          <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
            Discover whether your name aligns with your birth numbers. Get a free
            compatibility check and personalized name correction suggestions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/free-check')}
              className="btn-primary text-lg px-8 py-4 animate-pulse-glow"
            >
              Start Free Name Check
            </button>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            <div className="card p-6 text-left hover:border-gold-400/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center mb-4">
                <Moon className="w-6 h-6 text-gold-400" />
              </div>
              <h3 className="font-semibold mb-2">Driver & Conductor</h3>
              <p className="text-sm text-white/50">
                Calculate your birth numbers that govern your life path and energy.
              </p>
            </div>
            <div className="card p-6 text-left hover:border-gold-400/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-gold-400" />
              </div>
              <h3 className="font-semibold mb-2">Name Compatibility</h3>
              <p className="text-sm text-white/50">
                Check if your name's numerological value aligns with your birth numbers.
              </p>
            </div>
            <div className="card p-6 text-left hover:border-gold-400/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-gold-400" />
              </div>
              <h3 className="font-semibold mb-2">AI Suggestions</h3>
              <p className="text-sm text-white/50">
                Get smart spelling corrections that harmonize your name with your numbers.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-sm text-white/30">
        AskNameAI &copy; 2026 - Powered by Chaldean Numerology
      </footer>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold gradient-text">AskNameAI</span>
      </header>

      <main className="flex-1 px-6 py-8 pb-20">
        <div className="max-w-2xl mx-auto space-y-6 text-white/70 text-sm leading-relaxed">
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-white/40 text-xs">Last updated September 2026</p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">What we collect</h2>
            <p>To run a numerology check, we collect your name, date of birth, and gender. If you ask a numerologist to reach out, we also collect a mobile number and/or email address. This is the minimum needed to calculate your reading and, if you choose, connect you with a numerologist.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">How we use it</h2>
            <p>Your details are used to calculate your numerology result, save it to your account if you create one, and — only if you submit the "unlock" form — share your contact details with a numerologist on our platform so they can follow up with your full reading.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">How long we keep it</h2>
            <p>We keep your report data for as long as your account is active. You can request deletion of your data at any time from your account dashboard, or by contacting us — see below.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Your rights</h2>
            <p>You can request a copy of the data we hold about you, or request that it be deleted, at any time. In your Customer Dashboard, use "Request my data be deleted" — we'll act on it and confirm once it's done.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Numerology disclaimer</h2>
            <p>AskNameAI's readings are for entertainment and self-reflection purposes. Numerology is not a verified science, and results should not be treated as professional, medical, financial, or legal advice.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p>Questions about your data? Reach us through the contact details on our homepage.</p>
          </section>
        </div>
      </main>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar, Users } from 'lucide-react'
import { calculateNumerology, NumerologyInput } from '../lib/numerology'

export default function FreeCheckForm() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !dob) {
      setError('Please fill in all fields')
      return
    }
    const input: NumerologyInput = { firstName, lastName, dob, gender }
    const result = calculateNumerology(input)
    const encoded = btoa(JSON.stringify(result))
    navigate(`/report/${encoded}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold gradient-text">AskNameAI</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-8">
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
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. SAIKIRAN"
                  className="input-field pl-11"
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
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. KADABOINA"
                  className="input-field pl-11"
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
                  onChange={(e) => setDob(e.target.value)}
                  className="input-field pl-11"
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
                  className="input-field pl-11 appearance-none"
                >
                  <option value="male" className="bg-navy-800">Male</option>
                  <option value="female" className="bg-navy-800">Female</option>
                  <option value="other" className="bg-navy-800">Other</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full text-lg">
              Check My Name
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

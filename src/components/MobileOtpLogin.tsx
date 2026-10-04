import React, { useState } from 'react';
import { Loader2, ChevronLeft } from 'lucide-react';
import { sendOTP, verifyOTP, loginWithMobile, checkMobileExists, getCurrentProfile, UserProfile } from '../services/authService';
import { supabase } from '../lib/supabase';

interface Props {
  /** Called once a real Supabase session exists for this user. */
  onSignedIn: (profile: UserProfile) => void;
  /** Shown when the mobile number has no account. */
  noAccountMessage: React.ReactNode;
}

/**
 * Existing-user login shared by /numerologist/login and /admin/login.
 * Same sequence AuthModal's login uses: verifyOTP only checks the code, so
 * loginWithMobile (signInWithPassword) is what actually creates the session.
 */
export function MobileOtpLogin({ onSignedIn, noAccountMessage }: Props) {
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [devOTP, setDevOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode>('');

  const handleSend = async () => {
    setError('');
    setLoading(true);
    if (!(await checkMobileExists(mobile))) {
      setLoading(false);
      return setError(noAccountMessage);
    }
    const res = await sendOTP(mobile);
    if (!res.success) {
      setLoading(false);
      return setError(res.error || 'Could not send a code');
    }
    // No SMS gateway yet - surface the code locally, never in production builds.
    if (import.meta.env.DEV) {
      const { data } = await supabase
        .from('otp_codes')
        .select('code')
        .eq('mobile_number', mobile)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setDevOTP(data?.code || '');
    }
    setLoading(false);
    setStep('otp');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || loading) return;
    setError('');
    setLoading(true);
    const verified = await verifyOTP(mobile, code);
    if (!verified.success) {
      setLoading(false);
      return setError(verified.error || 'Incorrect code');
    }
    const login = await loginWithMobile(mobile);
    if (!login.success) {
      setLoading(false);
      return setError(login.error || 'Login failed');
    }
    const profile = await getCurrentProfile();
    setLoading(false);
    if (!profile) return setError('Signed in, but your profile could not be loaded. Please try again.');
    onSignedIn(profile);
  };

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3">{error}</div>}

      {step === 'mobile' && (
        <form onSubmit={(e) => { e.preventDefault(); if (mobile.length === 10 && !loading) handleSend(); }} className="space-y-4">
          <input
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || mobile.length !== 10}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send code
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Code sent to <span className="font-semibold">{mobile}</span>
          </p>
          {devOTP && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 text-center">
              Dev mode — code: <b>{devOTP}</b>
            </p>
          )}
          <input
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full text-center tracking-[0.3em] text-lg border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Verify &amp; sign in
          </button>
          <button
            type="button"
            onClick={() => { setStep('mobile'); setCode(''); setDevOTP(''); setError(''); }}
            className="w-full text-sm text-gray-500 hover:text-indigo-600 flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Change number
          </button>
        </form>
      )}
    </div>
  );
}

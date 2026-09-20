import React, { useEffect, useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { sendOTP, verifyOTP, UserProfile } from '../services/authService';
import { supabase } from '../lib/supabase';

const SESSION_KEY = 'asknameai_admin_mfa_verified';

/**
 * Second-factor gate for /admin/dashboard (PRD Section 16: "MFA for your
 * own admin account... at minimum as an option, ideally required"). This
 * app's auth is mobile-OTP-as-password, not email/password + Supabase
 * MFA/TOTP, so a standard authenticator-app factor doesn't fit cleanly -
 * this reuses the same OTP send/verify the signup flow already relies on
 * as a real second factor, required once per browser session before the
 * admin console renders.
 */
export const AdminMfaGate: React.FC<{ user: UserProfile; children: React.ReactNode }> = ({ user, children }) => {
  const [verified, setVerified] = useState(() => sessionStorage.getItem(SESSION_KEY) === user.id);
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [devOTP, setDevOTP] = useState('');

  useEffect(() => {
    if (!verified && !otpSent) handleSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    setSending(true);
    setError('');
    const res = await sendOTP(user.mobile_number);
    setSending(false);
    if (!res.success) {
      setError(res.error || 'Could not send a verification code');
      return;
    }
    // Dev only: no SMS gateway is wired up yet, so surface the code here the same way AuthModal does for signup.
    const { data } = await supabase
      .from('otp_codes')
      .select('code')
      .eq('mobile_number', user.mobile_number)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setDevOTP(data.code);
    setOtpSent(true);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || verifying) return;
    setVerifying(true);
    setError('');
    const res = await verifyOTP(user.mobile_number, code);
    setVerifying(false);
    if (!res.success) {
      setError(res.error || 'Incorrect code');
      return;
    }
    sessionStorage.setItem(SESSION_KEY, user.id);
    setVerified(true);
  };

  if (verified) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-sm">
        <ShieldCheck className="w-10 h-10 text-indigo-400 mx-auto" />
        <h1 className="text-lg font-display font-semibold text-gray-800">Verify it's you</h1>
        <p className="text-sm text-gray-500">
          For extra security, the owner console requires a one-time code sent to your registered mobile number ending in {user.mobile_number.slice(-4)}.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {otpSent ? (
          <form onSubmit={handleVerify} className="space-y-3">
            {devOTP && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">Dev mode — code: <b>{devOTP}</b></p>}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              inputMode="numeric"
              className="w-full text-center tracking-[0.3em] text-lg px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="submit"
              disabled={code.length !== 6 || verifying}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
              Verify
            </button>
            <button type="button" onClick={handleSend} disabled={sending} className="text-xs text-indigo-600 hover:underline disabled:opacity-50">
              {sending ? 'Resending...' : 'Resend code'}
            </button>
          </form>
        ) : (
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}
            Send verification code
          </button>
        )}
      </div>
    </div>
  );
};

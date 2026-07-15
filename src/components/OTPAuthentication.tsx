import React, { useState, useRef, useEffect } from 'react';
import { Phone, Loader2, KeyRound, ArrowLeft, Check, AlertCircle, Shield, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OTPAuthenticationProps {
  onAuthenticated: (mobileNumber: string, firstName: string, lastName: string) => void;
  onBack: () => void;
}

export const OTPAuthentication: React.FC<OTPAuthenticationProps> = ({ onAuthenticated, onBack }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [mobileNumber, setMobileNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const sendOtp = async () => {
    if (!mobileNumber.trim() || mobileNumber.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/otp-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          action: 'send-otp',
          mobile_number: mobileNumber,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');

      if (data.dev_otp) setDevOtp(data.dev_otp);
      setStep('otp');
      setResendTimer(30);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    const newOtp = ['','','','','',''];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    if (pasted.length > 0) otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const verifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/otp-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          action: 'verify-otp',
          mobile_number: mobileNumber,
          code: otpCode,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'OTP verification failed');

      if (data.access_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        if (sessionError) console.error('Session set error:', sessionError);
      }

      onAuthenticated(mobileNumber, firstName, lastName);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-brand-600 transition-colors mb-6">
          <ArrowLeft className="w-5 h-5" /> Back to Plans
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-2xl mb-4">
              {step === 'phone' ? <Phone className="w-8 h-8 text-brand-600" /> : <KeyRound className="w-8 h-8 text-brand-600" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {step === 'phone' ? 'Login with OTP' : 'Verify OTP'}
            </h2>
            <p className="text-gray-500 text-sm">
              {step === 'phone'
                ? 'Enter your mobile number to receive an OTP'
                : `Enter the 6-digit code sent to ${mobileNumber}`}
            </p>
          </div>

          {step === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name (Optional)</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g., Rahul"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name (Optional)</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g., Sharma"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-3 bg-gray-100 rounded-xl border-2 border-gray-200 text-gray-700 font-medium">+91</span>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="98765 43210"
                    maxLength={10}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <button
                onClick={sendOtp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold py-4 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending OTP...</> : <><Send className="w-5 h-5" /> Send OTP</>}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-5">
              {devOtp && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 text-center">
                  Dev mode - Your OTP: <span className="font-bold text-lg">{devOtp}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Enter 6-digit OTP</label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <button
                onClick={verifyOtp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold py-4 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <><Check className="w-5 h-5" /> Verify & Continue</>}
              </button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <span className="text-sm text-gray-400">Resend OTP in {resendTimer}s</span>
                ) : (
                  <button onClick={sendOtp} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mt-6">
            <Shield className="w-4 h-4" />
            <span>Secure OTP authentication · Your data is protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, User, ShieldCheck, Loader2, ChevronLeft, CheckCircle2 } from 'lucide-react';
import {
  sendOTP, verifyOTP, registerUser, loginWithMobile, checkMobileExists
} from '../services/authService';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

type AuthMode = 'select' | 'register' | 'login';
type RegisterStep = 'details' | 'otp' | 'success';
type LoginStep = 'mobile' | 'otp' | 'success';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('select');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('details');
  const [loginStep, setLoginStep] = useState<LoginStep>('mobile');

  // Registration form data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');

  // OTP
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOTP, setDevOTP] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setMode('select');
      setRegisterStep('details');
      setLoginStep('mobile');
      setFirstName('');
      setLastName('');
      setMobileNumber('');
      setEmail('');
      setOtpCode('');
      setError('');
      setDevOTP('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateMobile = (mobile: string) => /^[6-9]\d{9}$/.test(mobile);
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRegisterSubmit = async () => {
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }
    if (!validateMobile(mobileNumber)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const exists = await checkMobileExists(mobileNumber);
    if (exists) {
      setError('An account with this mobile number already exists. Please login instead.');
      setLoading(false);
      return;
    }

    const otpResult = await sendOTP(mobileNumber);
    if (!otpResult.success) {
      setError(otpResult.error || 'Failed to send OTP. Please try again.');
      setLoading(false);
      return;
    }

    // Dev only: show OTP in console
    const { data } = await supabase
      .from('otp_codes')
      .select('code')
      .eq('mobile_number', mobileNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setDevOTP(data.code);

    setRegisterStep('otp');
    setLoading(false);
  };

  const handleRegisterOTPVerify = async () => {
    setError('');
    setLoading(true);

    const verifyResult = await verifyOTP(mobileNumber, otpCode);
    if (!verifyResult.success) {
      setError(verifyResult.error || 'OTP verification failed.');
      setLoading(false);
      return;
    }

    const regResult = await registerUser({
      first_name: firstName,
      last_name: lastName,
      mobile_number: mobileNumber,
      email,
    });

    if (!regResult.success) {
      setError(regResult.error || 'Registration failed.');
      setLoading(false);
      return;
    }

    setRegisterStep('success');
    setLoading(false);

    setTimeout(() => {
      const profile: UserProfile = {
        id: '',
        auth_user_id: regResult.user?.id || null,
        first_name: firstName,
        last_name: lastName,
        mobile_number: mobileNumber,
        email,
        is_admin: false,
      };
      onAuthSuccess(profile);
    }, 1500);
  };

  const handleLoginMobileSubmit = async () => {
    setError('');

    if (!validateMobile(mobileNumber)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    const exists = await checkMobileExists(mobileNumber);
    if (!exists) {
      setError('No account found with this mobile number. Please register first.');
      setLoading(false);
      return;
    }

    const otpResult = await sendOTP(mobileNumber);
    if (!otpResult.success) {
      setError(otpResult.error || 'Failed to send OTP.');
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('otp_codes')
      .select('code')
      .eq('mobile_number', mobileNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setDevOTP(data.code);

    setLoginStep('otp');
    setLoading(false);
  };

  const handleLoginOTPVerify = async () => {
    setError('');
    setLoading(true);

    const verifyResult = await verifyOTP(mobileNumber, otpCode);
    if (!verifyResult.success) {
      setError(verifyResult.error || 'OTP verification failed.');
      setLoading(false);
      return;
    }

    const loginResult = await loginWithMobile(mobileNumber);
    if (!loginResult.success) {
      setError(loginResult.error || 'Login failed.');
      setLoading(false);
      return;
    }

    setLoginStep('success');
    setLoading(false);

    setTimeout(async () => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .maybeSingle();

      if (profile) {
        onAuthSuccess(profile as UserProfile);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'select' && 'Welcome to AskNameAI'}
            {mode === 'register' && 'Create Your Account'}
            {mode === 'login' && 'Login to Your Account'}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Mode Select */}
          {mode === 'select' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-center mb-6">
                Get personalized numerology readings, name corrections, and AI-powered insights.
              </p>
              <button
                onClick={() => setMode('register')}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                New User? Register Here
              </button>
              <button
                onClick={() => setMode('login')}
                className="w-full bg-teal-50 text-teal-700 border-2 border-teal-200 py-4 rounded-xl font-semibold hover:bg-teal-100 transition-all"
              >
                Already Registered? Login
              </button>
            </div>
          )}

          {/* Registration Flow */}
          {mode === 'register' && registerStep === 'details' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="First name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email ID</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <button
                onClick={handleRegisterSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP & Continue'}
              </button>

              <button onClick={() => setMode('select')} className="w-full text-center text-sm text-gray-500 hover:text-teal-600 flex items-center justify-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>
          )}

          {/* Registration OTP Step */}
          {mode === 'register' && registerStep === 'otp' && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Verify Your Mobile</h3>
                <p className="text-sm text-gray-600">
                  We've sent a 6-digit OTP to <span className="font-semibold">{mobileNumber}</span>
                </p>
                {devOTP && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 inline-block px-3 py-1 rounded-full">
                    Dev mode OTP: <span className="font-bold">{devOTP}</span>
                  </p>
                )}
              </div>

              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center text-2xl tracking-[0.5em] py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="------"
                maxLength={6}
              />

              <button
                onClick={handleRegisterOTPVerify}
                disabled={loading || otpCode.length !== 6}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Create Account'}
              </button>

              <button
                onClick={() => { setRegisterStep('details'); setOtpCode(''); setError(''); }}
                className="w-full text-center text-sm text-gray-500 hover:text-teal-600 flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Change details
              </button>
            </div>
          )}

          {/* Registration Success */}
          {mode === 'register' && registerStep === 'success' && (
            <div className="text-center py-8">
              <div className="bg-teal-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Account Created Successfully!</h3>
              <p className="text-gray-600">Welcome to AskNameAI, {firstName}!</p>
            </div>
          )}

          {/* Login Flow - Mobile Step */}
          {mode === 'login' && loginStep === 'mobile' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                </div>
              </div>

              <button
                onClick={handleLoginMobileSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
              </button>

              <button onClick={() => setMode('select')} className="w-full text-center text-sm text-gray-500 hover:text-teal-600 flex items-center justify-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>
          )}

          {/* Login OTP Step */}
          {mode === 'login' && loginStep === 'otp' && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Enter OTP</h3>
                <p className="text-sm text-gray-600">
                  OTP sent to <span className="font-semibold">{mobileNumber}</span>
                </p>
                {devOTP && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 inline-block px-3 py-1 rounded-full">
                    Dev mode OTP: <span className="font-bold">{devOTP}</span>
                  </p>
                )}
              </div>

              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center text-2xl tracking-[0.5em] py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="------"
                maxLength={6}
              />

              <button
                onClick={handleLoginOTPVerify}
                disabled={loading || otpCode.length !== 6}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
              </button>

              <button
                onClick={() => { setLoginStep('mobile'); setOtpCode(''); setError(''); }}
                className="w-full text-center text-sm text-gray-500 hover:text-teal-600 flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Change number
              </button>
            </div>
          )}

          {/* Login Success */}
          {mode === 'login' && loginStep === 'success' && (
            <div className="text-center py-8">
              <div className="bg-teal-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Login Successful!</h3>
              <p className="text-gray-600">Welcome back!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

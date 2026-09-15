import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { registerUser, sendOTP, verifyOTP, getCurrentProfile, UserProfile } from '../services/authService';
import { becomeNumerologist } from '../services/numerologistService';

type Step = 'mobile' | 'otp' | 'details' | 'business' | 'done';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export default function NumerologistOnboarding({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(true);

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    const result = await sendOTP(mobile);
    setLoading(false);
    if (!result.success) return setError(result.error || 'Could not send OTP');
    setStep('otp');
  };

  const handleVerifyOtp = async () => {
    setError('');
    setLoading(true);
    const result = await verifyOTP(mobile, otp);
    setLoading(false);
    if (!result.success) return setError(result.error || 'Invalid code');
    setStep(isNewUser ? 'details' : 'business');
  };

  const handleRegisterDetails = async () => {
    setError('');
    setLoading(true);
    const result = await registerUser({
      first_name: firstName,
      last_name: lastName,
      mobile_number: mobile,
      email,
    });
    setLoading(false);
    if (!result.success) return setError(result.error || 'Registration failed');
    setStep('business');
  };

  const handleCreateBusiness = async () => {
    setError('');
    setLoading(true);
    const profile = await getCurrentProfile();
    if (!profile) {
      setLoading(false);
      return setError('Could not find your account. Please try logging in again.');
    }
    const result = await becomeNumerologist(profile, businessName);
    setLoading(false);
    if (!result.success) return setError(result.error || 'Could not set up your numerologist profile');
    setStep('done');
    onComplete(profile);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 mt-12">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Become an AskNameAI Numerologist</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Set up your practice in a few steps — no coding needed.
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}

      {step === 'mobile' && (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm justify-center mb-2">
            <button
              onClick={() => setIsNewUser(true)}
              className={`px-3 py-1 rounded-full ${isNewUser ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              New here
            </button>
            <button
              onClick={() => setIsNewUser(false)}
              className={`px-3 py-1 rounded-full ${!isNewUser ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Already registered
            </button>
          </div>
          <input
            type="tel"
            placeholder="Mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3"
          />
          <button
            disabled={loading || !mobile}
            onClick={handleSendOtp}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send OTP
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3"
          />
          <button
            disabled={loading || !otp}
            onClick={handleVerifyOtp}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Verify
          </button>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-4">
          <input
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3"
          />
          <input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3"
          />
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3"
          />
          <button
            disabled={loading || !firstName || !lastName || !email}
            onClick={handleRegisterDetails}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Continue
          </button>
        </div>
      )}

      {step === 'business' && (
        <div className="space-y-4">
          <input
            placeholder="Your business or practice name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3"
          />
          <button
            disabled={loading || !businessName}
            onClick={handleCreateBusiness}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Launch My Dashboard
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center text-green-700 font-medium">
          You're all set! Redirecting to your dashboard...
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { getCurrentProfile, signOut, UserProfile } from '../services/authService';
import { MobileOtpLogin } from '../components/MobileOtpLogin';

// Must match SESSION_KEY in AdminMfaGate.tsx. Signing in here already verified
// a code sent to the admin's mobile, so the gate's second code is skipped.
const ADMIN_MFA_SESSION_KEY = 'asknameai_admin_mfa_verified';

/** Sign-in for the product owner. Only accounts with is_admin = true get through. */
export default function AdminLogin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      // Already signed in as admin: AdminMfaGate still asks for its code, since none was entered here.
      const profile = await getCurrentProfile();
      if (profile?.is_admin) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignedIn = async (profile: UserProfile) => {
    if (!profile.is_admin) {
      await signOut();
      setError("This account isn't an administrator.");
      return;
    }
    try {
      sessionStorage.setItem(ADMIN_MFA_SESSION_KEY, profile.id);
    } catch {
      // Storage blocked: the gate will just ask for its own code.
    }
    navigate('/admin/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full shadow-sm">
        <div className="text-center mb-6 space-y-2">
          <ShieldCheck className="w-10 h-10 text-indigo-400 mx-auto" />
          <h1 className="text-lg font-display font-semibold text-gray-800">Owner console sign in</h1>
          <p className="text-sm text-gray-500">Administrator accounts only.</p>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}

        {checking ? (
          <p className="text-center text-sm text-gray-400">Loading...</p>
        ) : (
          <MobileOtpLogin onSignedIn={handleSignedIn} noAccountMessage="No account with this number." />
        )}
      </div>
    </div>
  );
}

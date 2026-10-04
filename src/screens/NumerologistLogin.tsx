import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { getCurrentProfile } from '../services/authService';
import { getMyNumerologistProfile } from '../services/numerologistService';
import { MobileOtpLogin } from '../components/MobileOtpLogin';

/** Sign-in for existing subscribers (numerologists). New ones use /numerologist/onboarding. */
export default function NumerologistLogin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [notNumerologist, setNotNumerologist] = useState(false);

  const routeSignedInUser = async () => {
    if (await getMyNumerologistProfile()) {
      navigate('/numerologist/dashboard', { replace: true });
      return;
    }
    setNotNumerologist(true);
  };

  useEffect(() => {
    (async () => {
      if (await getCurrentProfile()) await routeSignedInUser();
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Numerologist sign in</h1>
          <p className="text-gray-500 mt-2 text-sm">Sign in to your AskNameAI practice dashboard.</p>
        </div>

        {checking ? (
          <p className="text-center text-sm text-gray-400">Loading...</p>
        ) : notNumerologist ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">This account isn't set up as a numerologist yet.</p>
            <Link to="/numerologist/onboarding" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
              Set up my practice
            </Link>
          </div>
        ) : (
          <>
            <MobileOtpLogin
              onSignedIn={routeSignedInUser}
              noAccountMessage={
                <>No account with this number. <Link to="/numerologist/onboarding" className="font-semibold underline">Register as a numerologist</Link></>
              }
            />
            <p className="text-center text-sm text-gray-500 mt-6">
              New to AskNameAI? <Link to="/numerologist/onboarding" className="text-indigo-600 font-semibold hover:underline">Set up your practice</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

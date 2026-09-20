import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut, Receipt, Heart, RefreshCw, ShieldQuestion, Loader2, Trash2, Sparkles } from 'lucide-react';
import { getCurrentProfile, signOut, UserProfile } from '../services/authService';
import {
  getMyReports, getSavedNames, removeSavedName, getMyDeletionRequest, requestDataDeletion,
  MyReport, SavedName, DeletionRequest,
} from '../services/customerDashboardService';

/**
 * The PRD's Customer Dashboard (Section 5c): My Reports, Saved Name Ideas,
 * a Re-check quick action, and an upgrade prompt for free-tier customers -
 * previously missing entirely (only a one-off /numerology/:data report
 * view existed, no persistent account dashboard). New route, new file.
 */
export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null | 'loading'>('loading');
  const [reports, setReports] = useState<MyReport[]>([]);
  const [savedNames, setSavedNames] = useState<SavedName[]>([]);
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await getCurrentProfile();
      setProfile(p);
      if (p) {
        const [r, s, d] = await Promise.all([getMyReports(p), getSavedNames(p.id), getMyDeletionRequest(p.id)]);
        setReports(r);
        setSavedNames(s);
        setDeletionRequest(d);
      }
    })();
  }, []);

  const handleRemoveSaved = async (id: string) => {
    setSavedNames((prev) => prev.filter((n) => n.id !== id));
    await removeSavedName(id);
  };

  const handleDeletionRequest = async () => {
    if (!profile || profile === 'loading' || deleteSubmitting) return;
    setDeleteSubmitting(true);
    const res = await requestDataDeletion(profile.id, deleteReason.trim());
    setDeleteSubmitting(false);
    if (res.success) {
      setDeletionRequest({ id: 'pending', status: 'pending', requested_at: new Date().toISOString() });
      setShowDeleteForm(false);
    }
  };

  if (profile === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm text-center border border-gray-100">
          <ShieldQuestion className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Please log in</h1>
          <p className="text-sm text-gray-500 mb-5">Sign in to see your reports, saved names, and account settings.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-lg text-sm">
            <Home className="w-4 h-4" />Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  const hasAnyPurchase = reports.some((r) => r.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">My Account</p>
          <h1 className="text-lg font-bold text-gray-800">Hi {profile.first_name} 👋</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1.5"><Home className="w-4 h-4" />Home</Link>
          <button onClick={async () => { await signOut(); navigate('/'); }} className="text-sm text-gray-500 hover:text-rose-600 flex items-center gap-1.5">
            <LogOut className="w-4 h-4" />Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {!hasAnyPurchase && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold mb-1">You're on the free tier</p>
              <p className="text-sm opacity-90">Unlock your full report — Life Path, Destiny, Soul Urge — plus corrected-name suggestions.</p>
            </div>
            <button onClick={() => navigate('/free-check')} className="bg-white text-indigo-700 font-semibold text-sm px-5 py-2.5 rounded-lg flex-shrink-0">
              See plans
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Receipt className="w-4 h-4 text-indigo-500" />My Reports</h2>
          {reports.length === 0 ? (
            <p className="text-sm text-gray-400">No reports yet — run a free check to get started.</p>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 capitalize">{r.plan}</p>
                    <p className="text-xs text-gray-400">Driver {r.driver} · Conductor {r.conductor} · {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <button onClick={() => navigate('/free-check')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 flex-shrink-0">
                    <RefreshCw className="w-3.5 h-3.5" />Re-check
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500" />Saved Name Ideas</h2>
          {savedNames.length === 0 ? (
            <p className="text-sm text-gray-400">Names you save from the baby name or business name tools will show up here.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {savedNames.map((n) => (
                <span key={n.id} className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-full pl-3 pr-2 py-1.5 text-sm">
                  {n.name}
                  <button onClick={() => handleRemoveSaved(n.id)} className="text-rose-400 hover:text-rose-700"><Trash2 className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" />Re-check a name</h2>
          <p className="text-sm text-gray-500 mb-4">Run a fresh numerology check any time.</p>
          <button onClick={() => navigate('/free-check')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg">
            Start a check
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-2">Privacy &amp; data</h2>
          <p className="text-sm text-gray-500 mb-4">
            Read our <Link to="/privacy-policy" className="text-indigo-600 hover:underline">Privacy Policy</Link>, or request that your personal data be deleted.
          </p>
          {deletionRequest ? (
            <p className="text-sm bg-amber-50 text-amber-700 border border-amber-100 rounded-lg px-3 py-2 inline-block">
              Deletion request {deletionRequest.status === 'pending' ? 'submitted — we\'ll process it shortly.' : deletionRequest.status}
            </p>
          ) : showDeleteForm ? (
            <div className="space-y-2 max-w-sm">
              <input
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Reason (optional)"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button onClick={handleDeletionRequest} disabled={deleteSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2">
                  {deleteSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm deletion request
                </button>
                <button onClick={() => setShowDeleteForm(false)} className="text-sm text-gray-500 px-4 py-2">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowDeleteForm(true)} className="text-sm font-semibold text-rose-600 hover:text-rose-800">
              Request my data be deleted
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

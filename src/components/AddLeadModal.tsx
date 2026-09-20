import React, { useMemo, useState } from 'react';
import { X, Loader2, UserPlus } from 'lucide-react';
import { captureLead, Lead } from '../services/numerologistService';

interface AddLeadModalProps {
  numerologistId: string;
  existingLeads?: Lead[];
  onClose: () => void;
  onAdded: () => void;
}

const CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'referral', label: 'Referral' },
  { value: 'existing_customer', label: 'Existing Customer' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'Website' },
  { value: 'organic', label: 'Organic Search' },
  { value: 'other', label: 'Other' },
];

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ numerologistId, existingLeads = [], onClose, onAdded }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState('walk_in');
  const [score, setScore] = useState<'hot' | 'warm' | 'cold'>('warm');
  const [referrerSearch, setReferrerSearch] = useState('');
  const [referredByLeadId, setReferredByLeadId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const referrerMatches = useMemo(() => {
    const q = referrerSearch.trim().toLowerCase();
    if (!q) return [];
    return existingLeads
      .filter((l) => `${l.first_name || ''} ${l.last_name || ''}`.toLowerCase().includes(q) || (l.mobile_number || '').includes(q))
      .slice(0, 5);
  }, [existingLeads, referrerSearch]);

  const referrer = existingLeads.find((l) => l.id === referredByLeadId);

  const handleSubmit = async () => {
    if (!firstName.trim() || (!mobile.trim() && !email.trim())) {
      setError('Enter a name and at least a mobile number or email.');
      return;
    }
    setError('');
    setSaving(true);
    const res = await captureLead({
      first_name: firstName.trim(),
      last_name: lastName.trim() || undefined,
      mobile_number: mobile.trim() || undefined,
      email: email.trim() || undefined,
      source_type: 'manual',
      lead_score: score,
      channel,
      assigned_numerologist_id: numerologistId,
      referred_by_lead_id: referredByLeadId || undefined,
    });
    setSaving(false);
    if (!res.success) {
      setError(res.error || 'Could not add lead.');
      return;
    }
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Lead
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 15))}
            placeholder="Mobile number"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
          />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
          <div className="grid grid-cols-2 gap-3">
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900">
              {CHANNEL_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select value={score} onChange={(e) => setScore(e.target.value as 'hot' | 'warm' | 'cold')} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900">
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </div>

          {existingLeads.length > 0 && (
            <div>
              {referrer ? (
                <div className="flex items-center justify-between text-xs bg-fuchsia-50 border border-fuchsia-100 rounded-lg px-3 py-2">
                  <span className="text-fuchsia-700">Referred by <b>{referrer.first_name} {referrer.last_name}</b></span>
                  <button onClick={() => { setReferredByLeadId(''); setReferrerSearch(''); }} className="text-fuchsia-400 hover:text-fuchsia-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    value={referrerSearch}
                    onChange={(e) => setReferrerSearch(e.target.value)}
                    placeholder="Referred by an existing lead? Search name/mobile..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                  />
                  {referrerMatches.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden">
                      {referrerMatches.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => { setReferredByLeadId(l.id); setReferrerSearch(''); }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-fuchsia-50 text-gray-700"
                        >
                          {l.first_name} {l.last_name} {l.mobile_number ? `· ${l.mobile_number}` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Lead
          </button>
        </div>
      </div>
    </div>
  );
};

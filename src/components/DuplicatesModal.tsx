import React, { useState } from 'react';
import { X, Copy, Merge, Loader2, CheckCircle2 } from 'lucide-react';
import { Lead } from '../services/numerologistService';
import { DuplicateGroup, mergeLeads } from '../services/duplicatesService';
import { formatDate } from '../utils/locale';

interface DuplicatesModalProps {
  groups: DuplicateGroup[];
  onClose: () => void;
  onMerged: () => void;
}

/** HubSpot's "Manage duplicates" tool - years of Excel imports and repeat walk-ins mean the same person often exists twice. */
export const DuplicatesModal: React.FC<DuplicatesModalProps> = ({ groups, onClose, onMerged }) => {
  const [primaryByMobile, setPrimaryByMobile] = useState<Record<string, string>>({});
  const [mergingMobile, setMergingMobile] = useState<string | null>(null);
  const [mergedMobiles, setMergedMobiles] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const getPrimary = (group: DuplicateGroup): Lead =>
    group.leads.find((l) => l.id === primaryByMobile[group.mobile_number]) || group.leads[0];

  const handleMerge = async (group: DuplicateGroup) => {
    const primary = getPrimary(group);
    const duplicates = group.leads.filter((l) => l.id !== primary.id);
    setMergingMobile(group.mobile_number);
    setError('');
    for (const dup of duplicates) {
      const res = await mergeLeads(primary.id, dup.id);
      if (!res.success) {
        setError(res.error || 'Could not merge that pair.');
        setMergingMobile(null);
        return;
      }
    }
    setMergingMobile(null);
    setMergedMobiles((prev) => new Set(prev).add(group.mobile_number));
    onMerged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Manage Duplicates ({groups.length})
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-gray-400">
            Same mobile number, more than one lead record — pick which one to keep as primary. The others' notes, reports and tags get folded into it, then removed.
          </p>
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3">{error}</div>}

          {groups.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No duplicates found — your list is clean.</p>
          ) : (
            groups.map((group) => {
              const isMerged = mergedMobiles.has(group.mobile_number);
              const primary = getPrimary(group);
              return (
                <div key={group.mobile_number} className={`border border-gray-100 rounded-xl p-4 ${isMerged ? 'opacity-50' : ''}`}>
                  <p className="text-xs font-semibold text-gray-500 mb-2">{group.mobile_number}</p>
                  <div className="space-y-1.5 mb-3">
                    {group.leads.map((lead) => (
                      <label key={lead.id} className="flex items-center gap-2.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name={`primary-${group.mobile_number}`}
                          checked={primary.id === lead.id}
                          onChange={() => setPrimaryByMobile((prev) => ({ ...prev, [group.mobile_number]: lead.id }))}
                          disabled={isMerged}
                        />
                        <span className="text-gray-800 font-medium">{lead.first_name} {lead.last_name}</span>
                        <span className="text-xs text-gray-400">{lead.email || 'no email'} &middot; added {formatDate(lead.created_at)} &middot; {lead.status}</span>
                      </label>
                    ))}
                  </div>
                  {isMerged ? (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Merged</span>
                  ) : (
                    <button
                      onClick={() => handleMerge(group)}
                      disabled={mergingMobile === group.mobile_number}
                      className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                    >
                      {mergingMobile === group.mobile_number ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Merge className="w-3.5 h-3.5" />}
                      Keep "{primary.first_name}" and merge the rest into it
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

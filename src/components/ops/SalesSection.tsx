import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { getAllLeadsPlatform, PlatformLead } from '../../services/adminService';

const STAGES: { status: PlatformLead['status']; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'converted', label: 'Won' },
  { status: 'lost', label: 'Lost' },
];

const SCORE_SOFT: Record<string, string> = { hot: 'bg-red-100 text-red-700', warm: 'bg-amber-100 text-amber-700', cold: 'bg-blue-100 text-blue-700' };

const REAL_AUTOMATION = [
  'A new lead is auto-assigned the moment it\'s created — no lead sits unassigned unless every numerologist is on a cancelled/past-due plan',
  'The numerologist\'s pipeline flags a deal "stalled" after 7 days with no stage change, and offers an AI-drafted follow-up message',
  'Every lead capture form across the site (name check, baby names, mobile, business, domain) feeds this same pipeline',
];

/** Real platform-wide sales pipeline, grouped by actual lead status — not sample data. */
export const SalesSection: React.FC = () => {
  const [leads, setLeads] = useState<PlatformLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { setLeads(await getAllLeadsPlatform()); setLoading(false); })(); }, []);

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-display font-semibold mb-4">Pipeline — {leads.length} leads platform-wide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-x-auto">
          {STAGES.map((s) => {
            const inStage = leads.filter((l) => l.status === s.status);
            return (
              <div key={s.status} className="bg-gray-50 rounded-lg p-3 min-w-[180px]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase text-gray-500 font-mono">{s.label}</p>
                  <span className="text-xs font-bold text-gray-400">{inStage.length}</span>
                </div>
                <div className="space-y-2">
                  {inStage.length === 0 ? <p className="text-xs text-gray-300">No leads here</p> : inStage.slice(0, 10).map((l) => (
                    <div key={l.id} className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
                      <p className="text-xs font-semibold text-gray-800 truncate">{l.first_name} {l.last_name}</p>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full inline-block mt-1 ${SCORE_SOFT[l.lead_score]}`}>{l.lead_score}</span>
                    </div>
                  ))}
                  {inStage.length > 10 && <p className="text-[10px] text-gray-400">+{inStage.length - 10} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" />Automation (live)</h2>
        <ul className="space-y-2.5">
          {REAL_AUTOMATION.map((r) => (
            <li key={r} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

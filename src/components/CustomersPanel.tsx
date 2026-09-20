import React, { useState } from 'react';
import { Star, Download, RefreshCw, Phone, Mail, Loader2, CheckCircle2, Users2 } from 'lucide-react';
import { Lead, captureLead, buildReferralReport } from '../services/numerologistService';
import { exportCustomersCSV } from '../services/exportService';
import { formatDate } from '../utils/locale';

interface CustomersPanelProps {
  numerologistId: string;
  leads: Lead[];
  onLeadCreated: () => void;
  onSelectLead: (leadId: string) => void;
}

const CHANNEL_LABEL: Record<string, string> = {
  youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp', website: 'Website', referral: 'Referral', existing_customer: 'Existing Customer',
  walk_in: 'Walk-in', organic: 'Organic Search', other: 'Other',
};

export const CustomersPanel: React.FC<CustomersPanelProps> = ({ numerologistId, leads, onLeadCreated, onSelectLead }) => {
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regeneratedIds, setRegeneratedIds] = useState<Set<string>>(new Set());

  const customers = leads.filter((l) => l.status === 'converted');
  const referralGroups = buildReferralReport(leads);

  const handleRegenerate = async (customer: Lead) => {
    setRegeneratingId(customer.id);
    const res = await captureLead({
      first_name: customer.first_name || undefined,
      last_name: customer.last_name || undefined,
      mobile_number: customer.mobile_number || undefined,
      email: customer.email || undefined,
      source_type: 'manual',
      lead_score: 'warm',
      channel: 'existing_customer',
      assigned_numerologist_id: numerologistId,
    });
    setRegeneratingId(null);
    if (res.success) {
      setRegeneratedIds((prev) => new Set(prev).add(customer.id));
      onLeadCreated();
    }
  };

  return (
    <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-400">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          Customers
        </h2>
        <button
          onClick={() => exportCustomersCSV(leads)}
          disabled={customers.length === 0}
          className="border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-40 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Export customers (CSV)
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Every lead that converted into paying business — your database for repeat work and referrals.
        "Regenerate lead" starts a fresh pipeline entry for this customer, ready for their next report or referral.
      </p>

      {customers.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          No converted customers yet — move a deal to <b>Won</b> in the Pipeline to see them here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Original channel</th>
                <th className="py-2 pr-4">Customer since</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-amber-50/40">
                  <td className="py-3 pr-4 font-medium text-gray-800 cursor-pointer min-w-0" onClick={() => onSelectLead(c.id)}>
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="py-3 pr-4 text-gray-500">
                    <div className="flex flex-col gap-0.5 text-xs">
                      {c.mobile_number && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.mobile_number}</span>}
                      {c.email && <span className="flex items-center gap-1 min-w-0 truncate max-w-[200px]" title={c.email}><Mail className="w-3 h-3" />{c.email}</span>}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">{CHANNEL_LABEL[c.channel] || 'Other'}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">{formatDate(c.created_at)}</td>
                  <td className="py-3 pr-4">
                    {regeneratedIds.has(c.id) ? (
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />New lead created</span>
                    ) : (
                      <button
                        onClick={() => handleRegenerate(c)}
                        disabled={regeneratingId === c.id}
                        className="text-xs bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                      >
                        {regeneratingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Regenerate lead
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-fuchsia-400">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
        <Users2 className="w-4 h-4 text-fuchsia-500" />
        Referral Report
      </h2>
      <p className="text-xs text-gray-400 mb-4">Who sent you business — who referred whom, and what happened with each.</p>
      {referralGroups.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No tracked referrals yet — link one when adding a lead with "Referred by".</p>
      ) : (
        <div className="space-y-3">
          {referralGroups.map((group) => (
            <div key={group.referrer.id} className="border border-fuchsia-100 rounded-lg p-3">
              <button onClick={() => onSelectLead(group.referrer.id)} className="text-sm font-semibold text-gray-800 hover:underline">
                {group.referrer.first_name} {group.referrer.last_name}
              </button>
              <span className="text-xs text-fuchsia-600 ml-2">referred {group.referred.length}</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {group.referred.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onSelectLead(r.id)}
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      r.status === 'converted' ? 'bg-emerald-100 text-emerald-700' : r.status === 'lost' ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {r.first_name} {r.last_name} &middot; {r.status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
};

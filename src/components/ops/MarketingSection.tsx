import React, { useEffect, useState } from 'react';
import { Megaphone, Zap, Plus } from 'lucide-react';
import { getMarketingCampaigns, createMarketingCampaign, toggleCampaignStatus, MarketingCampaign } from '../../services/opsMarketingService';
import { getAllLeadsPlatform, PlatformLead } from '../../services/adminService';

const CHANNEL_LABEL: Record<string, string> = { whatsapp: 'WhatsApp', instagram: 'Instagram', google_ads: 'Google Ads', referral: 'Referral', other: 'Other' };

/**
 * Real automation behaviour already live in this app - not invented
 * copy. Each line maps to an actual trigger/function already shipped
 * this session (auto-assign trigger, follow-up task creation, the
 * Retention Agent draft).
 */
const REAL_AUTOMATION = [
  'New lead with no assigned_numerologist_id → auto-assigned to the least-loaded active/trial numerologist (DB trigger, on every insert)',
  'A deal untouched 7+ days → flagged "stalled" in the numerologist\'s Pipeline, with an AI-drafted follow-up message available on demand',
  'Free-check result that needs correction → shown the "Unlock your full breakdown" lead-capture wall before the full report',
];

export const MarketingSection: React.FC = () => {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [leads, setLeads] = useState<PlatformLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', channel: 'whatsapp' as MarketingCampaign['channel'], leads_generated: 0, cost_inr: 0 });

  const load = async () => {
    const [c, l] = await Promise.all([getMarketingCampaigns(), getAllLeadsPlatform()]);
    setCampaigns(c);
    setLeads(l.slice(0, 8));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const totalLeads = campaigns.reduce((a, c) => a + c.leads_generated, 0);
  const totalCost = campaigns.reduce((a, c) => a + c.cost_inr, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await createMarketingCampaign({ ...form, status: 'active' });
    setForm({ name: '', channel: 'whatsapp', leads_generated: 0, cost_inr: 0 });
    setShowForm(false);
    load();
  };

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase font-mono">Leads (campaigns)</p><p className="text-2xl font-display font-bold mt-1">{totalLeads}</p></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase font-mono">Campaign spend</p><p className="text-2xl font-display font-bold mt-1">₹{totalCost.toLocaleString('en-IN')}</p></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase font-mono">Cost per lead</p><p className="text-2xl font-display font-bold mt-1">₹{totalLeads ? Math.round(totalCost / totalLeads) : 0}</p></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase font-mono">Active campaigns</p><p className="text-2xl font-display font-bold mt-1">{campaigns.filter((c) => c.status === 'active').length}</p></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold flex items-center gap-2"><Megaphone className="w-4 h-4 text-indigo-500" />Campaigns</h2>
            <button onClick={() => setShowForm((v) => !v)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add campaign</button>
          </div>
          {showForm && (
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-2 mb-4 bg-indigo-50 rounded-lg p-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name" className="col-span-2 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg" />
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as any })} className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg">
                {Object.entries(CHANNEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="number" value={form.cost_inr || ''} onChange={(e) => setForm({ ...form, cost_inr: Number(e.target.value) })} placeholder="Cost (₹)" className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg" />
              <input type="number" value={form.leads_generated || ''} onChange={(e) => setForm({ ...form, leads_generated: Number(e.target.value) })} placeholder="Leads generated" className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg" />
              <button type="submit" className="bg-indigo-600 text-white text-sm font-semibold rounded-lg px-3 py-1.5">Save</button>
            </form>
          )}
          {campaigns.length === 0 ? <p className="text-sm text-gray-400">No campaigns logged yet.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100"><th className="py-2">Campaign</th><th>Channel</th><th className="text-right">Leads</th><th className="text-right">Cost</th><th>Status</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 font-medium text-gray-800">{c.name}</td>
                    <td className="text-gray-500">{CHANNEL_LABEL[c.channel]}</td>
                    <td className="text-right tabular-nums">{c.leads_generated}</td>
                    <td className="text-right tabular-nums">₹{c.cost_inr.toLocaleString('en-IN')}</td>
                    <td>
                      <button onClick={() => toggleCampaignStatus(c.id, c.status === 'active' ? 'paused' : 'active').then(load)} className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-display font-semibold mb-4">Recent leads</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100"><th className="py-2">Name</th><th>Source</th><th>Score</th><th>Status</th><th>Assigned to</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {leads.map((l) => (
              <tr key={l.id}>
                <td className="py-2.5 font-medium text-gray-800">{l.first_name} {l.last_name}</td>
                <td className="text-gray-500">{l.channel}</td>
                <td><span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{l.lead_score}</span></td>
                <td className="text-gray-500 capitalize">{l.status}</td>
                <td className="text-gray-500">{l.assignedTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { getFinanceSummary, addExpenseEntry, FinanceSummary, ExpenseEntry } from '../../services/opsFinanceService';

const CATEGORY_OPTIONS: { value: ExpenseEntry['category']; label: string }[] = [
  { value: 'marketing', label: 'Marketing spend' },
  { value: 'infra_hosting', label: 'Infra / hosting' },
  { value: 'gateway_fees', label: 'Payment gateway fees' },
  { value: 'support_tooling', label: 'Support tooling' },
  { value: 'ai_api', label: 'AI API costs' },
  { value: 'other', label: 'Other' },
];

export const FinanceSection: React.FC = () => {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'marketing' as ExpenseEntry['category'], amount_inr: 0, note: '' });

  const monthStart = () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; };

  const load = async () => { setSummary(await getFinanceSummary(monthStart())); setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount_inr) return;
    await addExpenseEntry({ category: form.category, amount_inr: form.amount_inr, entry_month: monthStart().toISOString().slice(0, 10), note: form.note || undefined });
    setForm({ category: 'marketing', amount_inr: 0, note: '' });
    setShowForm(false);
    load();
  };

  if (loading || !summary) return <p className="text-sm text-gray-400">Loading...</p>;

  const net = summary.totalRevenueInr - summary.totalSpendInr;
  const margin = summary.totalRevenueInr > 0 ? Math.round((net / summary.totalRevenueInr) * 100) : 0;
  const maxRev = Math.max(1, ...summary.revenueByModule.map((r) => r.revenue_inr), summary.planBaseRevenueInr, summary.oneTimeReportRevenueInr);
  const maxSpend = Math.max(1, ...summary.spendByCategory.map((s) => s.amount_inr));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase font-mono">Revenue (MTD)</p><p className="text-2xl font-display font-bold mt-1 text-emerald-700">₹{summary.totalRevenueInr.toLocaleString('en-IN')}</p></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase font-mono">Spend (MTD)</p><p className="text-2xl font-display font-bold mt-1 text-rose-700">₹{summary.totalSpendInr.toLocaleString('en-IN')}</p></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase font-mono">Net (MTD)</p><p className="text-2xl font-display font-bold mt-1">₹{net.toLocaleString('en-IN')}</p></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase font-mono">Margin</p><p className="text-2xl font-display font-bold mt-1">{margin}%</p></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-display font-semibold mb-4">Revenue by source</h2>
          <div className="space-y-2.5">
            <BarRow label="Plan base (all subscribers)" value={summary.planBaseRevenueInr} max={maxRev} color="bg-indigo-500" />
            {summary.revenueByModule.map((r) => <BarRow key={r.module_code} label={r.module_name} value={r.revenue_inr} max={maxRev} color="bg-indigo-400" />)}
            <BarRow label="One-time reports" value={summary.oneTimeReportRevenueInr} max={maxRev} color="bg-indigo-300" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">Spend by category</h2>
            <button onClick={() => setShowForm((v) => !v)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Log expense</button>
          </div>
          {showForm && (
            <form onSubmit={handleAddExpense} className="grid grid-cols-2 gap-2 mb-4 bg-gray-50 rounded-lg p-3">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })} className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg">
                {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <input type="number" value={form.amount_inr || ''} onChange={(e) => setForm({ ...form, amount_inr: Number(e.target.value) })} placeholder="Amount (₹)" className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg" />
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Note (optional)" className="col-span-2 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg" />
              <button type="submit" className="col-span-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg py-1.5">Save</button>
            </form>
          )}
          {summary.spendByCategory.length === 0 ? (
            <p className="text-sm text-gray-400">No spend logged this month yet — click "Log expense" to add marketing, hosting, gateway fees, or AI costs.</p>
          ) : (
            <div className="space-y-2.5">
              {summary.spendByCategory.map((s) => <BarRow key={s.category} label={s.category} value={s.amount_inr} max={maxSpend} color="bg-amber-500" />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BarRow: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div>
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-800 tabular-nums">₹{value.toLocaleString('en-IN')}</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  </div>
);

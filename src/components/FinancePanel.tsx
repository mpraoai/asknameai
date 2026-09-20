import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus, Trash2, IndianRupee } from 'lucide-react';
import {
  MarketingExpense,
  Period,
  getMarketingExpenses,
  addMarketingExpense,
  deleteMarketingExpense,
  getWonRevenueRows,
  buildPeriodReport,
} from '../services/financeService';
import { formatMoney, formatDate } from '../utils/locale';

interface FinancePanelProps {
  numerologistId: string;
  currencyCode: string;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'half_year', label: 'Half-yearly' },
  { value: 'year', label: 'Yearly' },
];

const CHANNEL_OPTIONS = ['instagram', 'facebook', 'youtube', 'google_ads', 'whatsapp', 'other'];

export const FinancePanel: React.FC<FinancePanelProps> = ({ numerologistId, currencyCode }) => {
  const [expenses, setExpenses] = useState<MarketingExpense[]>([]);
  const [revenueRows, setRevenueRows] = useState<{ amount: number; closedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');

  const [amount, setAmount] = useState('');
  const [channel, setChannel] = useState('instagram');
  const [description, setDescription] = useState('');
  const [spentOn, setSpentOn] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [numerologistId]);

  const load = async () => {
    setLoading(true);
    const [exp, rev] = await Promise.all([getMarketingExpenses(numerologistId), getWonRevenueRows(numerologistId)]);
    setExpenses(exp);
    setRevenueRows(rev);
    setLoading(false);
  };

  const buckets = useMemo(() => buildPeriodReport(revenueRows, expenses, period), [revenueRows, expenses, period]);
  const totalRevenue = revenueRows.reduce((sum, r) => sum + r.amount, 0);
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalSpend;
  const maxBar = Math.max(1, ...buckets.map((b) => Math.max(b.revenue, b.spend)));

  const handleAddExpense = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    await addMarketingExpense(numerologistId, { amount: amt, channel, description: description.trim() || undefined, spentOn });
    setSaving(false);
    setAmount('');
    setDescription('');
    load();
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-sm p-6 text-white">
          <TrendingUp className="w-6 h-6 mb-2 text-emerald-100" />
          <p className="text-2xl font-bold">{formatMoney(totalRevenue, currencyCode)}</p>
          <p className="text-sm text-emerald-100">Total revenue generated (Won deals)</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-orange-600 rounded-xl shadow-sm p-6 text-white">
          <TrendingDown className="w-6 h-6 mb-2 text-rose-100" />
          <p className="text-2xl font-bold">{formatMoney(totalSpend, currencyCode)}</p>
          <p className="text-sm text-rose-100">Total invested in marketing</p>
        </div>
        <div className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-indigo-500 to-blue-600' : 'from-gray-500 to-gray-600'} rounded-xl shadow-sm p-6 text-white`}>
          <Wallet className="w-6 h-6 mb-2 text-indigo-100" />
          <p className="text-2xl font-bold">{formatMoney(netProfit, currencyCode)}</p>
          <p className="text-sm text-indigo-100">Net — what's left after marketing spend</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-400">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h2 className="font-semibold text-gray-800">Earnings vs. Marketing Spend</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  period === opt.value ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-emerald-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Revenue is deal value marked Won, grouped by when it was moved there. Spend is what you've logged below.
        </p>

        {buckets.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No revenue or spend recorded yet for this view.</p>
        ) : (
          <div className="space-y-3">
            {buckets.map((b) => (
              <div key={b.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">{b.label}</span>
                  <span className={`font-semibold ${b.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Net {formatMoney(b.net, currencyCode)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-14 flex-shrink-0">Revenue</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(b.revenue / maxBar) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 w-20 text-right flex-shrink-0">{formatMoney(b.revenue, currencyCode)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-14 flex-shrink-0">Spend</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${(b.spend / maxBar) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 w-20 text-right flex-shrink-0">{formatMoney(b.spend, currencyCode)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-rose-400">
        <h2 className="font-semibold text-gray-800 mb-1">Log Marketing Spend</h2>
        <p className="text-xs text-gray-400 mb-4">
          A running ledger, not an ad-platform connection — log what you actually spent, e.g. boosting a post or running an Instagram ad.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative w-32">
            <IndianRupee className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="w-full pl-7 pr-2 text-sm border border-gray-200 rounded-lg px-2 py-2 text-gray-900"
            />
          </div>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900 capitalize">
            {CHANNEL_OPTIONS.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
          <input
            type="date"
            value={spentOn}
            onChange={(e) => setSpentOn(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was it for? (optional)"
            className="flex-1 min-w-[160px] text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
          />
          <button
            onClick={handleAddExpense}
            disabled={saving}
            className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Log spend
          </button>
        </div>

        {expenses.length === 0 ? (
          <p className="text-sm text-gray-400">No marketing spend logged yet.</p>
        ) : (
          <div className="space-y-1.5">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-gray-800">{formatMoney(e.amount, currencyCode)}</span>
                  <span className="text-xs text-gray-400 ml-2 capitalize">{e.channel.replace('_', ' ')}</span>
                  {e.description && <span className="text-xs text-gray-400 ml-2 truncate">— {e.description}</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">{formatDate(e.spent_on)}</span>
                  <button onClick={async () => { await deleteMarketingExpense(e.id); load(); }} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

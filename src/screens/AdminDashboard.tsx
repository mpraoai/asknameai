import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Users, TrendingUp, TrendingDown, LogOut, Home, Search, Download, X,
  ArrowUpDown, Sparkles, LayoutDashboard, KanbanSquare, UserCog, UserCircle, Palette, Receipt,
  StickyNote, UserPlus, Send, Megaphone, LifeBuoy, Smartphone, Gem, Building2, Globe, Wallet, Plus,
  FileText,
} from 'lucide-react';
import { getCurrentProfile, signOut, UserProfile } from '../services/authService';
import { AdminMfaGate } from '../components/AdminMfaGate';
import {
  getPlatformOverview, exportSubscribersCSV, getAllLeadsPlatform, getAllCustomers,
  getSubscriberDetail, getCustomerPurchases, getNotes, addNote, updateSubscriberStatus,
  getSubscriberOptions, assignCustomerToSubscriber,
  PlatformOverview, SubscriberRow, PlatformLead, PlatformCustomer, SubscriberDetail, CustomerPurchase,
  AdminNote, NumerologistOption,
} from '../services/adminService';
import { MarketingSection } from '../components/ops/MarketingSection';
import { SalesSection } from '../components/ops/SalesSection';
import { ServiceSection } from '../components/ops/ServiceSection';
import { WorkCenterSection } from '../components/ops/WorkCenterSection';
import { FinanceSection } from '../components/ops/FinanceSection';
import { NewSubscriberWizard } from '../components/ops/NewSubscriberWizard';
import { getPlatformModules, getModulesForSubscriber, toggleSubscriberModule, PlatformModule } from '../services/opsModulesService';
import { getContractsForSubscriber, getInvoicesForSubscriber, Contract, Invoice } from '../services/opsContractsService';

const STATUS_META: Record<string, { label: string; color: string; soft: string }> = {
  trial: { label: 'Trial', color: 'bg-slate-500', soft: 'bg-slate-100 text-slate-600' },
  active: { label: 'Active', color: 'bg-emerald-500', soft: 'bg-emerald-100 text-emerald-700' },
  past_due: { label: 'Past Due', color: 'bg-amber-500', soft: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-500', soft: 'bg-rose-100 text-rose-700' },
};

const SCORE_META: Record<string, string> = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-blue-100 text-blue-700',
};

type Section =
  | 'overview' | 'marketing' | 'sales' | 'service' | 'subscribers' | 'customers'
  | 'wc-numerology' | 'wc-mobile' | 'wc-yantra' | 'wc-brand' | 'wc-domain' | 'finance';
type SortKey = 'business_name' | 'subscription_status' | 'leadCount' | 'convertedCount' | 'reportCount' | 'created_at';

const NAV: { id: Section; label: string; icon: React.ElementType; group?: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'sales', label: 'Sales', icon: KanbanSquare },
  { id: 'service', label: 'Service', icon: LifeBuoy },
  { id: 'subscribers', label: 'Subscribers', icon: UserCog },
  { id: 'customers', label: 'Customers', icon: UserCircle },
  { id: 'wc-numerology', label: 'Numerology', icon: Sparkles, group: 'Work Centers' },
  { id: 'wc-mobile', label: 'Mobile Numerology', icon: Smartphone, group: 'Work Centers' },
  { id: 'wc-yantra', label: 'Yantra', icon: Gem, group: 'Work Centers' },
  { id: 'wc-brand', label: 'Brand / Business Name', icon: Building2, group: 'Work Centers' },
  { id: 'wc-domain', label: 'Domain Correction', icon: Globe, group: 'Work Centers' },
  { id: 'finance', label: 'Finance', icon: Wallet },
];

/**
 * The product owner's own view of the platform — a left-sidebar console
 * (same shape as the subscriber CRM, distinct indigo-and-gold palette on
 * a light cream ground, not maroon) with four real sections: platform
 * overview, every lead across every subscriber, the subscriber roster
 * itself, and direct (non-numerologist) customers. Reachable at
 * /admin/dashboard once signed in on an account with is_admin = true.
 */
export default function AdminDashboard() {
  const [user, setUser] = useState<UserProfile | null | 'loading'>('loading');
  const [section, setSection] = useState<Section>('overview');
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    (async () => setUser(await getCurrentProfile()))();
  }, []);

  if (user === 'loading') {
    return <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center text-gray-400 text-sm">Loading...</div>;
  }

  if (!user || !user.is_admin) {
    return (
      <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-sm">
          <ShieldCheck className="w-10 h-10 text-indigo-400 mx-auto" />
          <h1 className="text-lg font-display font-semibold text-gray-800">Admin access only</h1>
          <p className="text-sm text-gray-500">
            {user ? "This account isn't marked as an administrator." : 'Sign in on an admin account to view the platform dashboard.'}
          </p>
          <Link to="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminMfaGate user={user}>
    <div className="min-h-screen bg-[#f8f5ee] text-gray-800 md:flex">
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-display font-bold text-sm text-white">A</div>
            <div>
              <p className="text-sm font-display font-semibold">AskNameAI</p>
              <span className="text-[9px] uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full font-mono">Owner Console</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item, i) => {
            const Icon = item.icon;
            const isActive = section === item.id;
            const showGroupLabel = item.group && NAV[i - 1]?.group !== item.group;
            return (
              <React.Fragment key={item.id}>
                {showGroupLabel && <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 px-3 pt-4 pb-1">{item.group}</p>}
                <button
                  onClick={() => setSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <Link to="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
            <Home className="w-4 h-4" />
            Main site
          </Link>
          <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-display font-bold text-xs text-white">A</div>
          <p className="text-sm font-display font-semibold">Owner Console</p>
        </div>
        <button onClick={() => signOut()} className="text-gray-400 hover:text-rose-600">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
      <div className="md:hidden bg-white border-b border-gray-200 flex overflow-x-auto px-2 py-2 gap-1 sticky top-[49px] z-10">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-500'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <main className="flex-1 md:ml-60">
        <div className="max-w-6xl mx-auto px-5 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-display font-semibold capitalize">
              {NAV.find((n) => n.id === section)?.label || 'Overview'}
            </h1>
            {(section === 'subscribers' || section === 'overview') && (
              <button onClick={() => setWizardOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5">
                <Plus className="w-4 h-4" />New subscriber
              </button>
            )}
          </div>
          {section === 'overview' && <OverviewSection />}
          {section === 'marketing' && <MarketingSection />}
          {section === 'sales' && (
            <div className="space-y-6">
              <SalesSection />
              <LeadsSection />
            </div>
          )}
          {section === 'service' && <ServiceSection />}
          {section === 'subscribers' && <SubscribersSection />}
          {section === 'customers' && <CustomersSection />}
          {section === 'wc-numerology' && <WorkCenterHost code="numerology" />}
          {section === 'wc-mobile' && <WorkCenterHost code="mobile" />}
          {section === 'wc-yantra' && <WorkCenterHost code="yantra" />}
          {section === 'wc-brand' && <WorkCenterHost code="brand" />}
          {section === 'wc-domain' && <WorkCenterHost code="domain" />}
          {section === 'finance' && <FinanceSection />}
        </div>
      </main>
      {wizardOpen && <NewSubscriberWizard onClose={() => setWizardOpen(false)} onProvisioned={() => setSection('subscribers')} />}
    </div>
    </AdminMfaGate>
  );
}

const WorkCenterHost: React.FC<{ code: string }> = ({ code }) => {
  const [modules, setModules] = useState<PlatformModule[]>([]);
  useEffect(() => { getPlatformModules().then(setModules); }, []);
  const module = modules.find((m) => m.code === code);
  if (!module) return <p className="text-sm text-gray-400">Loading...</p>;
  return <WorkCenterSection module={module} />;
};

const WeeklyBarChart: React.FC<{ data: { label: string; count: number }[] }> = ({ data }) => {
  const max = Math.max(1, ...data.map((d) => d.count));
  const w = 480, h = 180, padL = 28, padB = 22, padT = 10;
  const chartW = w - padL - 10, chartH = h - padT - padB;
  const groupW = chartW / data.length;
  const barW = groupW * 0.5;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      {[0, 1, 2, 3].map((g) => {
        const y = padT + chartH - (chartH * g) / 3;
        return <line key={g} x1={padL} x2={w - 10} y1={y} y2={y} stroke="#f0ede3" strokeWidth={1} />;
      })}
      {data.map((d, i) => {
        const bh = (d.count / max) * chartH;
        const x = padL + i * groupW + (groupW - barW) / 2;
        return (
          <g key={d.label}>
            <rect x={x} y={padT + chartH - bh} width={barW} height={bh} rx={3} fill="#4a3aa8" />
            <text x={x + barW / 2} y={h - 4} textAnchor="middle" fontSize="10.5" fontFamily="'JetBrains Mono', monospace" fill="#8a8399">{d.label}</text>
            <text x={x + barW / 2} y={padT + chartH - bh - 6} textAnchor="middle" fontSize="10.5" fontFamily="'JetBrains Mono', monospace" fill="#5c5570">{d.count}</text>
          </g>
        );
      })}
    </svg>
  );
};

const OverviewSection: React.FC = () => {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { setOverview(await getPlatformOverview()); setLoading(false); })(); }, []);

  if (loading || !overview) return <p className="text-sm text-gray-400 py-10 text-center">Loading platform data...</p>;

  return (
    <>
      <div>
        <p className="text-sm text-gray-500 mt-0.5">Across every numerologist subscriber and the leads they've captured — real data, last updated just now.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono mb-2">Subscribers</p>
          <p className="text-3xl font-display font-bold tabular-nums text-indigo-700">{overview.totalSubscribers}</p>
          <p className="text-xs text-gray-500 mt-1">{overview.statusCounts.active || 0} active · {overview.statusCounts.trial || 0} trial</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono mb-2">Leads, Platform-wide</p>
          <p className="text-3xl font-display font-bold tabular-nums text-indigo-700">{overview.totalLeadsPlatform}</p>
          {overview.leadsDeltaPct !== null ? (
            <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${overview.leadsDeltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {overview.leadsDeltaPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(overview.leadsDeltaPct)}% vs last week
            </p>
          ) : <p className="text-xs text-gray-500 mt-1">{overview.leadsToday} today</p>}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono mb-2">Converted, Platform-wide</p>
          <p className="text-3xl font-display font-bold tabular-nums text-emerald-700">{overview.totalConvertedPlatform}</p>
          <p className="text-xs text-gray-500 mt-1">{overview.totalLeadsPlatform > 0 ? `${Math.round((overview.totalConvertedPlatform / overview.totalLeadsPlatform) * 100)}% conversion` : 'no leads yet'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono mb-2">Reports Generated</p>
          <p className="text-3xl font-display font-bold tabular-nums text-amber-700">{overview.totalReportsPlatform}</p>
          <p className="text-xs text-gray-500 mt-1">across all subscribers</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        Subscription billing isn't live yet, so there's no MRR/revenue figure here — subscriber status reflects account state, not a verified payment.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-display font-semibold mb-1">Lead Volume — last 5 weeks</h2>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono mb-4">real lead count, platform-wide</p>
          <WeeklyBarChart data={overview.weeklyLeadVolume} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-display font-semibold mb-1">Subscriber Leaderboard</h2>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono mb-4">by leads assigned</p>
          {overview.subscribers.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">No subscribers yet.</p> : (
            <ol className="space-y-2.5">
              {overview.subscribers.slice(0, 6).map((s, i) => {
                const max = overview.subscribers[0]?.leadCount || 1;
                return (
                  <li key={s.id} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium truncate">{s.business_name}</span>
                        <span className="tabular-nums text-gray-500">{s.leadCount}</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(s.leadCount / max) * 100}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </>
  );
};

type LeadSortKey = 'first_name' | 'channel' | 'lead_score' | 'status' | 'assignedTo' | 'created_at';
const SCORE_RANK: Record<string, number> = { hot: 2, warm: 1, cold: 0 };

const LeadsSection: React.FC = () => {
  const [leads, setLeads] = useState<PlatformLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [sortKey, setSortKey] = useState<LeadSortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => { (async () => { setLeads(await getAllLeadsPlatform()); setLoading(false); })(); }, []);

  const channels = useMemo(() => Array.from(new Set(leads.map((l) => l.channel))).sort(), [leads]);

  const toggleSort = (key: LeadSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = leads.filter((l) => {
      if (scoreFilter && l.lead_score !== scoreFilter) return false;
      if (statusFilter && l.status !== statusFilter) return false;
      if (channelFilter && l.channel !== channelFilter) return false;
      if (q) {
        const name = `${l.first_name || ''} ${l.last_name || ''}`.toLowerCase();
        if (!name.includes(q) && !(l.mobile_number || '').includes(q) && !l.assignedTo.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    return [...rows].sort((a, b) => {
      let cmp: number;
      if (sortKey === 'lead_score') cmp = SCORE_RANK[a.lead_score] - SCORE_RANK[b.lead_score];
      else if (sortKey === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else {
        const av = sortKey === 'first_name' ? `${a.first_name || ''} ${a.last_name || ''}` : (a[sortKey] as string) || '';
        const bv = sortKey === 'first_name' ? `${b.first_name || ''} ${b.last_name || ''}` : (b[sortKey] as string) || '';
        cmp = av.localeCompare(bv);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [leads, search, scoreFilter, statusFilter, channelFilter, sortKey, sortDir]);

  const exportCSV = () => {
    const headers = ['name', 'mobile', 'channel', 'score', 'status', 'assigned_to', 'created_at'];
    const rows = filtered.map((l) => [`${l.first_name || ''} ${l.last_name || ''}`.trim(), l.mobile_number || '', l.channel, l.lead_score, l.status, l.assignedTo, l.created_at.slice(0, 10)]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `asknameai-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const SortTh: React.FC<{ label: string; sortableKey: LeadSortKey }> = ({ label, sortableKey }) => (
    <th className="py-2 pr-4">
      <button onClick={() => toggleSort(sortableKey)} className="flex items-center gap-1 hover:text-indigo-600">
        {label}<ArrowUpDown className="w-2.5 h-2.5" />
      </button>
    </th>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-500 mt-0.5">Every lead across every subscriber, platform-wide — sortable, filterable, exportable.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{filtered.length} of {leads.length} shown</span>
          <button onClick={exportCSV} className="text-xs font-semibold text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 my-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, mobile, or subscriber..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800" />
        </div>
        <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-800 capitalize">
          <option value="">All channels</option>
          {channels.map((c) => <option key={c} value={c} className="capitalize">{c.replace('_', ' ')}</option>)}
        </select>
        <select value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
          <option value="">All scores</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>
      {loading ? <p className="text-sm text-gray-400 text-center py-8">Loading...</p> : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">{leads.length === 0 ? 'No leads on the platform yet.' : 'No leads match your filters.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-mono border-b border-gray-100">
                <SortTh label="Name" sortableKey="first_name" />
                <SortTh label="Source" sortableKey="channel" />
                <SortTh label="Score" sortableKey="lead_score" />
                <SortTh label="Status" sortableKey="status" />
                <SortTh label="Assigned To" sortableKey="assignedTo" />
                <SortTh label="Received" sortableKey="created_at" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-indigo-50/40">
                  <td className="py-3 pr-4 font-medium text-gray-800">{l.first_name} {l.last_name}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs capitalize">{l.channel?.replace('_', ' ')}</td>
                  <td className="py-3 pr-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${SCORE_META[l.lead_score]}`}>{l.lead_score}</span></td>
                  <td className="py-3 pr-4 text-gray-600 text-xs capitalize">{l.status}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">{l.assignedTo}</td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const SubscribersSection: React.FC = () => {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('leadCount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<SubscriberRow | null>(null);

  useEffect(() => { (async () => { setOverview(await getPlatformOverview()); setLoading(false); })(); }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    if (!overview) return [];
    const q = search.trim().toLowerCase();
    const f = q ? overview.subscribers.filter((s) => s.business_name.toLowerCase().includes(q)) : overview.subscribers;
    return [...f].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [overview, search, sortKey, sortDir]);

  if (loading || !overview) return <p className="text-sm text-gray-400 py-10 text-center">Loading...</p>;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-500 mt-0.5">Every business running on AskNameAI — plans, modules, contracts, invoices.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search business name..." className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-800 w-48" />
          </div>
          <button onClick={() => exportSubscribersCSV(overview.subscribers)} className="text-xs font-semibold text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-mono border-b border-gray-100">
              {([
                ['business_name', 'Business'], ['subscription_status', 'Status'], ['leadCount', 'Leads'],
                ['convertedCount', 'Converted'], ['reportCount', 'Reports'], ['created_at', 'Joined'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th key={key} className="py-2 pr-4">
                  <button onClick={() => toggleSort(key)} className="flex items-center gap-1 hover:text-indigo-600">
                    {label}<ArrowUpDown className="w-2.5 h-2.5" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((s) => (
              <tr key={s.id} onClick={() => setSelected(s)} className="hover:bg-indigo-50/40 cursor-pointer">
                <td className="py-3 pr-4 font-medium text-gray-800">{s.business_name}</td>
                <td className="py-3 pr-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_META[s.subscription_status]?.soft || 'bg-gray-100 text-gray-500'}`}>{STATUS_META[s.subscription_status]?.label || s.subscription_status}</span></td>
                <td className="py-3 pr-4 tabular-nums text-gray-600">{s.leadCount}</td>
                <td className="py-3 pr-4 tabular-nums text-gray-600">{s.convertedCount}</td>
                <td className="py-3 pr-4 tabular-nums text-gray-600">{s.reportCount}</td>
                <td className="py-3 pr-4 text-gray-400 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">{search ? `No subscribers matching "${search}".` : 'No subscribers yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
      {selected && <SubscriberDrawer subscriber={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

const SCORE_SOFT: Record<string, string> = { hot: 'bg-red-100 text-red-700', warm: 'bg-amber-100 text-amber-700', cold: 'bg-blue-100 text-blue-700' };

/** Shared internal-notes timeline for a subscriber or customer drawer - the admin's record of what happened on an account, per business process. */
const NotesPanel: React.FC<{ entityType: 'subscriber' | 'customer'; entityId: string }> = ({ entityType, entityId }) => {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => { setNotes(await getNotes(entityType, entityId)); setLoaded(true); };
  useEffect(() => { load(); }, [entityType, entityId]);

  const submit = async () => {
    if (!draft.trim() || saving) return;
    setSaving(true);
    const res = await addNote(entityType, entityId, draft.trim());
    setSaving(false);
    if (res.success) { setDraft(''); load(); }
  };

  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5" />Notes ({notes.length})</p>
      <div className="flex gap-1.5 mb-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="Log a call, renewal chat, escalation..."
          className="flex-1 px-2.5 py-1.5 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300"
        />
        <button onClick={submit} disabled={saving || !draft.trim()} className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-40 flex-shrink-0">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
      {!loaded ? null : notes.length === 0 ? (
        <p className="text-xs text-gray-400">No notes yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {notes.map((n) => (
            <div key={n.id} className="bg-gray-50 rounded-lg px-2.5 py-1.5">
              <p className="text-xs text-gray-700">{n.note}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{n.created_by_name || 'Admin'} · {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

type ClientSortKey = 'name' | 'lastReportAt' | 'reportCount';

const SubscriberDrawer: React.FC<{ subscriber: SubscriberRow; onClose: () => void }> = ({ subscriber, onClose }) => {
  const [detail, setDetail] = useState<SubscriberDetail | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientSortKey, setClientSortKey] = useState<ClientSortKey>('lastReportAt');
  const [clientSortDir, setClientSortDir] = useState<'asc' | 'desc'>('desc');
  const [status, setStatus] = useState(subscriber.subscription_status);
  const [statusSaving, setStatusSaving] = useState(false);
  const [allModules, setAllModules] = useState<PlatformModule[]>([]);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [moduleSaving, setModuleSaving] = useState<string | null>(null);

  useEffect(() => { (async () => setDetail(await getSubscriberDetail(subscriber.id)))(); }, [subscriber.id]);

  useEffect(() => {
    (async () => {
      const [mods, enabled, c, inv] = await Promise.all([
        getPlatformModules(), getModulesForSubscriber(subscriber.id),
        getContractsForSubscriber(subscriber.id), getInvoicesForSubscriber(subscriber.id),
      ]);
      setAllModules(mods);
      setEnabledModules(enabled);
      setContracts(c);
      setInvoices(inv);
    })();
  }, [subscriber.id]);

  const handleToggleModule = async (code: string) => {
    const willEnable = !enabledModules.includes(code);
    setModuleSaving(code);
    setEnabledModules((prev) => willEnable ? [...prev, code] : prev.filter((c) => c !== code));
    await toggleSubscriberModule(subscriber.id, code, willEnable);
    setModuleSaving(null);
  };

  const changeStatus = async (next: typeof status) => {
    setStatus(next);
    setStatusSaving(true);
    await updateSubscriberStatus(subscriber.id, next);
    setStatusSaving(false);
  };

  const usagePct = detail && detail.reports_limit_per_month > 0 ? Math.min(100, Math.round((detail.reports_used_this_month / detail.reports_limit_per_month) * 100)) : 0;

  const toggleClientSort = (key: ClientSortKey) => {
    if (clientSortKey === key) setClientSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setClientSortKey(key); setClientSortDir(key === 'name' ? 'asc' : 'desc'); }
  };

  const sortedClients = useMemo(() => {
    const rows = (detail?.clients || []).filter((c) => !clientSearch.trim() || c.name.toLowerCase().includes(clientSearch.trim().toLowerCase()));
    return [...rows].sort((a, b) => {
      let cmp: number;
      if (clientSortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (clientSortKey === 'reportCount') cmp = a.reportCount - b.reportCount;
      else cmp = new Date(a.lastReportAt).getTime() - new Date(b.lastReportAt).getTime();
      return clientSortDir === 'asc' ? cmp : -cmp;
    });
  }, [detail, clientSearch, clientSortKey, clientSortDir]);

  const exportClientsCSV = () => {
    const headers = ['client_name', 'last_report_date', 'reports_total'];
    const rows = sortedClients.map((c) => [c.name, c.lastReportAt.slice(0, 10), c.reportCount]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${subscriber.business_name.replace(/\s+/g, '-').toLowerCase()}-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const ClientSortTh: React.FC<{ label: string; sortableKey: ClientSortKey; align?: 'left' | 'right' }> = ({ label, sortableKey, align = 'left' }) => (
    <th className={`px-2.5 py-1.5 font-semibold ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button onClick={() => toggleClientSort(sortableKey)} className={`flex items-center gap-1 hover:text-indigo-600 ${align === 'right' ? 'ml-auto' : ''}`}>
        {label}<ArrowUpDown className="w-2.5 h-2.5" />
      </button>
    </th>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full sm:w-96 bg-white h-full shadow-2xl overflow-y-auto">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white sticky top-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
          <h2 className="text-xl font-display font-bold">{subscriber.business_name}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <select
              value={status}
              onChange={(e) => changeStatus(e.target.value as typeof status)}
              disabled={statusSaving}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-white/20 border-none text-white [&>option]:text-gray-800 disabled:opacity-60 cursor-pointer"
            >
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {detail && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-white/20">{detail.teamSize + 1} on team</span>}
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xl font-display font-bold text-gray-800">{subscriber.leadCount}</p><p className="text-[10px] text-gray-400 uppercase font-mono mt-1">Leads</p></div>
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xl font-display font-bold text-emerald-700">{subscriber.convertedCount}</p><p className="text-[10px] text-gray-400 uppercase font-mono mt-1">Converted</p></div>
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xl font-display font-bold text-amber-700">{subscriber.reportCount}</p><p className="text-[10px] text-gray-400 uppercase font-mono mt-1">Reports</p></div>
          </div>
          <p className="text-xs text-gray-500">Conversion rate: <b className="text-gray-700">{subscriber.leadCount > 0 ? Math.round((subscriber.convertedCount / subscriber.leadCount) * 100) : 0}%</b></p>
          <p className="text-xs text-gray-500">Subscriber since <b className="text-gray-700">{new Date(subscriber.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</b></p>

          {!detail ? <p className="text-xs text-gray-400">Loading more...</p> : (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">This month's usage</p>
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-amber-500" style={{ width: `${usagePct}%` }} />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 tabular-nums">{detail.reports_used_this_month} of {detail.reports_limit_per_month} reports used</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Modules</p>
                <div className="space-y-1.5">
                  {allModules.map((m) => {
                    const on = m.is_core || enabledModules.includes(m.code);
                    return (
                      <div key={m.code} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-700">{m.name}{m.is_core && <span className="text-gray-400 ml-1">(core)</span>}</span>
                        <button
                          onClick={() => !m.is_core && handleToggleModule(m.code)}
                          disabled={m.is_core || moduleSaving === m.code}
                          className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-indigo-600' : 'bg-gray-300'} ${m.is_core ? 'opacity-50' : ''}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-4' : 'left-0.5'}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Contracts &amp; invoices</p>
                {contracts.length === 0 && invoices.length === 0 ? (
                  <p className="text-xs text-gray-400">No contracts or invoices yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {contracts.map((c) => (
                      <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                        <span className="text-gray-600">Contract</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${c.status === 'signed' ? 'bg-emerald-100 text-emerald-700' : c.status === 'sent' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                      </div>
                    ))}
                    {invoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                        <span className="text-gray-600">{inv.invoice_number} · ₹{inv.total_inr}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" />Branding</p>
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="px-3 py-2 text-white text-xs font-semibold" style={{ background: detail.brand_color }}>{subscriber.business_name}</div>
                  <div className="bg-white p-2 text-[11px] text-gray-500">Client report preview — {detail.logo_url ? 'has a logo set' : 'no logo uploaded'}</div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Recent leads</p>
                {detail.recentLeads.length === 0 ? <p className="text-xs text-gray-400">No leads yet.</p> : (
                  <div className="space-y-1.5">
                    {detail.recentLeads.map((l) => (
                      <div key={l.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <span className="text-gray-700 truncate">{l.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase flex-shrink-0 ${SCORE_SOFT[l.lead_score]}`}>{l.lead_score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-xs font-semibold text-gray-600">My clients ({detail.clients.length})</p>
                  {detail.clients.length > 0 && (
                    <button onClick={exportClientsCSV} className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 flex-shrink-0">
                      <Download className="w-3 h-3" />CSV
                    </button>
                  )}
                </div>
                {detail.clients.length === 0 ? <p className="text-xs text-gray-400">No reports generated yet.</p> : (
                  <>
                    {detail.clients.length > 3 && (
                      <div className="relative mb-2">
                        <Search className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                        <input
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Search clients..."
                          className="w-full pl-6 pr-2 py-1.5 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300"
                        />
                      </div>
                    )}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500 uppercase text-[9px]">
                            <ClientSortTh label="Client" sortableKey="name" />
                            <ClientSortTh label="Last report" sortableKey="lastReportAt" />
                            <th className="px-2.5 py-1.5 font-semibold text-left">Type</th>
                            <ClientSortTh label="Reports" sortableKey="reportCount" align="right" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sortedClients.length === 0 ? (
                            <tr><td colSpan={4} className="px-2.5 py-3 text-center text-gray-400">No match for "{clientSearch}"</td></tr>
                          ) : sortedClients.slice(0, 8).map((c) => (
                            <tr key={c.name}>
                              <td className="px-2.5 py-1.5 text-gray-700 truncate max-w-[7rem]">{c.name}</td>
                              <td className="px-2.5 py-1.5 text-gray-500 tabular-nums">{new Date(c.lastReportAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                              <td className="px-2.5 py-1.5 text-gray-500">{c.type || '—'}</td>
                              <td className="px-2.5 py-1.5 text-gray-700 text-right tabular-nums font-semibold">{c.reportCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {sortedClients.length > 8 && <p className="text-[10px] text-gray-400 text-center py-1.5 bg-gray-50">{sortedClients.length - 8} more not shown</p>}
                    </div>
                  </>
                )}
              </div>

              <NotesPanel entityType="subscriber" entityId={subscriber.id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomersSection: React.FC = () => {
  const [customers, setCustomers] = useState<PlatformCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PlatformCustomer | null>(null);

  useEffect(() => { (async () => { setCustomers(await getAllCustomers()); setLoading(false); })(); }, []);

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || c.mobile_number.includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-500 mt-0.5">End users who came through the free-check funnel or bought a report directly — not numerologist subscribers.</p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, mobile, or email..." className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-800 w-56" />
        </div>
      </div>
      {loading ? <p className="text-sm text-gray-400 text-center py-8">Loading...</p> : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">{customers.length === 0 ? 'No direct customers yet.' : 'No customers match your search.'}</p>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-mono border-b border-gray-100">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Plan Purchased</th>
                <th className="py-2 pr-4">Payment Status</th>
                <th className="py-2 pr-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-indigo-50/40 cursor-pointer">
                  <td className="py-3 pr-4 font-medium text-gray-800">{c.first_name} {c.last_name}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">{c.mobile_number}<br />{c.email}</td>
                  <td className="py-3 pr-4 text-gray-600 text-xs">{c.planName || <span className="text-gray-300">Free tier only</span>}</td>
                  <td className="py-3 pr-4">
                    {c.paymentStatus ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${c.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{c.paymentStatus}</span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && <CustomerDrawer customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

const CustomerDrawer: React.FC<{ customer: PlatformCustomer; onClose: () => void }> = ({ customer, onClose }) => {
  const [purchases, setPurchases] = useState<CustomerPurchase[] | null>(null);
  const [subscribers, setSubscribers] = useState<NumerologistOption[]>([]);
  const [assignTo, setAssignTo] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState(false);

  useEffect(() => { (async () => setPurchases(await getCustomerPurchases(customer.first_name, customer.last_name)))(); }, [customer.id]);
  useEffect(() => { (async () => setSubscribers(await getSubscriberOptions()))(); }, []);

  const handleAssign = async () => {
    if (!assignTo || assigning) return;
    setAssigning(true);
    const res = await assignCustomerToSubscriber(customer, assignTo);
    setAssigning(false);
    if (res.success) setAssigned(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full sm:w-96 bg-white h-full shadow-2xl overflow-y-auto">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white sticky top-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
          <h2 className="text-xl font-display font-bold">{customer.first_name} {customer.last_name}</h2>
          <p className="text-xs opacity-90 mt-1">{customer.mobile_number} · {customer.email}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5" />Assign to a subscriber</p>
            <p className="text-[11px] text-gray-400 mb-2">Routes this customer into a subscriber's pipeline as a new lead, for personal follow-up.</p>
            {assigned ? (
              <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5">Assigned — a new lead was created in their pipeline.</p>
            ) : (
              <div className="flex gap-1.5">
                <select
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300"
                >
                  <option value="">Choose a subscriber...</option>
                  {subscribers.map((s) => <option key={s.id} value={s.id}>{s.business_name}</option>)}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={!assignTo || assigning}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-semibold rounded-lg disabled:opacity-40 flex-shrink-0"
                >
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            )}
          </div>

          <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5" />Reports & purchases</p>
          <p className="text-[11px] text-gray-400 -mt-2">Matched by name against the purchases ledger — this app doesn't link a purchase to an account by ID yet.</p>
          {purchases === null ? (
            <p className="text-xs text-gray-400">Loading...</p>
          ) : purchases.length === 0 ? (
            <p className="text-xs text-gray-400">No purchases found for this name.</p>
          ) : (
            <div className="space-y-2">
              {purchases.map((p) => (
                <div key={p.id} className="bg-gray-50 rounded-lg p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800 capitalize">{p.plan}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : p.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span>
                  </div>
                  <p className="text-gray-500">Driver {p.driver} · Conductor {p.conductor} · ₹{(p.amount / 100).toLocaleString('en-IN')}</p>
                  <p className="text-gray-400 mt-1">{new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              ))}
            </div>
          )}

          <NotesPanel entityType="customer" entityId={customer.id} />
        </div>
      </div>
    </div>
  );
};

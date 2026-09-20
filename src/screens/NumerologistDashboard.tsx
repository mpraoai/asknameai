import React, { useEffect, useState } from 'react';
import { LayoutDashboard, KanbanSquare, Users, Settings, LogOut, TrendingUp, CheckCircle2, CreditCard, Sparkles, Circle, BarChart3, PhoneCall, Youtube, Instagram, Facebook, Linkedin, MessageCircle, Globe, UserPlus, Star, UserCog, Search, X, MoreHorizontal, UploadCloud, ListTodo, Clock, CalendarClock, LifeBuoy, Wallet, Home, Loader2 } from 'lucide-react';
import { signOut, getCurrentProfile } from '../services/authService';
import {
  getNumerologistProfileById,
  getMyLeads,
  updateBranding,
  bulkUpdateLeads,
  bulkAddTag,
  NumerologistProfile,
  Lead,
} from '../services/numerologistService';
import { CrmBoard } from '../components/CrmBoard';
import { getChannelBreakdown, getStageBreakdown, getForecast, ChannelBreakdown, StageBreakdown, Forecast } from '../services/analyticsService';
import { resolveActingProfile } from '../services/teamService';
import { TeamPanel } from '../components/TeamPanel';
import { LeadDetailPanel } from '../components/LeadDetailPanel';
import { AddLeadModal } from '../components/AddLeadModal';
import { ImportLeadsPanel } from '../components/ImportLeadsPanel';
import { CustomersPanel } from '../components/CustomersPanel';
import { ContentPanel } from '../components/ContentPanel';
import { GlobalSearch } from '../components/GlobalSearch';
import { MeetingsPanel } from '../components/MeetingsPanel';
import { Appointment, getUpcomingAppointments } from '../services/bookingService';
import { CURRENCY_OPTIONS, formatMoney, formatDateTime } from '../utils/locale';
import { DuplicatesModal } from '../components/DuplicatesModal';
import { findDuplicateGroups } from '../services/duplicatesService';
import { SavedView, getSavedViews, saveView, deleteSavedView } from '../services/savedViewService';
import { TicketsPanel } from '../components/TicketsPanel';
import { FinancePanel } from '../components/FinancePanel';
import { NumerologyToolsPanel, NUMEROLOGY_TOOLS, NumerologyToolId } from '../components/NumerologyToolsPanel';
import { exportFullBackupJSON, exportLeadsCSV, buildFullBackup, backupFilename } from '../services/exportService';
import { isDriveConfigured, connectGoogleDrive, uploadToDrive, driveFolderUrl } from '../services/googleDriveService';
import { Task, ensureFollowupTasks, getOpenTasks, completeTask } from '../services/crmService';
import { SubscriptionPlan, getSubscriptionPlans, getMySubscription, MySubscription, subscribeToPlan } from '../services/subscriptionService';

type Tab = 'dashboard' | 'pipeline' | 'leads' | 'analytics' | 'voice' | 'plan' | 'team' | 'branding' | 'import' | 'customers' | 'content' | 'meetings' | 'tickets' | 'finance';

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType; color: string; bar: string; ownerOnly?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-amber-200', bar: 'bg-amber-400' },
  { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare, color: 'text-amber-200', bar: 'bg-amber-400' },
  { id: 'leads', label: 'All Leads', icon: Users, color: 'text-amber-200', bar: 'bg-amber-400' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-amber-200', bar: 'bg-amber-400' },
  { id: 'voice', label: 'Voice Calls', icon: PhoneCall, color: 'text-amber-200', bar: 'bg-amber-400' },
  { id: 'plan', label: 'Plan & Billing', icon: CreditCard, color: 'text-amber-200', bar: 'bg-amber-400', ownerOnly: true },
  { id: 'team', label: 'Team', icon: UserCog, color: 'text-amber-200', bar: 'bg-amber-400' },
  { id: 'branding', label: 'Branding', icon: Settings, color: 'text-amber-200', bar: 'bg-amber-400', ownerOnly: true },
  { id: 'import', label: 'Import Leads', icon: UploadCloud, color: 'text-amber-200', bar: 'bg-amber-400' },
  { id: 'customers', label: 'Customers', icon: Star, color: 'text-amber-200', bar: 'bg-amber-400' },
  { id: 'content', label: 'Content Ideas', icon: Sparkles, color: 'text-amber-200', bar: 'bg-amber-400' },
  { id: 'meetings', label: 'Meetings', icon: CalendarClock, color: 'text-amber-200', bar: 'bg-amber-400' },
  { id: 'tickets', label: 'Tickets', icon: LifeBuoy, color: 'text-amber-200', bar: 'bg-amber-400' },
  { id: 'finance', label: 'Finance', icon: Wallet, color: 'text-amber-200', bar: 'bg-amber-400', ownerOnly: true },
];

// Mobile bottom bar shows only the 4 most-used destinations; everything else
// lives behind "More" so the bar never scrolls sideways off-screen.
const MOBILE_MORE_IDS: Tab[] = ['voice', 'plan', 'team', 'branding', 'import', 'customers', 'content', 'meetings', 'tickets', 'finance'];
const MOBILE_PRIMARY_TABS = NAV_ITEMS.filter((item) => !MOBILE_MORE_IDS.includes(item.id));

const CHANNEL_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  youtube: { label: 'YouTube', icon: Youtube, color: 'bg-red-500' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
  facebook: { label: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'bg-sky-600' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500' },
  website: { label: 'Website', icon: Globe, color: 'bg-indigo-500' },
  referral: { label: 'Referral', icon: UserPlus, color: 'bg-amber-500' },
  existing_customer: { label: 'Existing Customer', icon: Star, color: 'bg-purple-500' },
  walk_in: { label: 'Walk-in', icon: Users, color: 'bg-rose-500' },
  organic: { label: 'Organic Search', icon: Globe, color: 'bg-teal-500' },
  other: { label: 'Other', icon: Globe, color: 'bg-gray-400' },
};

const CHANNEL_HOVER: Record<string, string> = {
  youtube: 'hover:bg-red-50 hover:border-red-300 hover:text-red-700',
  instagram: 'hover:bg-pink-50 hover:border-pink-300 hover:text-pink-700',
  facebook: 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
  linkedin: 'hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700',
  whatsapp: 'hover:bg-green-50 hover:border-green-300 hover:text-green-700',
  website: 'hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700',
  referral: 'hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700',
  existing_customer: 'hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700',
  walk_in: 'hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700',
  organic: 'hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700',
  other: 'hover:bg-gray-100 hover:border-gray-300 hover:text-gray-700',
};

const PLAN_DETAILS: Record<NumerologistProfile['subscription_status'], { label: string; color: string }> = {
  trial: { label: 'Free Trial', color: 'text-indigo-600 bg-indigo-50' },
  active: { label: 'Active Subscription', color: 'text-green-600 bg-green-50' },
  past_due: { label: 'Payment Past Due', color: 'text-red-600 bg-red-50' },
  cancelled: { label: 'Cancelled', color: 'text-gray-500 bg-gray-100' },
};

export default function NumerologistDashboard() {
  const [profile, setProfile] = useState<NumerologistProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBranding, setSavingBranding] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [channelData, setChannelData] = useState<ChannelBreakdown[]>([]);
  const [stageData, setStageData] = useState<StageBreakdown[]>([]);
  const [forecast, setForecast] = useState<Forecast>({ openPipelineValue: 0, weightedForecast: 0 });
  const [isOwner, setIsOwner] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mySubscription, setMySubscription] = useState<MySubscription | null>(null);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadSearch, setLeadSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [businessNameInput, setBusinessNameInput] = useState('');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupError, setBackupError] = useState('');
  const [driveConnecting, setDriveConnecting] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveSyncing, setDriveSyncing] = useState(false);
  const [driveError, setDriveError] = useState('');
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [workspace, setWorkspace] = useState<'crm' | 'numerology'>('crm');
  const [numerologyTool, setNumerologyTool] = useState<NumerologyToolId>('name_correction');
  const [numerologyContextLead, setNumerologyContextLead] = useState<Lead | null>(null);

  const openNumerologyToolsFor = (lead: Lead | null) => {
    setNumerologyContextLead(lead);
    setWorkspace('numerology');
    setNumerologyTool('name_correction');
  };

  const goHome = () => {
    setWorkspace('crm');
    setNumerologyContextLead(null);
    setActiveTab('dashboard');
  };
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredLeads = leads.filter((lead) => {
    if (scoreFilter && lead.lead_score !== scoreFilter) return false;
    if (statusFilter && lead.status !== statusFilter) return false;
    if (channelFilter && lead.channel !== channelFilter) return false;
    if (tagFilter && !(lead.tags || []).includes(tagFilter)) return false;
    if (leadSearch.trim()) {
      const q = leadSearch.trim().toLowerCase();
      const name = `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase();
      const mobile = lead.mobile_number || '';
      if (!name.includes(q) && !mobile.includes(q)) return false;
    }
    return true;
  });

  const allTags = Array.from(new Set(leads.flatMap((l) => l.tags || []))).sort();

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedLeadIds((prev) =>
      filteredLeads.every((l) => prev.has(l.id)) ? new Set() : new Set(filteredLeads.map((l) => l.id))
    );
  };

  const handleBulkStatus = async (status: Lead['status']) => {
    setBulkBusy(true);
    await bulkUpdateLeads(Array.from(selectedLeadIds), { status });
    setBulkBusy(false);
    setSelectedLeadIds(new Set());
    loadDashboard();
  };

  const handleBulkScore = async (lead_score: Lead['lead_score']) => {
    setBulkBusy(true);
    await bulkUpdateLeads(Array.from(selectedLeadIds), { lead_score });
    setBulkBusy(false);
    setSelectedLeadIds(new Set());
    loadDashboard();
  };

  const handleBulkTag = async () => {
    if (!bulkTagInput.trim()) return;
    setBulkBusy(true);
    const currentTagsByLead: Record<string, string[]> = {};
    leads.forEach((l) => { currentTagsByLead[l.id] = l.tags || []; });
    await bulkAddTag(Array.from(selectedLeadIds), bulkTagInput.trim(), currentTagsByLead);
    setBulkBusy(false);
    setBulkTagInput('');
    setSelectedLeadIds(new Set());
    loadDashboard();
  };

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  const goToLeads = (opts: { channel?: string; score?: string; status?: string } = {}) => {
    setChannelFilter(opts.channel ?? '');
    setScoreFilter(opts.score ?? '');
    setStatusFilter(opts.status ?? '');
    setLeadSearch('');
    setActiveTab('leads');
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      const [planList, sub] = await Promise.all([getSubscriptionPlans(), getMySubscription(profile.id)]);
      setPlans(planList);
      setMySubscription(sub);
    })();
  }, [profile?.id]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!profile || subscribingPlanId) return;
    setSubscribingPlanId(plan.id);
    setSubscribeError('');
    const res = await subscribeToPlan(profile.id, plan, profile.business_name, '');
    setSubscribingPlanId(null);
    if (!res.success) {
      setSubscribeError(res.error || 'Could not start checkout');
      return;
    }
    const sub = await getMySubscription(profile.id);
    setMySubscription(sub);
  };

  const loadDashboard = async () => {
    setLoading(true);
    const me = await getCurrentProfile();
    if (!me) {
      setLoading(false);
      return;
    }

    const acting = await resolveActingProfile(me.id);
    if (!acting) {
      setLoading(false);
      return;
    }
    setIsOwner(acting.isOwner);

    const numerologistProfile = await getNumerologistProfileById(acting.numerologistId);
    setProfile(numerologistProfile);

    if (numerologistProfile) {
      const myLeads = await getMyLeads(numerologistProfile.id);
      setLeads(myLeads);
      loadAnalytics(numerologistProfile.id);
      setBusinessNameInput(numerologistProfile.business_name);
      setLogoUrlInput(numerologistProfile.logo_url || '');
      await ensureFollowupTasks();
      setTasks(await getOpenTasks(numerologistProfile.id));
      setSavedViews(await getSavedViews(numerologistProfile.id));
      const allAppointments = await getUpcomingAppointments(numerologistProfile.id);
      setAppointments(allAppointments.filter((a) => a.status === 'booked' && new Date(a.scheduled_at) >= new Date()));
    }
    setLoading(false);
  };

  const duplicateGroups = findDuplicateGroups(leads);

  const applySavedView = (view: SavedView) => {
    setChannelFilter(view.filters.channelFilter || '');
    setScoreFilter(view.filters.scoreFilter || '');
    setStatusFilter(view.filters.statusFilter || '');
    setTagFilter(view.filters.tagFilter || '');
  };

  const handleSaveCurrentView = async () => {
    if (!profile) return;
    const name = window.prompt('Name this view, e.g. "Hot Instagram leads"');
    if (!name || !name.trim()) return;
    await saveView(profile.id, name.trim(), { channelFilter, scoreFilter, statusFilter, tagFilter });
    setSavedViews(await getSavedViews(profile.id));
  };

  const handleDeleteSavedView = async (viewId: string) => {
    await deleteSavedView(viewId);
    setSavedViews((prev) => prev.filter((v) => v.id !== viewId));
  };

  const handleCompleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await completeTask(taskId);
  };

  const loadAnalytics = async (numerologistId: string) => {
    const [channels, stagesData, forecastData] = await Promise.all([
      getChannelBreakdown(numerologistId),
      getStageBreakdown(numerologistId),
      getForecast(numerologistId),
    ]);
    setChannelData(channels);
    setStageData(stagesData);
    setForecast(forecastData);
  };

  const handleBrandColorChange = async (color: string) => {
    if (!profile) return;
    setSavingBranding(true);
    await updateBranding(profile.id, { brand_color: color });
    setProfile({ ...profile, brand_color: color });
    setSavingBranding(false);
  };

  const handleCurrencyChange = async (currencyCode: string) => {
    if (!profile) return;
    setSavingBranding(true);
    await updateBranding(profile.id, { currency_code: currencyCode });
    setProfile({ ...profile, currency_code: currencyCode });
    setSavingBranding(false);
  };

  const handleFullBackup = async () => {
    if (!profile) return;
    setBackingUp(true);
    setBackupError('');
    const res = await exportFullBackupJSON(profile);
    setBackingUp(false);
    if (!res.success) setBackupError(res.error || 'Could not build the backup file.');
  };

  const handleConnectDrive = async () => {
    setDriveConnecting(true);
    setDriveError('');
    const res = await connectGoogleDrive();
    setDriveConnecting(false);
    if (res.success) setDriveConnected(true);
    else setDriveError(res.error || 'Could not connect to Google Drive.');
  };

  const handleSyncToDrive = async () => {
    if (!profile) return;
    setDriveSyncing(true);
    setDriveError('');
    const backup = await buildFullBackup(profile);
    const res = await uploadToDrive(backupFilename(), JSON.stringify(backup, null, 2), 'application/json');
    setDriveSyncing(false);
    if (res.success) setDriveFolderId(res.folderId || null);
    else setDriveError(res.error || 'Could not sync to Google Drive.');
  };

  const handleSaveProfile = async (businessName: string, logoUrl: string) => {
    if (!profile) return;
    setSavingBranding(true);
    await updateBranding(profile.id, { business_name: businessName, logo_url: logoUrl || undefined });
    setProfile({ ...profile, business_name: businessName, logo_url: logoUrl || null });
    setSavingBranding(false);
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading your dashboard...</div>;
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-gray-500">
        No numerologist profile found for this account. Please complete onboarding first.
      </div>
    );
  }

  const newLeadsCount = leads.filter((l) => l.status === 'new').length;
  const convertedCount = leads.filter((l) => l.status === 'converted').length;

  // Real week-over-week delta, computed from lead creation timestamps already
  // in hand — no fabricated comparison, and nothing shown where we can't
  // honestly compute one (deals/conversions carry no "won at" timestamp yet).
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const leadAge = (l: Lead) => Date.now() - new Date(l.created_at).getTime();
  const leadsThisWeek = leads.filter((l) => leadAge(l) < WEEK_MS).length;
  const leadsLastWeek = leads.filter((l) => { const age = leadAge(l); return age >= WEEK_MS && age < WEEK_MS * 2; }).length;
  const leadsDeltaPct = leadsLastWeek > 0 ? Math.round(((leadsThisWeek - leadsLastWeek) / leadsLastWeek) * 100) : null;

  const AVATAR_COLORS = [
    'from-indigo-400 to-blue-500', 'from-pink-400 to-rose-500', 'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-500', 'from-purple-400 to-fuchsia-500', 'from-cyan-400 to-sky-500',
  ];
  const avatarFor = (name: string) => {
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  };
  const initials = (first: string | null, last: string | null) =>
    `${(first || '?')[0]}${(last || '')[0] || ''}`.toUpperCase();

  const scoreBadge = (score: Lead['lead_score']) => {
    const styles: Record<Lead['lead_score'], string> = {
      hot: 'bg-red-100 text-red-700',
      warm: 'bg-amber-100 text-amber-700',
      cold: 'bg-blue-100 text-blue-700',
    };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${styles[score]}`}>{score}</span>;
  };

  const SCORE_ROW_HOVER: Record<Lead['lead_score'], string> = {
    hot: 'hover:bg-red-50 hover:border-l-red-400',
    warm: 'hover:bg-amber-50 hover:border-l-amber-400',
    cold: 'hover:bg-blue-50 hover:border-l-blue-400',
  };

  const statusBadge = (status: Lead['status']) => {
    const styles: Record<Lead['status'], string> = {
      new: 'bg-gray-100 text-gray-600',
      contacted: 'bg-blue-100 text-blue-700',
      converted: 'bg-green-100 text-green-700',
      lost: 'bg-red-100 text-red-700',
    };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-[#fbf3e7] md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gradient-to-b from-[#4a0d1f] via-[#5c1029] to-[#3a0a18] border-r border-amber-500/20">
        <div className="px-5 py-5 border-b border-amber-400/15">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#3a0a18]" />
            </div>
            <h1 className="text-base font-display font-semibold text-amber-50 truncate">{profile.business_name}</h1>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-200 bg-amber-400/10 px-2 py-0.5 rounded-full">
            {profile.subscription_status} plan
          </span>
        </div>
        <div className="px-3 pt-3 space-y-2">
          <div className="flex gap-1 bg-black/20 rounded-lg p-1">
            <button
              onClick={() => setWorkspace('crm')}
              className={`flex-1 text-xs font-bold uppercase tracking-wide py-2 rounded-md transition-colors ${
                workspace === 'crm' ? 'bg-amber-400 text-[#3a0a18]' : 'text-amber-100/60 hover:text-amber-50'
              }`}
            >
              CRM
            </button>
            <button
              onClick={() => setWorkspace('numerology')}
              className={`flex-1 text-xs font-bold uppercase tracking-wide py-2 rounded-md transition-colors ${
                workspace === 'numerology' ? 'bg-amber-400 text-[#3a0a18]' : 'text-amber-100/60 hover:text-amber-50'
              }`}
            >
              Numerology
            </button>
          </div>
          {workspace === 'crm' && (
            <button
              onClick={() => setShowGlobalSearch(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-amber-50/5 hover:bg-amber-400/10 text-amber-100/60 hover:text-amber-50 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">Search...</span>
              <span className="text-[10px] font-mono border border-amber-400/20 rounded px-1.5 py-0.5">⌘K</span>
            </button>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {workspace === 'crm' ? (
            NAV_ITEMS.filter((item) => isOwner || !item.ownerOnly).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-amber-400/15 text-amber-50' : 'text-amber-100/60 hover:bg-amber-400/20 hover:text-amber-50'
                  }`}
                >
                  {isActive && <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full ${item.bar}`} />}
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  {item.label}
                </button>
              );
            })
          ) : (
            <>
              <button
                onClick={goHome}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-100/60 hover:bg-amber-400/20 hover:text-amber-50 mb-2"
              >
                <Home className="w-4 h-4 text-amber-200" />
                Home
              </button>
              {NUMEROLOGY_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = numerologyTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setNumerologyTool(tool.id)}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-amber-400/15 text-amber-50' : 'text-amber-100/60 hover:bg-amber-400/20 hover:text-amber-50'
                    }`}
                  >
                    {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-amber-400" />}
                    <Icon className="w-4 h-4 text-amber-200" />
                    {tool.label}
                    {!tool.built && <span className="text-[9px] text-amber-200/50 ml-auto">soon</span>}
                  </button>
                );
              })}
            </>
          )}
        </nav>
        <div className="px-3 py-4 border-t border-amber-400/15">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-100/50 hover:bg-amber-400/5 hover:text-red-300"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
          <div className="mt-2 px-3 flex items-center gap-1.5 text-[11px] text-amber-200/50">
            <Sparkles className="w-3 h-3" />
            Powered by AskNameAI
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden bg-gradient-to-r from-[#4a0d1f] via-[#5c1029] to-[#3a0a18] sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#3a0a18]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-amber-50">{profile.business_name}</h1>
              <p className="text-[10px] text-amber-200 capitalize">{profile.subscription_status} plan</p>
            </div>
          </div>
          <button onClick={() => signOut()} className="text-amber-200 hover:text-red-300 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 pb-3 flex gap-1 bg-black/20 mx-4 rounded-lg p-1">
          <button
            onClick={() => setWorkspace('crm')}
            className={`flex-1 text-[11px] font-bold uppercase tracking-wide py-1.5 rounded-md transition-colors ${
              workspace === 'crm' ? 'bg-amber-400 text-[#3a0a18]' : 'text-amber-100/60'
            }`}
          >
            CRM
          </button>
          <button
            onClick={() => setWorkspace('numerology')}
            className={`flex-1 text-[11px] font-bold uppercase tracking-wide py-1.5 rounded-md transition-colors ${
              workspace === 'numerology' ? 'bg-amber-400 text-[#3a0a18]' : 'text-amber-100/60'
            }`}
          >
            Numerology
          </button>
        </div>
      </div>

      {/* Mobile bottom navigation: fixed bar, 4 destinations + More sheet (CRM) or tool list (Numerology) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-20 flex bg-gradient-to-r from-[#4a0d1f] via-[#5c1029] to-[#3a0a18] border-t border-amber-500/20 overflow-x-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {workspace === 'crm' ? (
          <>
            {MOBILE_PRIMARY_TABS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px] py-1.5 text-[10px] font-medium transition-colors ${
                    isActive ? 'text-amber-50' : 'text-amber-100/50 hover:text-amber-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => setShowMoreSheet(true)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px] py-1.5 text-[10px] font-medium transition-colors ${
                showMoreSheet || MOBILE_MORE_IDS.includes(activeTab) ? 'text-amber-50' : 'text-amber-100/50 hover:text-amber-100'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              More
            </button>
          </>
        ) : (
          <>
            <button
              onClick={goHome}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px] py-1.5 text-[10px] font-medium text-amber-100/50 hover:text-amber-100 flex-shrink-0 min-w-[64px]"
            >
              <Home className="w-5 h-5" />
              Home
            </button>
            {NUMEROLOGY_TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isActive = numerologyTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setNumerologyTool(tool.id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px] py-1.5 text-[10px] font-medium transition-colors flex-shrink-0 min-w-[76px] ${
                    isActive ? 'text-amber-50' : 'text-amber-100/50 hover:text-amber-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tool.label}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* More sheet */}
      {showMoreSheet && (
        <div className="md:hidden fixed inset-0 z-30 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMoreSheet(false)} />
          <div
            className="relative w-full bg-white rounded-t-2xl shadow-2xl overflow-hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">More</h2>
              <button onClick={() => setShowMoreSheet(false)} className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-2">
              {NAV_ITEMS.filter((item) => MOBILE_MORE_IDS.includes(item.id) && (isOwner || !item.ownerOnly)).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setShowMoreSheet(false); }}
                    className={`w-full flex items-center gap-3 px-5 min-h-[52px] text-sm font-medium transition-colors ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-gray-400" />
                    {item.label}
                  </button>
                );
              })}
              <button
                onClick={() => { setShowMoreSheet(false); signOut(); }}
                className="w-full flex items-center gap-3 px-5 min-h-[52px] text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-60">
        <div className="container mx-auto px-4 pt-8 pb-24 md:pb-8 space-y-8 max-w-5xl">
          {workspace === 'numerology' ? (
            <NumerologyToolsPanel
              tool={numerologyTool}
              contextLead={numerologyContextLead}
              currencyCode={profile.currency_code}
              onHome={goHome}
              onClearContext={() => setNumerologyContextLead(null)}
            />
          ) : (
            <>
          {activeTab === 'dashboard' && (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-display font-semibold text-gray-800">Dashboard</h1>
                <button
                  onClick={() => setShowAddLead(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Lead
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => goToLeads()}
                  className="text-left bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-data uppercase tracking-wider text-gray-400">Total Leads</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-3xl font-display font-bold tabular-nums text-gray-800">{leads.length}</p>
                  <p className="text-xs text-gray-400 mt-1">assigned to you</p>
                  {leadsDeltaPct !== null && (
                    <p className={`text-xs mt-1.5 font-data tabular-nums font-medium ${leadsDeltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {leadsDeltaPct >= 0 ? '↑' : '↓'} {Math.abs(leadsDeltaPct)}% vs last week
                    </p>
                  )}
                </button>
                <button
                  onClick={() => goToLeads({ status: 'new' })}
                  className="text-left bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-data uppercase tracking-wider text-gray-400">Not Yet Contacted</span>
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-3xl font-display font-bold tabular-nums text-gray-800">{newLeadsCount}</p>
                  <p className="text-xs text-gray-400 mt-1">need a first touch</p>
                </button>
                <button
                  onClick={() => goToLeads({ status: 'converted' })}
                  className="text-left bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-data uppercase tracking-wider text-gray-400">Converted</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-display font-bold tabular-nums text-gray-800">{convertedCount}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {leads.length > 0 ? `${Math.round((convertedCount / leads.length) * 100)}% of your book` : 'customers won'}
                  </p>
                </button>
              </div>

              {leads.length === 0 && (
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5" />
                    <h2 className="font-semibold">Welcome to {profile.business_name}'s dashboard</h2>
                  </div>
                  <p className="text-sm text-indigo-100 mb-4">A few steps to get your practice fully set up:</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0" />
                      <span>Account created and verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0" />
                      <span>Business profile set up</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Circle className="w-4 h-4 text-indigo-200 flex-shrink-0" />
                      <span>
                        Set your brand color —{' '}
                        <button onClick={() => setActiveTab('branding')} className="underline hover:text-white">
                          do it now
                        </button>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Circle className="w-4 h-4 text-indigo-200 flex-shrink-0" />
                      <span>Your first lead — new leads from AskNameAI's free-check funnel are assigned to you automatically, no action needed</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-cyan-400">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-cyan-500" />
                    Upcoming Meetings {appointments.length > 0 && `(${appointments.length})`}
                  </h2>
                  <button onClick={() => setActiveTab('meetings')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                    Manage
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-4">Booked through your public booking link — see Meetings to set availability or copy the link.</p>
                {appointments.length === 0 ? (
                  <p className="text-sm text-gray-400">No meetings booked yet. Share your booking link (Meetings tab) so leads can pick a slot themselves.</p>
                ) : (
                  <div className="space-y-2">
                    {appointments.slice(0, 5).map((appt) => (
                      <div key={appt.id} className="flex flex-wrap items-center justify-between gap-2 border border-cyan-100 bg-cyan-50/40 rounded-lg px-3 py-2.5">
                        <div className="min-w-0">
                          {appt.lead_id ? (
                            <button onClick={() => setSelectedLeadId(appt.lead_id!)} className="text-sm font-medium text-gray-800 hover:underline text-left">
                              {appt.name}
                            </button>
                          ) : (
                            <p className="text-sm font-medium text-gray-800">{appt.name}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                            <span>{formatDateTime(appt.scheduled_at)}</span>
                            {appt.mobile_number && <span>{appt.mobile_number}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {appointments.length > 5 && (
                      <button onClick={() => setActiveTab('meetings')} className="text-xs text-indigo-600 hover:underline">
                        + {appointments.length - 5} more upcoming
                      </button>
                    )}
                  </div>
                )}
              </div>

              {tasks.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-rose-400">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
                    <ListTodo className="w-4 h-4 text-rose-500" />
                    Follow-up Tasks
                  </h2>
                  <p className="text-xs text-gray-400 mb-4">Auto-created when a deal sits untouched for a week — clear it once you've followed up.</p>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between gap-3 border border-rose-100 bg-rose-50/40 rounded-lg px-3 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            title="Mark done"
                            className="w-5 h-5 rounded-full border-2 border-rose-300 hover:bg-rose-500 hover:border-rose-500 flex-shrink-0 transition-colors"
                          />
                          <div className="min-w-0">
                            <button onClick={() => setSelectedLeadId(task.lead_id)} className="text-sm font-medium text-gray-800 hover:underline text-left truncate block">
                              {task.lead?.first_name} {task.lead?.last_name}
                            </button>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-display font-semibold text-gray-800">Where your pipeline stands</h2>
                    <button onClick={() => setActiveTab('pipeline')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      Open board
                    </button>
                  </div>
                  <p className="text-[11px] font-data uppercase tracking-wide text-gray-400 mb-4">deals by stage</p>
                  {stageData.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">No deals yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {stageData.map((s) => {
                        const max = Math.max(1, ...stageData.map((x) => x.count));
                        return (
                          <div key={s.stageName} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-28 flex-shrink-0 truncate" title={s.stageName}>{s.stageName}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                              <div className="bg-indigo-500 h-2.5 rounded-full transition-all" style={{ width: `${(s.count / max) * 100}%` }} />
                            </div>
                            <span className="text-xs font-data tabular-nums text-gray-600 w-6 text-right flex-shrink-0">{s.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-display font-semibold text-gray-800">Top Channels</h2>
                    <button onClick={() => setActiveTab('analytics')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      Full analytics
                    </button>
                  </div>
                  <p className="text-[11px] font-data uppercase tracking-wide text-gray-400 mb-4">by lead volume</p>
                  {channelData.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">No leads yet.</p>
                  ) : (
                    <ol className="space-y-2.5">
                      {channelData.slice(0, 5).map((c, i) => {
                        const meta = CHANNEL_META[c.channel] || CHANNEL_META.other;
                        const max = channelData[0]?.count || 1;
                        return (
                          <li key={c.channel}>
                            <button onClick={() => goToLeads({ channel: c.channel })} className="w-full flex items-center gap-2.5 text-left group">
                              <span className="text-[11px] font-data text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-700 font-medium group-hover:text-indigo-600 truncate">{meta.label}</span>
                                  <span className="font-data tabular-nums text-gray-500">{c.count}</span>
                                </div>
                                <div className="bg-gray-100 rounded-full h-1.5">
                                  <div className={`${meta.color} h-1.5 rounded-full`} style={{ width: `${(c.count / max) * 100}%` }} />
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display font-semibold text-gray-800">Recent Leads</h2>
                  <button onClick={() => setActiveTab('leads')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                    View all
                  </button>
                </div>
                <p className="text-[11px] font-data uppercase tracking-wide text-gray-400 mb-3">latest activity</p>
                {leads.length === 0 ? (
                  <p className="text-sm text-gray-400">No leads assigned to you yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {leads.slice(0, 5).map((lead) => (
                      <div key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className={`py-3 flex items-center justify-between text-sm cursor-pointer border-l-4 border-l-transparent -mx-2 px-2 rounded-lg transition-colors ${SCORE_ROW_HOVER[lead.lead_score]}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarFor(lead.first_name || 'X')} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {initials(lead.first_name, lead.last_name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{lead.first_name} {lead.last_name}</p>
                            <p className="text-gray-400 text-xs">{lead.mobile_number || lead.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {scoreBadge(lead.lead_score)}
                          {statusBadge(lead.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'pipeline' && <CrmBoard numerologistId={profile.id} currencyCode={profile.currency_code} isOwner={isOwner} businessName={profile.business_name} />}

          {activeTab === 'leads' && (
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-400">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  All Leads
                </h2>
                <div className="flex items-center gap-2">
                  {duplicateGroups.length > 0 && (
                    <button
                      onClick={() => setShowDuplicates(true)}
                      className="border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                    >
                      Manage Duplicates ({duplicateGroups.length})
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('import')}
                    className="border border-sky-200 text-sky-700 hover:bg-sky-50 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Import
                  </button>
                  <button
                    onClick={() => setShowAddLead(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Lead
                  </button>
                </div>
              </div>

              {/* Saved Views - HubSpot's "Lists": a named, reusable filter combination */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Views:</span>
                {savedViews.map((view) => (
                  <span key={view.id} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full pl-2.5 pr-1 py-1">
                    <button onClick={() => applySavedView(view)} className="text-xs font-medium text-gray-600 hover:text-indigo-600">
                      {view.name}
                    </button>
                    <button onClick={() => handleDeleteSavedView(view.id)} className="text-gray-300 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button onClick={handleSaveCurrentView} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-dashed border-indigo-200 rounded-full px-2.5 py-1">
                  + Save current filters
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    placeholder="Search name or mobile..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-900"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">All statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* Score funnel chips: Hot / Warm / Cold */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                <button
                  onClick={() => setScoreFilter('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    scoreFilter === ''
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700'
                  }`}
                >
                  All ({leads.length})
                </button>
                {(['hot', 'warm', 'cold'] as const).map((s) => {
                  const count = leads.filter((l) => l.lead_score === s).length;
                  const activeColors: Record<string, string> = {
                    hot: 'bg-red-500 border-red-500',
                    warm: 'bg-amber-500 border-amber-500',
                    cold: 'bg-blue-500 border-blue-500',
                  };
                  const hoverColors: Record<string, string> = {
                    hot: 'hover:bg-red-50 hover:border-red-300 hover:text-red-700',
                    warm: 'hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700',
                    cold: 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
                  };
                  return (
                    <button
                      key={s}
                      onClick={() => setScoreFilter(scoreFilter === s ? '' : s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition-colors cursor-pointer ${
                        scoreFilter === s ? `${activeColors[s]} text-white` : `border-gray-200 text-gray-500 ${hoverColors[s]}`
                      }`}
                    >
                      {s} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Channel chips: which lead source is selected */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <button
                  onClick={() => setChannelFilter('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    channelFilter === ''
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-gray-200 text-gray-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                  }`}
                >
                  All channels
                </button>
                {Object.entries(CHANNEL_META).map(([channel, meta]) => {
                  const count = leads.filter((l) => l.channel === channel).length;
                  if (count === 0) return null;
                  const isActive = channelFilter === channel;
                  return (
                    <button
                      key={channel}
                      onClick={() => setChannelFilter(isActive ? '' : channel)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                        isActive ? `${meta.color} border-transparent text-white` : `border-gray-200 text-gray-500 ${CHANNEL_HOVER[channel] || CHANNEL_HOVER.other}`
                      }`}
                    >
                      {meta.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Tag chips: segment your list the way a HubSpot "list" would */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase self-center mr-1">Tags:</span>
                  {allTags.map((tag) => {
                    const isActive = tagFilter === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setTagFilter(isActive ? '' : tag)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                          isActive ? 'bg-fuchsia-600 border-fuchsia-600 text-white' : 'border-fuchsia-200 text-fuchsia-600 hover:bg-fuchsia-50'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Bulk action toolbar - HubSpot's "select rows, edit one property for all" pattern */}
              {selectedLeadIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2.5 mb-3">
                  <span className="text-xs font-semibold text-indigo-700">{selectedLeadIds.size} selected</span>
                  <select
                    onChange={(e) => { if (e.target.value) handleBulkStatus(e.target.value as Lead['status']); e.target.value = ''; }}
                    disabled={bulkBusy}
                    defaultValue=""
                    className="text-xs border border-indigo-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white"
                  >
                    <option value="" disabled>Set status...</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                  <select
                    onChange={(e) => { if (e.target.value) handleBulkScore(e.target.value as Lead['lead_score']); e.target.value = ''; }}
                    disabled={bulkBusy}
                    defaultValue=""
                    className="text-xs border border-indigo-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white"
                  >
                    <option value="" disabled>Set score...</option>
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={bulkTagInput}
                      onChange={(e) => setBulkTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBulkTag(); } }}
                      placeholder="Add tag to selected..."
                      className="text-xs border border-indigo-200 rounded-lg px-2 py-1.5 text-gray-900 w-40"
                    />
                    <button onClick={handleBulkTag} disabled={bulkBusy} className="text-xs bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-lg">
                      Tag
                    </button>
                  </div>
                  <button onClick={() => setSelectedLeadIds(new Set())} className="text-xs text-gray-400 hover:text-gray-600 ml-auto">
                    Clear selection
                  </button>
                </div>
              )}

              {filteredLeads.length === 0 ? (
                <p className="text-sm text-gray-400">
                  {leads.length === 0 ? 'No leads assigned to you yet.' : 'No leads match your filters.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                        <th className="py-2 pr-2 w-8">
                          <input
                            type="checkbox"
                            checked={filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.has(l.id))}
                            onChange={toggleSelectAllFiltered}
                            className="rounded"
                          />
                        </th>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Contact</th>
                        <th className="py-2 pr-4">Channel</th>
                        <th className="py-2 pr-4">Score</th>
                        <th className="py-2 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLeads.map((lead) => {
                        const meta = CHANNEL_META[lead.channel] || CHANNEL_META.other;
                        const ChannelIcon = meta.icon;
                        return (
                        <tr key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className={`cursor-pointer border-l-4 border-l-transparent transition-colors ${SCORE_ROW_HOVER[lead.lead_score]}`}>
                          <td className="py-3 pr-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedLeadIds.has(lead.id)}
                              onChange={() => toggleLeadSelection(lead.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="py-3 pr-4 font-medium text-gray-800">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarFor(lead.first_name || 'X')} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                                {initials(lead.first_name, lead.last_name)}
                              </div>
                              <div className="min-w-0">
                                <div>{lead.first_name} {lead.last_name}</div>
                                {lead.tags && lead.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {lead.tags.map((tag) => (
                                      <span key={tag} className="text-[9px] font-medium text-fuchsia-600 bg-fuchsia-50 px-1.5 py-0.5 rounded-full">{tag}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-gray-500">{lead.mobile_number || lead.email || '—'}</td>
                          <td className="py-3 pr-4 text-gray-500">
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full text-white ${meta.color}`}>
                              <ChannelIcon className="w-3 h-3" />
                              {meta.label}
                            </span>
                          </td>
                          <td className="py-3 pr-4">{scoreBadge(lead.lead_score)}</td>
                          <td className="py-3 pr-4">{statusBadge(lead.status)}</td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl shadow-sm p-6 text-white">
                  <p className="text-2xl font-bold">{formatMoney(forecast.openPipelineValue, profile.currency_code)}</p>
                  <p className="text-sm text-slate-200">Open pipeline value</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl shadow-sm p-6 text-white">
                  <p className="text-2xl font-bold">{formatMoney(forecast.weightedForecast, profile.currency_code)}</p>
                  <p className="text-sm text-emerald-100">Weighted forecast — value × each stage's close probability</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-pink-400">
                <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-pink-500" />
                  Lead Sources
                </h2>
                <p className="text-xs text-gray-400 mb-4">Where your leads are actually coming from.</p>
                <div className="space-y-3">
                  {Object.entries(CHANNEL_META).map(([channel, meta]) => {
                    const Icon = meta.icon;
                    const count = channelData.find((c) => c.channel === channel)?.count ?? 0;
                    const max = Math.max(1, ...channelData.map((x) => x.count));
                    return (
                      <button
                        key={channel}
                        onClick={() => goToLeads({ channel })}
                        className={`w-full flex items-center gap-3 rounded-lg p-1.5 -m-1.5 transition-colors hover:bg-gray-50 cursor-pointer ${count === 0 ? 'opacity-40' : ''}`}
                      >
                        <div className={`w-7 h-7 rounded-lg ${meta.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">{meta.label}</span>
                            <span className="font-semibold text-gray-800">{count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className={`${meta.color} h-1.5 rounded-full`} style={{ width: `${(count / max) * 100}%` }} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-400">
                <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <KanbanSquare className="w-4 h-4 text-purple-500" />
                  Conversion Funnel
                </h2>
                <p className="text-xs text-gray-400 mb-4">How many leads are sitting in each pipeline stage.</p>
                {stageData.length === 0 ? (
                  <p className="text-sm text-gray-400">No deals yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {stageData.map((s) => {
                      const grad: Record<string, string> = {
                        'New': 'from-blue-500 to-blue-600',
                        'Contacted': 'from-amber-500 to-amber-600',
                        'Qualified': 'from-purple-500 to-purple-600',
                        'Proposal Sent': 'from-orange-500 to-orange-600',
                        'Won': 'from-emerald-500 to-emerald-600',
                        'Lost': 'from-red-500 to-red-600',
                      };
                      return (
                        <button
                          key={s.stageName}
                          onClick={() => setActiveTab('pipeline')}
                          className={`bg-gradient-to-br ${grad[s.stageName] || 'from-gray-400 to-gray-500'} rounded-lg p-3 text-center text-white transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 hover:ring-white/60 cursor-pointer`}
                        >
                          <p className="text-2xl font-bold">{s.count}</p>
                          <p className="text-xs opacity-90">{s.stageName}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-sm p-8 text-white text-center">
              <PhoneCall className="w-10 h-10 mx-auto mb-3 text-cyan-100" />
              <h2 className="font-semibold text-lg mb-2">AI Voice Calls — Coming Soon</h2>
              <p className="text-sm text-cyan-50 max-w-md mx-auto">
                Automated AI voice follow-up for your leads is in active development. Once live, every call's
                transcript and outcome will show up here, linked to the lead it belongs to.
              </p>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-sm p-6 text-white">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Current Plan
                  </h2>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/25">
                    {PLAN_DETAILS[profile.subscription_status].label}
                  </span>
                </div>
                <p className="text-sm text-amber-50">Your subscription covers everything in your dashboard — leads, pipeline, and branded reports.</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Reports this month</span>
                  <span className="font-medium text-gray-800">
                    {profile.reports_used_this_month} of {profile.reports_limit_per_month}
                  </span>
                </div>
                {(() => {
                  const pct = Math.min(100, (profile.reports_used_this_month / Math.max(1, profile.reports_limit_per_month)) * 100);
                  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
                  return (
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                      <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  );
                })()}

                {mySubscription && mySubscription.status !== 'cancelled' && mySubscription.status !== 'completed' ? (
                  <p className="text-sm bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg px-3 py-2 inline-block">
                    Subscription {mySubscription.status}
                    {mySubscription.current_period_end && ` — renews ${new Date(mySubscription.current_period_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                  </p>
                ) : plans.length === 0 ? (
                  <p className="text-xs text-gray-400">Loading plans...</p>
                ) : (
                  <div>
                    {subscribeError && <p className="text-sm text-red-600 mb-3">{subscribeError}</p>}
                    <div className="grid sm:grid-cols-3 gap-3">
                      {plans.map((p) => (
                        <div key={p.id} className="border border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors">
                          <p className="font-semibold text-gray-800">{p.name}</p>
                          <p className="text-2xl font-bold text-gray-800 mt-1">₹{(p.price_monthly_inr / 100).toLocaleString('en-IN')}</p>
                          <p className="text-xs text-gray-400 mb-3">/month</p>
                          <p className="text-xs text-gray-500 mb-1">{p.reports_limit_per_month} reports/mo</p>
                          <p className="text-xs text-gray-500 mb-4">Up to {p.team_size_limit} team member{p.team_size_limit > 1 ? 's' : ''}</p>
                          <button
                            onClick={() => handleSubscribe(p)}
                            disabled={subscribingPlanId === p.id}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {subscribingPlanId === p.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Subscribe
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">Billed monthly via Razorpay. Cancel any time from your Razorpay account.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'team' && <TeamPanel numerologistId={profile.id} isOwner={isOwner} />}

          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-400">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-teal-500" />
                  Business Profile
                </h2>
                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Business name</label>
                    <input
                      type="text"
                      value={businessNameInput}
                      onChange={(e) => { setBusinessNameInput(e.target.value); setProfileSaved(false); }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Logo URL</label>
                    <input
                      type="text"
                      value={logoUrlInput}
                      onChange={(e) => { setLogoUrlInput(e.target.value); setProfileSaved(false); }}
                      placeholder="https://..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                  <button
                    onClick={async () => { await handleSaveProfile(businessNameInput, logoUrlInput); setProfileSaved(true); }}
                    disabled={savingBranding || !businessNameInput.trim()}
                    className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                  >
                    Save
                  </button>
                  {profileSaved && <span className="text-xs text-green-600 ml-2">Saved</span>}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-400">
                <h2 className="font-semibold text-gray-800 mb-1">Accent Color</h2>
                <p className="text-sm text-gray-500 mb-3">
                  Used on your client-facing reports — this is AskNameAI running under your brand, not ours.
                </p>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {['#4a3aa8', '#9a6f22', '#2c6e49', '#a8385d', '#3a6a9a', '#c2410c'].map((swatch) => (
                    <button
                      key={swatch}
                      onClick={() => handleBrandColorChange(swatch)}
                      disabled={savingBranding}
                      style={{ background: swatch }}
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                        profile.brand_color.toLowerCase() === swatch ? 'ring-2 ring-offset-2 ring-gray-400' : 'ring-1 ring-black/5'
                      }`}
                      aria-label={swatch}
                    />
                  ))}
                  <input
                    type="color"
                    value={profile.brand_color}
                    onChange={(e) => handleBrandColorChange(e.target.value)}
                    disabled={savingBranding}
                    title="Custom color"
                    className="w-8 h-8 border border-gray-200 rounded-full cursor-pointer overflow-hidden"
                  />
                </div>

                <p className="text-xs font-semibold text-gray-500 mb-2">Report preview — updates live</p>
                <div className="rounded-xl overflow-hidden border border-gray-200 max-w-sm">
                  <div className="px-4 py-3 text-white flex items-center justify-between font-semibold text-sm" style={{ background: profile.brand_color }}>
                    <span className="font-display">{profile.business_name || 'Your Practice'}</span>
                    <span className="text-[11px] opacity-85 font-normal">Report preview</span>
                  </div>
                  <div className="bg-white p-4 text-sm text-gray-600">
                    <p className="font-semibold text-gray-800 mb-1">Aarav Mehta — Driver 7, Conductor 9</p>
                    <p className="text-xs">A reflective, analytical energy paired with natural leadership. Full reading attached below.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-400">
                <h2 className="font-semibold text-gray-800 mb-1">Currency</h2>
                <p className="text-xs text-gray-400 mb-3">
                  What you actually charge clients in — used for every deal value across the Pipeline, exports and backups. Not locked to India.
                </p>
                <select
                  value={profile.currency_code}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  disabled={savingBranding}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.label} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-slate-400">
                <h2 className="font-semibold text-gray-800 mb-1">Data & Backup</h2>
                <p className="text-xs text-gray-400 mb-4">
                  Your data always lives securely in AskNameAI's cloud, backed up automatically. These exports are
                  your own copy — for peace of mind, or to move your data anywhere else. You are never locked in.
                </p>

                <div className="flex flex-wrap gap-2 mb-5">
                  <button
                    onClick={handleFullBackup}
                    disabled={backingUp}
                    className="bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    {backingUp ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                    Download full backup (JSON)
                  </button>
                  <button
                    onClick={() => exportLeadsCSV(leads, 'leads')}
                    disabled={leads.length === 0}
                    className="border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 text-sm font-semibold px-4 py-2 rounded-lg"
                  >
                    Export all leads (CSV)
                  </button>
                </div>
                {backupError && <p className="text-xs text-red-600 mb-4">{backupError}</p>}

                <p className="text-xs font-semibold text-gray-600 mb-2">Where your data can go, by plan</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-sm text-gray-800 font-medium">AskNameAI Cloud</p>
                      <p className="text-xs text-gray-400">Always on — every plan, automatic, no setup.</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">Active</span>
                  </div>
                  <div className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-sm text-gray-800 font-medium">Local drive</p>
                      <p className="text-xs text-gray-400">Download the buttons above any time — every plan.</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">Active</span>
                  </div>
                  <div className="border border-gray-100 rounded-lg px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 font-medium">Google Drive backup</p>
                        <p className="text-xs text-gray-400">
                          {!isDriveConfigured()
                            ? 'Not turned on for this app yet — your AskNameAI administrator needs to connect a Google account first.'
                            : profile.subscription_status !== 'active'
                            ? 'Included on the Active plan.'
                            : driveConnected
                            ? 'Connected — saves a full backup into "AskNameAI Backups" in your Drive.'
                            : 'Connect your Google account to back up into your own Drive.'}
                        </p>
                      </div>
                      {!isDriveConfigured() ? (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase flex-shrink-0">Not enabled</span>
                      ) : profile.subscription_status !== 'active' ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase flex-shrink-0">Active plan</span>
                      ) : driveConnected ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase flex-shrink-0">Connected</span>
                      ) : (
                        <button
                          onClick={handleConnectDrive}
                          disabled={driveConnecting}
                          className="flex-shrink-0 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 px-3 py-1.5 rounded-lg"
                        >
                          {driveConnecting ? 'Connecting…' : 'Connect'}
                        </button>
                      )}
                    </div>
                    {isDriveConfigured() && profile.subscription_status === 'active' && driveConnected && (
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={handleSyncToDrive}
                          disabled={driveSyncing}
                          className="text-xs font-semibold bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                        >
                          {driveSyncing && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                          Back up to Drive now
                        </button>
                        {driveFolderId && (
                          <a href={driveFolderUrl(driveFolderId)} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                            View backups in Drive
                          </a>
                        )}
                      </div>
                    )}
                    {driveError && <p className="text-xs text-red-600 mt-2">{driveError}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <ImportLeadsPanel
              numerologistId={profile.id}
              existingLeads={leads}
              onImported={loadDashboard}
              onViewLeads={() => setActiveTab('leads')}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersPanel
              numerologistId={profile.id}
              leads={leads}
              onLeadCreated={loadDashboard}
              onSelectLead={setSelectedLeadId}
            />
          )}

          {activeTab === 'content' && (
            <ContentPanel numerologistId={profile.id} businessName={profile.business_name} />
          )}

          {activeTab === 'meetings' && <MeetingsPanel numerologistId={profile.id} />}

          {activeTab === 'tickets' && <TicketsPanel numerologistId={profile.id} onSelectLead={setSelectedLeadId} />}

          {activeTab === 'finance' && <FinancePanel numerologistId={profile.id} currencyCode={profile.currency_code} />}
            </>
          )}
        </div>
      </main>

      <GlobalSearch leads={leads} open={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} onSelectLead={setSelectedLeadId} />

      {showDuplicates && (
        <DuplicatesModal groups={duplicateGroups} onClose={() => setShowDuplicates(false)} onMerged={loadDashboard} />
      )}

      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
          onLeadUpdated={loadDashboard}
          onOpenNumerologyTools={(lead) => { openNumerologyToolsFor(lead); setSelectedLeadId(null); }}
        />
      )}
      {showAddLead && (
        <AddLeadModal
          numerologistId={profile.id}
          existingLeads={leads}
          onClose={() => setShowAddLead(false)}
          onAdded={loadDashboard}
        />
      )}
    </div>
  );
}

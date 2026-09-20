import { supabase } from '../lib/supabase';

/**
 * Platform-wide view for the product owner (user_profiles.is_admin = true),
 * distinct from any one numerologist's own CRM. Existing RLS already grants
 * an admin SELECT access across numerologist_profiles/leads/deals/reports
 * (every relevant policy carries an `is_admin = true` OR-branch), so this
 * reads real data with no new migration.
 *
 * Deliberately does not show MRR/revenue - subscription billing (Phase B)
 * isn't built, so there is no real payment amount to report. Subscriber
 * counts reflect account state (trial/active/past_due/cancelled), not a
 * verified charge.
 */

export interface SubscriberRow {
  id: string;
  business_name: string;
  subscription_status: 'trial' | 'active' | 'past_due' | 'cancelled';
  created_at: string;
  leadCount: number;
  convertedCount: number;
  reportCount: number;
}

export interface SubscriberClientRow {
  name: string;
  lastReportAt: string;
  reportCount: number;
  /** Derived from the originating lead's source_type (free_check/baby_names/manual) - null when the report has no linked lead. */
  type: string | null;
}

const SOURCE_TYPE_LABEL: Record<string, string> = {
  free_check: 'Personal',
  baby_names: 'Baby name',
  manual: 'Manual',
};

export interface SubscriberDetail {
  brand_color: string;
  logo_url: string | null;
  reports_used_this_month: number;
  reports_limit_per_month: number;
  teamSize: number;
  recentLeads: { id: string; name: string; lead_score: string; status: string; channel: string; created_at: string }[];
  clients: SubscriberClientRow[];
}

/**
 * Everything an owner would want to see about one subscriber - usage,
 * branding, team size, recent lead activity, and a client roster (client
 * name / last report date / reports total), grouped from real
 * numerology_reports rows rather than a raw lead list. Matches the depth
 * of a subscriber's own dashboard, read-only.
 */
export async function getSubscriberDetail(numerologistId: string): Promise<SubscriberDetail> {
  const [profileRes, teamRes, leadsRes, reportsRes] = await Promise.all([
    supabase.from('numerologist_profiles').select('brand_color, logo_url, reports_used_this_month, reports_limit_per_month').eq('id', numerologistId).maybeSingle(),
    supabase.from('team_members').select('id').eq('numerologist_id', numerologistId).eq('status', 'active'),
    supabase.from('leads').select('id, first_name, last_name, lead_score, status, channel, created_at').eq('assigned_numerologist_id', numerologistId).order('created_at', { ascending: false }).limit(5),
    supabase.from('numerology_reports').select('first_name, last_name, created_at, lead_id').eq('numerologist_id', numerologistId).order('created_at', { ascending: false }),
  ]);

  const reportRows = reportsRes.data || [];
  const leadIds = Array.from(new Set(reportRows.map((r) => r.lead_id).filter((id): id is string => !!id)));
  const { data: sourceRows } = leadIds.length > 0
    ? await supabase.from('leads').select('id, source_type').in('id', leadIds)
    : { data: [] as { id: string; source_type: string }[] };
  const sourceTypeByLeadId = new Map((sourceRows || []).map((r) => [r.id, r.source_type]));

  const clientsByName = new Map<string, SubscriberClientRow>();
  reportRows.forEach((r) => {
    const name = `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Unknown';
    const type = r.lead_id ? SOURCE_TYPE_LABEL[sourceTypeByLeadId.get(r.lead_id) || ''] || null : null;
    const existing = clientsByName.get(name);
    if (existing) {
      existing.reportCount += 1;
    } else {
      clientsByName.set(name, { name, lastReportAt: r.created_at, reportCount: 1, type });
    }
  });

  return {
    brand_color: profileRes.data?.brand_color || '#4a3aa8',
    logo_url: profileRes.data?.logo_url || null,
    reports_used_this_month: profileRes.data?.reports_used_this_month || 0,
    reports_limit_per_month: profileRes.data?.reports_limit_per_month || 0,
    teamSize: (teamRes.data || []).length,
    recentLeads: (leadsRes.data || []).map((l) => ({
      id: l.id, name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
      lead_score: l.lead_score, status: l.status, channel: l.channel, created_at: l.created_at,
    })),
    clients: Array.from(clientsByName.values()).sort((a, b) => new Date(b.lastReportAt).getTime() - new Date(a.lastReportAt).getTime()),
  };
}

export interface WeekBucket {
  label: string;
  count: number;
}

export interface PlatformOverview {
  totalSubscribers: number;
  statusCounts: Record<string, number>;
  totalLeadsPlatform: number;
  leadsToday: number;
  leadsThisWeek: number;
  leadsDeltaPct: number | null;
  totalConvertedPlatform: number;
  totalReportsPlatform: number;
  subscribers: SubscriberRow[];
  weeklyLeadVolume: WeekBucket[];
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('user_profiles').select('is_admin').eq('auth_user_id', user.id).maybeSingle();
  return !!data?.is_admin;
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const [profilesRes, leadsRes, reportsRes] = await Promise.all([
    supabase.from('numerologist_profiles').select('id, business_name, subscription_status, created_at'),
    supabase.from('leads').select('id, assigned_numerologist_id, status, created_at'),
    supabase.from('numerology_reports').select('id, numerologist_id'),
  ]);

  const profiles = profilesRes.data || [];
  const leads = leadsRes.data || [];
  const reports = reportsRes.data || [];

  const statusCounts: Record<string, number> = { trial: 0, active: 0, past_due: 0, cancelled: 0 };
  profiles.forEach((p) => { statusCounts[p.subscription_status] = (statusCounts[p.subscription_status] || 0) + 1; });

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const leadsToday = leads.filter((l) => now - new Date(l.created_at).getTime() < DAY).length;
  const leadsThisWeek = leads.filter((l) => now - new Date(l.created_at).getTime() < 7 * DAY).length;
  const leadsLastWeek = leads.filter((l) => { const age = now - new Date(l.created_at).getTime(); return age >= 7 * DAY && age < 14 * DAY; }).length;
  const leadsDeltaPct = leadsLastWeek > 0 ? Math.round(((leadsThisWeek - leadsLastWeek) / leadsLastWeek) * 100) : null;

  const leadsByNumerologist: Record<string, { total: number; converted: number }> = {};
  leads.forEach((l) => {
    if (!l.assigned_numerologist_id) return;
    const bucket = leadsByNumerologist[l.assigned_numerologist_id] || { total: 0, converted: 0 };
    bucket.total += 1;
    if (l.status === 'converted') bucket.converted += 1;
    leadsByNumerologist[l.assigned_numerologist_id] = bucket;
  });

  const reportsByNumerologist: Record<string, number> = {};
  reports.forEach((r) => { reportsByNumerologist[r.numerologist_id] = (reportsByNumerologist[r.numerologist_id] || 0) + 1; });

  const subscribers: SubscriberRow[] = profiles.map((p) => ({
    id: p.id,
    business_name: p.business_name,
    subscription_status: p.subscription_status,
    created_at: p.created_at,
    leadCount: leadsByNumerologist[p.id]?.total || 0,
    convertedCount: leadsByNumerologist[p.id]?.converted || 0,
    reportCount: reportsByNumerologist[p.id] || 0,
  })).sort((a, b) => b.leadCount - a.leadCount);

  // Real lead volume for the last 5 weeks, bucketed from actual created_at
  // timestamps - the honest equivalent of the reference's revenue chart,
  // since there's no real revenue figure to draw without subscription
  // billing existing yet.
  const weeklyLeadVolume: WeekBucket[] = [];
  for (let w = 4; w >= 0; w--) {
    const start = now - (w + 1) * 7 * DAY;
    const end = now - w * 7 * DAY;
    const count = leads.filter((l) => {
      const t = new Date(l.created_at).getTime();
      return t >= start && t < end;
    }).length;
    weeklyLeadVolume.push({ label: `Wk ${5 - w}`, count });
  }

  return {
    totalSubscribers: profiles.length,
    statusCounts,
    totalLeadsPlatform: leads.length,
    leadsToday,
    leadsThisWeek,
    leadsDeltaPct,
    totalConvertedPlatform: leads.filter((l) => l.status === 'converted').length,
    totalReportsPlatform: reports.length,
    subscribers,
    weeklyLeadVolume,
  };
}

export interface PlatformLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  mobile_number: string | null;
  channel: string;
  lead_score: 'hot' | 'warm' | 'cold';
  status: 'new' | 'contacted' | 'converted' | 'lost';
  created_at: string;
  assignedTo: string;
}

/** Every lead across every subscriber, with "assigned to" resolved to a business name - the reference's platform-wide Leads table, with real rows instead of 8-of-146 sample data. */
export async function getAllLeadsPlatform(): Promise<PlatformLead[]> {
  const [leadsRes, profilesRes] = await Promise.all([
    supabase.from('leads').select('id, first_name, last_name, mobile_number, channel, lead_score, status, created_at, assigned_numerologist_id').order('created_at', { ascending: false }),
    supabase.from('numerologist_profiles').select('id, business_name'),
  ]);

  const nameById = new Map((profilesRes.data || []).map((p) => [p.id, p.business_name]));

  return (leadsRes.data || []).map((l) => ({
    id: l.id,
    first_name: l.first_name,
    last_name: l.last_name,
    mobile_number: l.mobile_number,
    channel: l.channel,
    lead_score: l.lead_score,
    status: l.status,
    created_at: l.created_at,
    assignedTo: l.assigned_numerologist_id ? (nameById.get(l.assigned_numerologist_id) || 'Unknown') : 'Unassigned',
  }));
}

export interface PlatformCustomer {
  id: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  email: string;
  created_at: string;
  planName: string | null;
  paymentStatus: string | null;
}

/** Direct, non-numerologist customers (free-check / report buyers) and what they purchased, if anything. */
export async function getAllCustomers(): Promise<PlatformCustomer[]> {
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, auth_user_id, first_name, last_name, mobile_number, email, created_at, role')
    .neq('role', 'numerologist');

  const authIds = (profiles || []).map((p) => p.auth_user_id).filter((id): id is string => !!id);
  const { data: payments } = authIds.length > 0
    ? await supabase.from('payments').select('user_id, plan_name, status, created_at').in('user_id', authIds).order('created_at', { ascending: false })
    : { data: [] as { user_id: string; plan_name: string; status: string; created_at: string }[] };

  const latestPaymentByUser = new Map<string, { plan_name: string; status: string }>();
  (payments || []).forEach((p) => {
    if (!latestPaymentByUser.has(p.user_id)) latestPaymentByUser.set(p.user_id, { plan_name: p.plan_name, status: p.status });
  });

  return (profiles || []).map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    mobile_number: p.mobile_number,
    email: p.email,
    created_at: p.created_at,
    planName: p.auth_user_id ? latestPaymentByUser.get(p.auth_user_id)?.plan_name || null : null,
    paymentStatus: p.auth_user_id ? latestPaymentByUser.get(p.auth_user_id)?.status || null : null,
  }));
}

export interface CustomerPurchase {
  id: string;
  plan: string;
  amount: number;
  status: string;
  driver: number;
  conductor: number;
  created_at: string;
}

/**
 * Purchase/report history for one direct customer. The `purchases` table
 * has no user_id column (a pre-existing limitation, not something this
 * change touches), so the match is by name - shown to the admin as such
 * rather than pretending it's an exact account link.
 */
export async function getCustomerPurchases(firstName: string, lastName: string): Promise<CustomerPurchase[]> {
  const { data } = await supabase
    .from('purchases')
    .select('id, plan, amount, status, driver, conductor, created_at')
    .ilike('first_name', firstName)
    .ilike('last_name', lastName)
    .order('created_at', { ascending: false });
  return data || [];
}

export interface AdminNote {
  id: string;
  note: string;
  created_by_name: string | null;
  created_at: string;
}

/** The admin's own timeline on one subscriber or customer account - the same "every touch gets logged" convention the numerologist CRM already uses for leads via `activities`, scoped here to admin_notes since subscribers/customers aren't leads. */
export async function getNotes(entityType: 'subscriber' | 'customer', entityId: string): Promise<AdminNote[]> {
  const { data } = await supabase
    .from('admin_notes')
    .select('id, note, created_by_name, created_at')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function addNote(entityType: 'subscriber' | 'customer', entityId: string, note: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from('user_profiles').select('first_name, last_name').eq('auth_user_id', user.id).maybeSingle() : { data: null };
  const createdByName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Admin' : 'Admin';

  const { error } = await supabase.from('admin_notes').insert({
    entity_type: entityType, entity_id: entityId, note, created_by: user?.id || null, created_by_name: createdByName,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Real lifecycle-state change on a subscriber account - trial/active/past_due/cancelled - not just a read-only badge. */
export async function updateSubscriberStatus(numerologistId: string, status: 'trial' | 'active' | 'past_due' | 'cancelled'): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('numerologist_profiles').update({ subscription_status: status }).eq('id', numerologistId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export interface NumerologistOption {
  id: string;
  business_name: string;
}

export async function getSubscriberOptions(): Promise<NumerologistOption[]> {
  const { data } = await supabase.from('numerologist_profiles').select('id, business_name').order('business_name');
  return data || [];
}

/**
 * Routes a direct/free-tier customer to a subscriber as a new lead - the
 * admin's real lever for turning platform traffic into a subscriber's
 * pipeline, since nothing does this automatically today. Reuses the
 * existing `leads` table (source_type 'manual') rather than adding a new
 * one; RLS already lets an authenticated admin insert (anon_insert_lead
 * is `WITH CHECK (true)` for anon/authenticated alike).
 */
export async function assignCustomerToSubscriber(customer: PlatformCustomer, numerologistId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('leads').insert({
    first_name: customer.first_name,
    last_name: customer.last_name,
    mobile_number: customer.mobile_number,
    email: customer.email,
    source_type: 'manual',
    channel: 'referral',
    lead_score: 'warm',
    status: 'new',
    assigned_numerologist_id: numerologistId,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export function exportSubscribersCSV(subscribers: SubscriberRow[]) {
  const headers = ['business_name', 'subscription_status', 'leads', 'converted', 'reports', 'joined'];
  const rows = subscribers.map((s) => [
    s.business_name, s.subscription_status, s.leadCount, s.convertedCount, s.reportCount, s.created_at.slice(0, 10),
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `asknameai-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

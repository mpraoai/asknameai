import { supabase } from '../lib/supabase';

export interface MarketingExpense {
  id: string;
  numerologist_id: string;
  amount: number;
  channel: string;
  description: string | null;
  spent_on: string;
  created_at: string;
}

export async function getMarketingExpenses(numerologistId: string): Promise<MarketingExpense[]> {
  const { data, error } = await supabase
    .from('marketing_expenses')
    .select('*')
    .eq('numerologist_id', numerologistId)
    .order('spent_on', { ascending: false });

  if (error) {
    console.error('[financeService] getMarketingExpenses error:', error.message);
    return [];
  }
  return data as MarketingExpense[];
}

export async function addMarketingExpense(
  numerologistId: string,
  input: { amount: number; channel: string; description?: string; spentOn: string }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('marketing_expenses').insert({
    numerologist_id: numerologistId,
    amount: input.amount,
    channel: input.channel,
    description: input.description || null,
    spent_on: input.spentOn,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteMarketingExpense(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('marketing_expenses').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Revenue = value of every deal marked as a Won outcome. Closed date is the deal's own updated_at, which only moves on a real stage change (see log_deal_stage_change trigger) - the best "when it closed" signal this CRM has without a separate payments table. */
export interface RevenueRow {
  amount: number;
  closedAt: string;
}

export async function getWonRevenueRows(numerologistId: string): Promise<RevenueRow[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('value, updated_at, stage:crm_stages!inner(is_won)')
    .eq('numerologist_id', numerologistId)
    .eq('stage.is_won', true);

  if (error) {
    console.error('[financeService] getWonRevenueRows error:', error.message);
    return [];
  }
  return (data || []).map((row: any) => ({ amount: row.value || 0, closedAt: row.updated_at }));
}

export type Period = 'month' | 'quarter' | 'half_year' | 'year';

export interface PeriodBucket {
  key: string;
  label: string;
  revenue: number;
  spend: number;
  net: number;
  sortKey: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function bucketKey(dateStr: string, period: Period): { key: string; label: string; sortKey: string } {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-11

  if (period === 'month') {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    return { key, label: `${MONTH_NAMES[month]} ${year}`, sortKey: key };
  }
  if (period === 'quarter') {
    const q = Math.floor(month / 3) + 1;
    const key = `${year}-Q${q}`;
    return { key, label: `Q${q} ${year}`, sortKey: key };
  }
  if (period === 'half_year') {
    const h = month < 6 ? 1 : 2;
    const key = `${year}-H${h}`;
    return { key, label: `H${h} ${year}`, sortKey: key };
  }
  const key = `${year}`;
  return { key, label: `${year}`, sortKey: key };
}

/** Buckets revenue and marketing spend into the requested period, oldest first. */
export function buildPeriodReport(revenue: RevenueRow[], expenses: MarketingExpense[], period: Period): PeriodBucket[] {
  const buckets = new Map<string, PeriodBucket>();

  const ensure = (dateStr: string) => {
    const { key, label, sortKey } = bucketKey(dateStr, period);
    if (!buckets.has(key)) buckets.set(key, { key, label, revenue: 0, spend: 0, net: 0, sortKey });
    return buckets.get(key)!;
  };

  revenue.forEach((r) => {
    const b = ensure(r.closedAt);
    b.revenue += r.amount;
  });
  expenses.forEach((e) => {
    const b = ensure(e.spent_on);
    b.spend += e.amount;
  });

  buckets.forEach((b) => { b.net = b.revenue - b.spend; });

  return Array.from(buckets.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

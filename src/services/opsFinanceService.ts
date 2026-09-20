import { supabase } from '../lib/supabase';

export interface ExpenseEntry {
  id: string;
  category: 'marketing' | 'infra_hosting' | 'gateway_fees' | 'support_tooling' | 'ai_api' | 'other';
  amount_inr: number;
  entry_month: string;
  note: string | null;
  created_at: string;
}

export async function getExpenseEntries(): Promise<ExpenseEntry[]> {
  const { data } = await supabase.from('expense_entries').select('*').order('entry_month', { ascending: false });
  return data || [];
}

export async function addExpenseEntry(input: { category: ExpenseEntry['category']; amount_inr: number; entry_month: string; note?: string }): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('expense_entries').insert(input);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export interface ModuleRevenueRow {
  module_code: string;
  module_name: string;
  revenue_inr: number;
}

export interface FinanceSummary {
  revenueByModule: ModuleRevenueRow[];
  planBaseRevenueInr: number;
  oneTimeReportRevenueInr: number;
  totalRevenueInr: number;
  spendByCategory: { category: string; amount_inr: number }[];
  totalSpendInr: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  marketing: 'Marketing spend', infra_hosting: 'Infra / hosting', gateway_fees: 'Payment gateway fees',
  support_tooling: 'Support tooling', ai_api: 'AI API costs', other: 'Other',
};

/**
 * Real revenue rollup: recurring MRR from real subscriber_modules +
 * subscription_plans pricing, one-time report revenue from real `paid`
 * payments rows, spend from admin-entered expense_entries. Nothing
 * fabricated - if a category has no entries yet, it reads as 0, not a
 * sample figure.
 */
export async function getFinanceSummary(monthStart: Date): Promise<FinanceSummary> {
  const [modulesRes, subModulesRes, profilesRes, plansRes, paymentsRes, expensesRes] = await Promise.all([
    supabase.from('platform_modules').select('code, name, monthly_price_inr'),
    supabase.from('subscriber_modules').select('numerologist_id, module_code').eq('is_enabled', true),
    supabase.from('numerologist_profiles').select('id'),
    supabase.from('subscription_plans').select('id, price_monthly_inr'),
    supabase.from('payments').select('amount, status, created_at').eq('status', 'paid').gte('created_at', monthStart.toISOString()),
    supabase.from('expense_entries').select('category, amount_inr').gte('entry_month', monthStart.toISOString().slice(0, 10)),
  ]);

  const modules = modulesRes.data || [];
  const subModules = subModulesRes.data || [];
  const revenueByModule: ModuleRevenueRow[] = modules
    .filter((m) => m.code !== 'numerology') // core module, free, excluded from add-on revenue
    .map((m) => {
      const count = subModules.filter((sm) => sm.module_code === m.code).length;
      return { module_code: m.code, module_name: m.name, revenue_inr: count * m.monthly_price_inr };
    });

  // Plan-base revenue: every active numerologist profile counted once at
  // an average plan price (real subscriptions table doesn't map 1:1 to
  // numerologist_profiles yet, so this uses the flat count as a
  // transparent estimate rather than a precise per-subscriber lookup).
  // subscription_plans.price_monthly_inr is stored in paise (Razorpay
  // convention); everything else here (platform_modules, expense_entries)
  // is plain rupees, so this is the one place that needs a /100.
  const avgPlanBaseInr = plansRes.data && plansRes.data.length > 0
    ? (plansRes.data.reduce((s, p) => s + p.price_monthly_inr, 0) / plansRes.data.length) / 100
    : 0;
  const planBaseRevenueInr = Math.round((profilesRes.data?.length || 0) * avgPlanBaseInr);

  const oneTimeReportRevenueInr = (paymentsRes.data || []).reduce((sum, p) => sum + p.amount, 0) / 100;

  const addOnRevenueTotal = revenueByModule.reduce((s, r) => s + r.revenue_inr, 0);
  const totalRevenueInr = planBaseRevenueInr + addOnRevenueTotal + oneTimeReportRevenueInr;

  const spendMap: Record<string, number> = {};
  (expensesRes.data || []).forEach((e) => { spendMap[e.category] = (spendMap[e.category] || 0) + e.amount_inr; });
  const spendByCategory = Object.entries(spendMap).map(([category, amount_inr]) => ({ category: CATEGORY_LABELS[category] || category, amount_inr }));
  const totalSpendInr = Object.values(spendMap).reduce((a, b) => a + b, 0);

  return { revenueByModule, planBaseRevenueInr, oneTimeReportRevenueInr, totalRevenueInr, spendByCategory, totalSpendInr };
}

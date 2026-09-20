import { supabase } from '../lib/supabase';

export interface PlatformModule {
  code: string;
  name: string;
  description: string;
  monthly_price_inr: number;
  is_core: boolean;
  is_active: boolean;
  sort_order: number;
}

export async function getPlatformModules(): Promise<PlatformModule[]> {
  const { data } = await supabase.from('platform_modules').select('*').eq('is_active', true).order('sort_order');
  return data || [];
}

export interface SubscriberModuleRow {
  numerologist_id: string;
  module_code: string;
  is_enabled: boolean;
}

export async function getModulesForSubscriber(numerologistId: string): Promise<string[]> {
  const { data } = await supabase.from('subscriber_modules').select('module_code').eq('numerologist_id', numerologistId).eq('is_enabled', true);
  return (data || []).map((r) => r.module_code);
}

export async function toggleSubscriberModule(numerologistId: string, moduleCode: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('subscriber_modules').upsert(
    { numerologist_id: numerologistId, module_code: moduleCode, is_enabled: enabled, updated_at: new Date().toISOString() },
    { onConflict: 'numerologist_id,module_code' }
  );
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getAllSubscriberModules(): Promise<Record<string, string[]>> {
  const { data } = await supabase.from('subscriber_modules').select('numerologist_id, module_code').eq('is_enabled', true);
  const map: Record<string, string[]> = {};
  (data || []).forEach((r) => {
    if (!map[r.numerologist_id]) map[r.numerologist_id] = [];
    map[r.numerologist_id].push(r.module_code);
  });
  return map;
}

export interface WorkCenterStats {
  reportsThisMonth: number;
  revenueThisMonth: number;
  subscriberCount: number;
  totalSubscribers: number;
}

/** Real stats for one work-center page: subscriber count + MRR from real subscriber_modules, usage count from the real tool_usage_log. */
export async function getWorkCenterStats(moduleCode: string, monthlyPriceInr: number): Promise<WorkCenterStats> {
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const [subsRes, totalSubsRes, usageRes] = await Promise.all([
    supabase.from('subscriber_modules').select('numerologist_id', { count: 'exact', head: true }).eq('module_code', moduleCode).eq('is_enabled', true),
    supabase.from('numerologist_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('tool_usage_log').select('id', { count: 'exact', head: true }).eq('module_code', moduleCode).gte('created_at', monthStart.toISOString()),
  ]);

  const subscriberCount = subsRes.count || 0;
  return {
    reportsThisMonth: usageRes.count || 0,
    revenueThisMonth: subscriberCount * monthlyPriceInr,
    subscriberCount,
    totalSubscribers: totalSubsRes.count || 0,
  };
}

export interface ToolUsageRow {
  id: string;
  created_at: string;
}

export async function getRecentToolUsage(moduleCode: string, limit = 10): Promise<ToolUsageRow[]> {
  const { data } = await supabase.from('tool_usage_log').select('id, created_at').eq('module_code', moduleCode).order('created_at', { ascending: false }).limit(limit);
  return data || [];
}

/** Called from the public calculator pages (mobile/business/domain-check) - anonymous, no PII, just a usage count. */
export async function logToolUsage(moduleCode: string): Promise<void> {
  await supabase.from('tool_usage_log').insert({ module_code: moduleCode });
}

import { supabase } from '../lib/supabase';

export interface ChannelBreakdown {
  channel: string;
  count: number;
}

export interface StageBreakdown {
  stageName: string;
  count: number;
}

export async function getChannelBreakdown(numerologistId: string): Promise<ChannelBreakdown[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('lead:leads(channel)')
    .eq('numerologist_id', numerologistId);

  if (error) {
    console.error('[analyticsService] getChannelBreakdown error:', error.message);
    return [];
  }

  const counts: Record<string, number> = {};
  (data || []).forEach((row: any) => {
    const channel = row.lead?.channel || 'other';
    counts[channel] = (counts[channel] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);
}

export interface Forecast {
  openPipelineValue: number;
  weightedForecast: number;
}

/** Sum of (deal value × stage close probability) across open deals - Nestarmy PRD Pillar C "Forecasting". */
export async function getForecast(numerologistId: string): Promise<Forecast> {
  const { data, error } = await supabase
    .from('deals')
    .select('value, stage:crm_stages(probability_pct, is_won, is_lost)')
    .eq('numerologist_id', numerologistId);

  if (error) {
    console.error('[analyticsService] getForecast error:', error.message);
    return { openPipelineValue: 0, weightedForecast: 0 };
  }

  let openPipelineValue = 0;
  let weightedForecast = 0;
  (data || []).forEach((row: any) => {
    if (row.stage?.is_won || row.stage?.is_lost) return;
    const value = row.value || 0;
    openPipelineValue += value;
    weightedForecast += value * ((row.stage?.probability_pct || 0) / 100);
  });

  return { openPipelineValue, weightedForecast };
}

export async function getStageBreakdown(numerologistId: string): Promise<StageBreakdown[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('stage:crm_stages(name, sort_order)')
    .eq('numerologist_id', numerologistId);

  if (error) {
    console.error('[analyticsService] getStageBreakdown error:', error.message);
    return [];
  }

  const counts: Record<string, { count: number; order: number }> = {};
  (data || []).forEach((row: any) => {
    const name = row.stage?.name || 'Unknown';
    const order = row.stage?.sort_order ?? 99;
    if (!counts[name]) counts[name] = { count: 0, order };
    counts[name].count++;
  });

  return Object.entries(counts)
    .map(([stageName, v]) => ({ stageName, count: v.count, order: v.order }))
    .sort((a, b) => a.order - b.order)
    .map(({ stageName, count }) => ({ stageName, count }));
}

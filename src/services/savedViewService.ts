import { supabase } from '../lib/supabase';

export interface ViewFilters {
  channelFilter?: string;
  scoreFilter?: string;
  statusFilter?: string;
  tagFilter?: string;
}

export interface SavedView {
  id: string;
  numerologist_id: string;
  name: string;
  filters: ViewFilters;
  created_at: string;
}

export async function getSavedViews(numerologistId: string): Promise<SavedView[]> {
  const { data, error } = await supabase
    .from('saved_views')
    .select('*')
    .eq('numerologist_id', numerologistId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[savedViewService] getSavedViews error:', error.message);
    return [];
  }
  return data as unknown as SavedView[];
}

export async function saveView(
  numerologistId: string,
  name: string,
  filters: ViewFilters
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('saved_views').insert({ numerologist_id: numerologistId, name, filters });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteSavedView(viewId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('saved_views').delete().eq('id', viewId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

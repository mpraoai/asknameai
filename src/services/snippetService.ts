import { supabase } from '../lib/supabase';

export interface Snippet {
  id: string;
  numerologist_id: string;
  title: string;
  body: string;
  created_at: string;
}

export async function getSnippets(numerologistId: string): Promise<Snippet[]> {
  const { data, error } = await supabase
    .from('snippets')
    .select('*')
    .eq('numerologist_id', numerologistId)
    .order('title', { ascending: true });

  if (error) {
    console.error('[snippetService] getSnippets error:', error.message);
    return [];
  }
  return data as Snippet[];
}

export async function createSnippet(
  numerologistId: string,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('snippets').insert({ numerologist_id: numerologistId, title, body });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteSnippet(snippetId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('snippets').delete().eq('id', snippetId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

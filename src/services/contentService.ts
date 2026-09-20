import { supabase } from '../lib/supabase';

export interface ContentPost {
  id: string;
  numerologist_id: string;
  platform: 'instagram' | 'facebook' | 'whatsapp_status' | 'other';
  caption: string;
  hashtags: string | null;
  scheduled_at: string | null;
  status: 'draft' | 'scheduled' | 'posted' | 'skipped';
  ai_generated: boolean;
  created_at: string;
}

export interface ContentDraft {
  caption: string;
  hashtags: string;
}

/**
 * Calls the generate-content-ideas edge function - reuses the same
 * OPENAI_API_KEY / AI_MODEL_NAME already configured for baby-name
 * generation, no new credentials required.
 */
export async function generateContentDrafts(
  businessName: string,
  platform: ContentPost['platform'],
  focus?: string
): Promise<{ success: boolean; drafts?: ContentDraft[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke('generate-content-ideas', {
    body: { businessName, platform, count: 5, focus: focus || undefined },
  });

  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true, drafts: data.drafts as ContentDraft[] };
}

export async function saveContentPost(
  numerologistId: string,
  post: { platform: ContentPost['platform']; caption: string; hashtags?: string; ai_generated?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('content_posts').insert({
    numerologist_id: numerologistId,
    platform: post.platform,
    caption: post.caption,
    hashtags: post.hashtags || null,
    ai_generated: post.ai_generated ?? true,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getMyContentPosts(numerologistId: string): Promise<ContentPost[]> {
  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('numerologist_id', numerologistId)
    .order('scheduled_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[contentService] getMyContentPosts error:', error.message);
    return [];
  }
  return data as ContentPost[];
}

export async function scheduleContentPost(
  postId: string,
  scheduledAt: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('content_posts')
    .update({ scheduled_at: scheduledAt, status: 'scheduled', updated_at: new Date().toISOString() })
    .eq('id', postId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateContentStatus(
  postId: string,
  status: ContentPost['status']
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('content_posts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', postId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteContentPost(postId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('content_posts').delete().eq('id', postId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

import { NameEngineV2Request, GeneratedNameV2 } from './types';

export interface StreamAINamesParams extends NameEngineV2Request {
  count: number;
  excludeNames: string[];
}

/**
 * Streams AI-generated names one at a time from the generate-names-stream
 * edge function (NDJSON body), invoking onName as each one arrives instead
 * of waiting for the whole batch.
 */
export async function streamAINames(
  params: StreamAINamesParams,
  onName: (name: GeneratedNameV2) => void,
  signal?: AbortSignal
): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-names-stream`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
    signal,
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`AI name stream failed: ${response.status} ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.done) continue;
        onName({ ...parsed, source: 'ai' });
      } catch (err) {
        console.error('[NameEngineV2] Failed to parse stream line:', err, line);
      }
    }
  }

  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer);
      if (!parsed.done) onName({ ...parsed, source: 'ai' });
    } catch {
      // trailing partial line, ignore
    }
  }
}

import { enrichNameWithMultipleSources } from '../externalNameSourcesService';

/**
 * Fetches external reference links for a single name. Designed to be called
 * AFTER a name has already been shown to the user (non-blocking enrichment),
 * so it never delays the initial progressive reveal.
 */
export async function enrichNameLinks(
  name: string,
  gender: 'male' | 'female',
  religion: string
): Promise<Array<{ url: string; title: string; type: string }>> {
  try {
    const cleanName = name.replace(/\d+$/g, '').trim();
    const result = await enrichNameWithMultipleSources(cleanName, gender, religion);
    if (result.success && result.enrichmentData.length > 0) {
      return result.enrichmentData.flatMap((data) => data.externalLinks || []);
    }
    return [];
  } catch (error) {
    console.error(`[NameEngineV2] Enrichment failed for ${name}:`, error);
    return [];
  }
}

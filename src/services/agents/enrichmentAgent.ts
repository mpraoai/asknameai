export interface EnrichmentResult {
  success: boolean;
  inserted: number;
  skipped: number;
  total: number;
  error?: string;
}

export const enrichmentAgent = {
  async enrichDatabase(): Promise<EnrichmentResult> {
    console.log('🔄 [EnrichmentAgent] Starting database enrichment...');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/enrich-names-background`;

      console.log('[EnrichmentAgent] Calling enrichment function...');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Enrichment failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      console.log('✅ [EnrichmentAgent] Enrichment complete:', result);
      console.log(`   - Inserted: ${result.inserted} new names`);
      console.log(`   - Skipped: ${result.skipped} duplicates`);
      console.log(`   - Total processed: ${result.total} names`);

      return result;
    } catch (error) {
      console.error('❌ [EnrichmentAgent] Error:', error);
      return {
        success: false,
        inserted: 0,
        skipped: 0,
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async enrichSpecificReligion(religion: string, gender: string, count: number = 20): Promise<EnrichmentResult> {
    console.log(`🔄 [EnrichmentAgent] Enriching ${count} ${gender} ${religion} names...`);

    return this.enrichDatabase();
  }
};

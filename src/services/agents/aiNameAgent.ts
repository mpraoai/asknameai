interface AIAgentParams {
  gender: 'male' | 'female';
  religion: string;
  driver: number;
  conductor: number;
  targetNumbers: number[];
  loshuGrid: number[][];
  count?: number;
  lastName?: string;
}

interface AIGeneratedName {
  name: string;
  meaning: string;
  numerologyValue: number;
  compoundNumber: number;
  compatibilityScore: number;
  explanation: string;
}

export const aiNameAgent = {
  async generateNames(params: AIAgentParams): Promise<AIGeneratedName[]> {
    const { gender, religion, driver, conductor, targetNumbers, loshuGrid, count = 6, lastName } = params;

    console.log('[AIAgent] Requesting AI-generated names...', { gender, religion, count, lastName: lastName || 'none' });

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const apiUrl = `${supabaseUrl}/functions/v1/generate-names-with-ai`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gender,
          religion,
          driver,
          conductor,
          targetNumbers,
          loshuGrid,
          count,
          lastName
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIAgent] API error:', errorText);
        throw new Error(`AI generation failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.names) {
        throw new Error('Invalid response from AI service');
      }

      console.log(`[AIAgent] Successfully generated ${result.names.length} names`);

      return result.names;
    } catch (error) {
      console.error('[AIAgent] Error:', error);
      return [];
    }
  }
};

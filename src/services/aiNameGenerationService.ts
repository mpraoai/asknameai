import { supabase } from '../lib/supabase';
import { orchestratorService } from './agents/orchestratorService';

export interface AIGeneratedName {
  name: string;
  meaning: string;
  numerologyValue: number;
  compoundNumber?: number;
  compatibilityScore: number;
  explanation: string;
  externalLinks?: Array<{
    url: string;
    title: string;
    type: string;
  }>;
}

export interface AIGenerationRequest {
  gender: 'male' | 'female';
  religion: string;
  driver: number;
  conductor: number;
  targetNumbers: number[];
  loshuGrid: number[][];
}

export interface AIGenerationResponse {
  success: boolean;
  names: AIGeneratedName[];
  count: number;
  error?: string;
  details?: string;
}

export const generateNamesWithAI = async (
  params: AIGenerationRequest
): Promise<AIGeneratedName[]> => {
  try {
    console.log('🚀 Initiating multi-agent name generation...');
    const startTime = Date.now();

    const result = await orchestratorService.generateNames(params);

    const executionTime = Date.now() - startTime;

    console.log('✨ Multi-agent generation complete!');
    console.log(`📊 Performance: ${result.names.length} names in ${executionTime}ms`);
    console.log(`🤖 Sources: ${result.metadata.aiCount} AI + ${result.metadata.databaseCount} Database`);

    console.log('=== GENERATED NAMES ===');
    result.names.forEach((name, idx) => {
      console.log(`[${idx + 1}] ${name.name} (${name.numerologyValue}):`, {
        meaning: name.meaning.substring(0, 30) + '...',
        score: name.compatibilityScore,
        explanationLength: name.explanation?.length || 0
      });
    });

    return result.names;
  } catch (error) {
    console.error('❌ Error in generateNamesWithAI:', error);
    throw error;
  }
};

export const saveAIGenerationSession = async (
  gender: 'male' | 'female',
  religion: string,
  driver: number,
  conductor: number,
  targetNumbers: number[]
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('ai_generation_sessions')
      .insert({
        gender,
        religion: religion.toLowerCase(),
        driver_number: driver,
        conductor_number: conductor,
        target_numbers: targetNumbers,
        request_count: 1,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving session:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in saveAIGenerationSession:', error);
    return null;
  }
};

export const saveGeneratedName = async (
  sessionId: string,
  name: AIGeneratedName
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('ai_generated_names')
      .insert({
        session_id: sessionId,
        name: name.name,
        meaning: name.meaning,
        numerology_value: name.numerologyValue,
        compatibility_score: name.compatibilityScore,
        explanation: name.explanation,
        is_saved_by_user: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving generated name:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in saveGeneratedName:', error);
    return null;
  }
};

export const markNameAsSaved = async (
  nameId: string,
  isSaved: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ai_generated_names')
      .update({ is_saved_by_user: isSaved })
      .eq('id', nameId);

    if (error) {
      console.error('Error updating name:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markNameAsSaved:', error);
    return false;
  }
};

export const getSessionHistory = async (limit = 10): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_generation_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching session history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSessionHistory:', error);
    return [];
  }
};

export const getGeneratedNamesForSession = async (
  sessionId: string
): Promise<AIGeneratedName[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_generated_names')
      .select('*')
      .eq('session_id', sessionId)
      .order('compatibility_score', { ascending: false });

    if (error) {
      console.error('Error fetching generated names:', error);
      return [];
    }

    return (data || []).map(item => ({
      name: item.name,
      meaning: item.meaning,
      numerologyValue: item.numerology_value,
      compatibilityScore: item.compatibility_score,
      explanation: item.explanation,
    }));
  } catch (error) {
    console.error('Error in getGeneratedNamesForSession:', error);
    return [];
  }
};

import { generateNamesWithAI, AIGeneratedName } from './aiNameGenerationService';
import { fetchCompatibleNames, BabyNameData } from './babyNameService';
import {
  enrichNameBatch,
  enrichDatabaseNameBatch,
  mergeAIandDatabaseNames,
  sortEnrichedNames,
  EnrichedName
} from './nameEnrichmentService';
import { getGlobalReligions } from './externalNameSourcesService';
import { calculateNameValue, reduceToSingleDigit } from '../utils/chaldeanValues';
import { calculateCompatibilityScore } from '../utils/compatibility';
import { generateExplanation } from '../utils/explanationGenerator';

export interface AggregatedNameRequest {
  gender: 'male' | 'female';
  religion: string;
  driver: number;
  conductor: number;
  targetNumbers: number[];
  loshuGrid: number[][];
  includeAI?: boolean;
  includeDatabase?: boolean;
  includeExternalLinks?: boolean;
}

export interface AggregatedNameResponse {
  success: boolean;
  names: EnrichedName[];
  sources: {
    aiGenerated: number;
    database: number;
    hybrid: number;
  };
  totalCount: number;
  error?: string;
}

export const aggregateNamesFromAllSources = async (
  request: AggregatedNameRequest
): Promise<AggregatedNameResponse> => {
  try {
    const {
      gender,
      religion,
      driver,
      conductor,
      targetNumbers,
      loshuGrid,
      includeAI = true,
      includeDatabase = true,
      includeExternalLinks = true
    } = request;

    let aiNames: AIGeneratedName[] = [];
    let dbNames: BabyNameData[] = [];

    if (includeAI) {
      try {
        aiNames = await generateNamesWithAI({
          gender,
          religion,
          driver,
          conductor,
          targetNumbers,
          loshuGrid
        });
      } catch (error) {
        console.error('Error generating AI names:', error);
      }
    }

    if (includeDatabase) {
      try {
        dbNames = await fetchCompatibleNames(
          gender,
          religion,
          driver,
          conductor,
          targetNumbers
        );
      } catch (error) {
        console.error('Error fetching database names:', error);
      }
    }

    let enrichedAINames: EnrichedName[] = [];
    let enrichedDBNames: any[] = [];

    console.log('=== BEFORE ENRICHMENT ===');
    aiNames.forEach(n => console.log(`${n.name}: numerology=${n.numerologyValue}, score=${n.compatibilityScore}`));

    if (includeExternalLinks) {
      if (aiNames.length > 0) {
        enrichedAINames = await enrichNameBatch(aiNames, gender, religion);
        console.log('=== AFTER ENRICHMENT ===');
        enrichedAINames.forEach(n => console.log(`${n.name}: numerology=${n.numerologyValue}, score=${n.compatibilityScore}`));
      }
      if (dbNames.length > 0) {
        enrichedDBNames = await enrichDatabaseNameBatch(dbNames, gender, religion, driver, conductor, targetNumbers);
        console.log('=== DB NAMES AFTER ENRICHMENT ===');
        enrichedDBNames.forEach((n: any) => console.log(`${n.name}: numerology=${n.numerologyValue}, score=${n.compatibilityScore}`));
      }
    } else {
      enrichedAINames = aiNames.map(name => ({
        name: name.name,
        meaning: name.meaning,
        numerologyValue: name.numerologyValue,
        compatibilityScore: name.compatibilityScore,
        explanation: name.explanation,
        sourceType: 'ai_generated' as const
      }));
      enrichedDBNames = dbNames.map(name => {
        const compoundNumber = calculateNameValue(name.name);
        const numerologyValue = name.numerology_value || reduceToSingleDigit(compoundNumber);
        const compatibilityScore = calculateCompatibilityScore(numerologyValue, driver, conductor, targetNumbers);
        const explanation = generateExplanation(
          name.name,
          name.meaning || name.detailed_meaning,
          numerologyValue,
          driver,
          conductor,
          religion
        );
        console.log(`DB name ${name.name}: compound=${compoundNumber}, numerology=${numerologyValue}, score=${compatibilityScore}`);
        return {
          ...name,
          numerologyValue,
          compoundNumber,
          compatibilityScore,
          explanation,
          sourceType: 'database' as const
        };
      });
    }

    const mergedNames = mergeAIandDatabaseNames(enrichedAINames, enrichedDBNames);
    const sortedNames = sortEnrichedNames(mergedNames, 'compatibility');

    const sources = {
      aiGenerated: sortedNames.filter(n => n.sourceType === 'ai_generated').length,
      database: sortedNames.filter(n => n.sourceType === 'database').length,
      hybrid: sortedNames.filter(n => n.sourceType === 'hybrid').length
    };

    return {
      success: true,
      names: sortedNames as EnrichedName[],
      sources,
      totalCount: sortedNames.length
    };
  } catch (error) {
    console.error('Error aggregating names from all sources:', error);
    return {
      success: false,
      names: [],
      sources: { aiGenerated: 0, database: 0, hybrid: 0 },
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getQuickSuggestions = async (
  gender: 'male' | 'female',
  religion: string,
  driver: number,
  conductor: number
): Promise<EnrichedName[]> => {
  try {
    const targetNumbers = [1, 3, 5, 6];
    const loshuGrid = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

    const result = await aggregateNamesFromAllSources({
      gender,
      religion,
      driver,
      conductor,
      targetNumbers,
      loshuGrid,
      includeAI: true,
      includeDatabase: true,
      includeExternalLinks: false
    });

    return result.names.slice(0, 20);
  } catch (error) {
    console.error('Error getting quick suggestions:', error);
    return [];
  }
};

export const getComprehensiveSuggestions = async (
  request: AggregatedNameRequest
): Promise<AggregatedNameResponse> => {
  return aggregateNamesFromAllSources({
    includeAI: request.includeAI ?? true,
    includeDatabase: request.includeDatabase ?? true,
    includeExternalLinks: request.includeExternalLinks ?? true,
    ...request
  });
};

export const getAIOnlySuggestions = async (
  request: AggregatedNameRequest
): Promise<AggregatedNameResponse> => {
  return aggregateNamesFromAllSources({
    ...request,
    includeAI: true,
    includeDatabase: false,
    includeExternalLinks: true
  });
};

export const getDatabaseOnlySuggestions = async (
  request: AggregatedNameRequest
): Promise<AggregatedNameResponse> => {
  return aggregateNamesFromAllSources({
    ...request,
    includeAI: false,
    includeDatabase: true,
    includeExternalLinks: true
  });
};

export interface GlobalReligionInfo {
  religionCode: string;
  religionName: string;
  religionFamily: string;
  primaryRegions: string[];
  supportedScripts: string[];
  namingTraditions: string;
  isSupported: boolean;
}

export const getSupportedReligions = async (): Promise<GlobalReligionInfo[]> => {
  try {
    const religions = await getGlobalReligions();
    return religions.map((religion: any) => ({
      religionCode: religion.religion_code,
      religionName: religion.religion_name,
      religionFamily: religion.religion_family,
      primaryRegions: religion.primary_regions || [],
      supportedScripts: religion.traditional_scripts || [],
      namingTraditions: religion.naming_traditions_description || '',
      isSupported: religion.supported
    }));
  } catch (error) {
    console.error('Error getting supported religions:', error);
    return [];
  }
};

export const getNamesByReligionFamily = async (
  religionFamily: 'Dharmic' | 'Abrahamic' | 'East Asian' | 'Indigenous' | 'Iranian',
  gender: 'male' | 'female'
): Promise<string[]> => {
  try {
    const allReligions = await getGlobalReligions();
    const familyReligions = allReligions
      .filter((r: any) => r.religion_family === religionFamily)
      .map((r: any) => r.religion_code);

    return familyReligions;
  } catch (error) {
    console.error('Error getting names by religion family:', error);
    return [];
  }
};

export const validateNumerologyBeforeEnrichment = (
  names: AIGeneratedName[],
  driver: number,
  conductor: number
): AIGeneratedName[] => {
  const FAVORABLE_NUMBERS = [1, 3, 5, 6];
  const antiToDriver = getAntiNumbers(driver);
  const antiToConductor = getAntiNumbers(conductor);

  return names.filter(name => {
    if (!FAVORABLE_NUMBERS.includes(name.numerologyValue)) {
      return false;
    }

    if (antiToDriver.includes(name.numerologyValue)) {
      return false;
    }

    if (antiToConductor.includes(name.numerologyValue)) {
      return false;
    }

    return true;
  });
};

const getAntiNumbers = (number: number): number[] => {
  const antiPairs: Record<number, number[]> = {
    1: [8],
    2: [4, 9],
    3: [6],
    4: [2, 9],
    5: [],
    6: [3],
    7: [],
    8: [1],
    9: [2, 4]
  };
  return antiPairs[number] || [];
};

export const getNameStatistics = async (): Promise<{
  totalNames: number;
  namesByReligion: Record<string, number>;
  namesByGender: Record<string, number>;
  aiGeneratedCount: number;
  databaseCount: number;
}> => {
  try {
    const religions = await getGlobalReligions();
    const namesByReligion: Record<string, number> = {};

    religions.forEach((religion: any) => {
      namesByReligion[religion.religion_code] = 0;
    });

    return {
      totalNames: 0,
      namesByReligion,
      namesByGender: { male: 0, female: 0 },
      aiGeneratedCount: 0,
      databaseCount: 0
    };
  } catch (error) {
    console.error('Error getting name statistics:', error);
    return {
      totalNames: 0,
      namesByReligion: {},
      namesByGender: { male: 0, female: 0 },
      aiGeneratedCount: 0,
      databaseCount: 0
    };
  }
};

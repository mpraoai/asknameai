import { AIGeneratedName } from './aiNameGenerationService';
import { BabyNameData } from './babyNameService';
import { enrichNameWithMultipleSources, ExternalNameData } from './externalNameSourcesService';
import { calculateNameValue, reduceToSingleDigit } from '../utils/chaldeanValues';
import { calculateCompatibilityScore } from '../utils/compatibility';
import { generateExplanation } from '../utils/explanationGenerator';

export interface EnrichedName extends AIGeneratedName {
  externalLinks?: Array<{
    url: string;
    title: string;
    type: string;
  }>;
  enrichmentData?: ExternalNameData[];
  sourceType: 'ai_generated' | 'database' | 'hybrid';
}

export interface EnrichedDatabaseName extends BabyNameData {
  externalLinks?: Array<{
    url: string;
    title: string;
    type: string;
  }>;
  enrichmentData?: ExternalNameData[];
  sourceType: 'database';
  numerologyValue: number;
  compatibilityScore: number;
}

export const enrichAIGeneratedName = async (
  aiName: AIGeneratedName,
  gender: 'male' | 'female',
  religion: string
): Promise<EnrichedName> => {
  try {
    const enrichmentResult = await enrichNameWithMultipleSources(
      aiName.name,
      gender,
      religion
    );

    const allLinks = enrichmentResult.enrichmentData.flatMap(
      data => data.externalLinks || []
    );

    return {
      ...aiName,
      externalLinks: allLinks,
      enrichmentData: enrichmentResult.enrichmentData,
      sourceType: 'ai_generated'
    };
  } catch (error) {
    console.error('Error enriching AI generated name:', error);
    return {
      ...aiName,
      sourceType: 'ai_generated'
    };
  }
};

export const enrichDatabaseName = async (
  dbName: BabyNameData,
  gender: 'male' | 'female',
  religion: string,
  driver: number,
  conductor: number,
  targetNumbers: number[]
): Promise<EnrichedDatabaseName> => {
  try {
    const compoundNumber = calculateNameValue(dbName.name);
    const numerologyValue = dbName.numerology_value || reduceToSingleDigit(compoundNumber);
    const compatibilityScore = calculateCompatibilityScore(numerologyValue, driver, conductor, targetNumbers);

    console.log(`Enriching DB name ${dbName.name}: compound=${compoundNumber}, numerology=${numerologyValue}, score=${compatibilityScore}`);

    let existingLinks: Array<{ url: string; title: string; type: string }> = [];

    if (dbName.external_links) {
      if (typeof dbName.external_links === 'string') {
        try {
          existingLinks = JSON.parse(dbName.external_links);
        } catch {
          existingLinks = [];
        }
      } else if (Array.isArray(dbName.external_links)) {
        existingLinks = dbName.external_links;
      }
    }

    const explanation = generateExplanation(
      dbName.name,
      dbName.meaning || dbName.detailed_meaning,
      numerologyValue,
      driver,
      conductor,
      religion
    );

    if (existingLinks.length > 0) {
      return {
        ...dbName,
        externalLinks: existingLinks,
        sourceType: 'database',
        numerologyValue,
        compoundNumber,
        compatibilityScore,
        explanation
      };
    }

    const enrichmentResult = await enrichNameWithMultipleSources(
      dbName.name,
      gender,
      religion
    );

    const allLinks = enrichmentResult.enrichmentData.flatMap(
      data => data.externalLinks || []
    );

    return {
      ...dbName,
      externalLinks: allLinks,
      enrichmentData: enrichmentResult.enrichmentData,
      sourceType: 'database',
      numerologyValue,
      compoundNumber,
      compatibilityScore,
      explanation
    };
  } catch (error) {
    console.error('Error enriching database name:', error);
    const compoundNumber = calculateNameValue(dbName.name);
    const numerologyValue = dbName.numerology_value || reduceToSingleDigit(compoundNumber);
    const compatibilityScore = calculateCompatibilityScore(numerologyValue, driver, conductor, targetNumbers);
    const explanation = generateExplanation(
      dbName.name,
      dbName.meaning || dbName.detailed_meaning,
      numerologyValue,
      driver,
      conductor,
      religion
    );
    return {
      ...dbName,
      sourceType: 'database',
      numerologyValue,
      compoundNumber,
      compatibilityScore,
      explanation
    };
  }
};

export const enrichNameBatch = async (
  names: AIGeneratedName[],
  gender: 'male' | 'female',
  religion: string
): Promise<EnrichedName[]> => {
  try {
    const enrichmentPromises = names.map(name =>
      enrichAIGeneratedName(name, gender, religion)
    );

    const enrichedNames = await Promise.all(enrichmentPromises);
    return enrichedNames;
  } catch (error) {
    console.error('Error enriching name batch:', error);
    return names.map(name => ({
      ...name,
      sourceType: 'ai_generated' as const
    }));
  }
};

export const enrichDatabaseNameBatch = async (
  names: BabyNameData[],
  gender: 'male' | 'female',
  religion: string,
  driver: number,
  conductor: number,
  targetNumbers: number[]
): Promise<EnrichedDatabaseName[]> => {
  try {
    const enrichmentPromises = names.map(name =>
      enrichDatabaseName(name, gender, religion, driver, conductor, targetNumbers)
    );

    const enrichedNames = await Promise.all(enrichmentPromises);
    return enrichedNames;
  } catch (error) {
    console.error('Error enriching database name batch:', error);
    return names.map(name => {
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
      return {
        ...name,
        sourceType: 'database' as const,
        numerologyValue,
        compoundNumber,
        compatibilityScore,
        explanation
      };
    });
  }
};

export const mergeAIandDatabaseNames = (
  aiNames: EnrichedName[],
  dbNames: EnrichedDatabaseName[]
): Array<EnrichedName | EnrichedDatabaseName> => {
  console.log('=== MERGING NAMES ===');
  console.log(`AI names: ${aiNames.length}, DB names: ${dbNames.length}`);

  const nameMap = new Map<string, EnrichedName | EnrichedDatabaseName>();

  aiNames.forEach(name => {
    console.log(`Adding AI name: ${name.name}, numerology=${name.numerologyValue}, score=${name.compatibilityScore}`);
    nameMap.set(name.name.toLowerCase(), name);
  });

  dbNames.forEach(dbName => {
    const normalizedName = dbName.name.toLowerCase();
    const existingName = nameMap.get(normalizedName);

    console.log(`Processing DB name: ${dbName.name}, numerology=${dbName.numerologyValue}, score=${dbName.compatibilityScore}`);

    if (existingName) {
      const mergedLinks = [
        ...(existingName.externalLinks || []),
        ...(dbName.externalLinks || [])
      ];

      const uniqueLinks = Array.from(
        new Map(mergedLinks.map(link => [link.url, link])).values()
      );

      const merged = {
        ...existingName,
        externalLinks: uniqueLinks,
        numerologyValue: existingName.numerologyValue || dbName.numerologyValue,
        compatibilityScore: existingName.compatibilityScore || dbName.compatibilityScore,
        sourceType: 'hybrid' as const
      };
      console.log(`Merged ${dbName.name}: numerology=${merged.numerologyValue}, score=${merged.compatibilityScore}`);
      nameMap.set(normalizedName, merged);
    } else {
      console.log(`Added DB name ${dbName.name} directly: numerology=${dbName.numerologyValue}, score=${dbName.compatibilityScore}`);
      nameMap.set(normalizedName, dbName);
    }
  });

  const result = Array.from(nameMap.values());
  console.log('=== MERGE COMPLETE ===');
  result.forEach(n => console.log(`${n.name}: numerology=${(n as any).numerologyValue}, score=${(n as any).compatibilityScore}`));
  return result;
};

export const sortEnrichedNames = (
  names: Array<EnrichedName | EnrichedDatabaseName>,
  sortBy: 'compatibility' | 'popularity' | 'alphabetical' = 'compatibility'
): Array<EnrichedName | EnrichedDatabaseName> => {
  console.log('=== SORTING NAMES ===');
  names.forEach(n => console.log(`Before sort: ${n.name}, numerology=${(n as any).numerologyValue}, score=${(n as any).compatibilityScore}`));

  const sorted = [...names].sort((a, b) => {
    if (sortBy === 'compatibility') {
      const scoreA = 'compatibilityScore' in a ? (a.compatibilityScore ?? 0) : 0;
      const scoreB = 'compatibilityScore' in b ? (b.compatibilityScore ?? 0) : 0;
      console.log(`Comparing ${a.name}(${scoreA}) vs ${b.name}(${scoreB})`);
      return scoreB - scoreA;
    } else if (sortBy === 'popularity') {
      const popA = 'popularity_score' in a ? a.popularity_score : 0;
      const popB = 'popularity_score' in b ? b.popularity_score : 0;
      return popB - popA;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  console.log('=== AFTER SORTING ===');
  sorted.forEach(n => console.log(`After sort: ${n.name}, numerology=${(n as any).numerologyValue}, score=${(n as any).compatibilityScore}`));

  return sorted;
};

import { aiNameAgent } from './aiNameAgent';
import { databaseNameAgent } from './databaseNameAgent';
import { enrichNameWithMultipleSources } from '../externalNameSourcesService';

export interface NameGenerationRequest {
  gender: 'male' | 'female';
  religion: string;
  driver: number;
  conductor: number;
  targetNumbers: number[];
  loshuGrid: number[][];
  lastName?: string;
}

export interface GeneratedName {
  name: string;
  meaning: string;
  numerologyValue: number;
  compoundNumber: number;
  compatibilityScore: number;
  explanation: string;
  externalLinks?: Array<{
    url: string;
    title: string;
    type: string;
  }>;
  source?: 'ai' | 'database';
}

export interface NameGenerationResult {
  names: GeneratedName[];
  metadata: {
    totalGenerated: number;
    aiCount: number;
    databaseCount: number;
    executionTimeMs: number;
  };
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const orchestratorService = {
  async generateNames(request: NameGenerationRequest): Promise<NameGenerationResult> {
    const startTime = Date.now();
    const TARGET_COUNT = 12;

    console.log('🚀 [Orchestrator] Starting multi-agent name generation...');
    console.log('📋 [Orchestrator] Request:', {
      gender: request.gender,
      religion: request.religion,
      driver: request.driver,
      conductor: request.conductor,
      lastName: request.lastName || 'none'
    });

    const aiPromise = aiNameAgent.generateNames({
      ...request,
      count: 3,
      lastName: request.lastName
    }).then(names => names.map(n => ({ ...n, source: 'ai' as const })));

    const dbPromise = databaseNameAgent.fetchNames({
      ...request,
      count: 10,
      lastName: request.lastName
    }).then(names => names.map(n => ({ ...n, source: 'database' as const })));

    const [aiNames, dbNames] = await Promise.all([aiPromise, dbPromise]);

    console.log(`✅ [Orchestrator] AI Agent returned ${aiNames.length} names`);
    console.log(`✅ [Orchestrator] Database Agent returned ${dbNames.length} names`);

    const allNames: GeneratedName[] = [];
    const seenNames = new Set<string>();

    const combinedNames = shuffleArray([...dbNames, ...aiNames]);

    for (const name of combinedNames) {
      const nameLower = name.name.toLowerCase();
      if (!seenNames.has(nameLower)) {
        seenNames.add(nameLower);
        allNames.push(name);

        if (allNames.length >= TARGET_COUNT) {
          break;
        }
      }
    }

    if (allNames.length < TARGET_COUNT) {
      console.log(`⚠️ [Orchestrator] Only ${allNames.length} unique names, requesting more from AI...`);

      const extraAINames = await aiNameAgent.generateNames({
        ...request,
        count: TARGET_COUNT - allNames.length,
        lastName: request.lastName
      });

      for (const name of extraAINames) {
        const nameLower = name.name.toLowerCase();
        if (!seenNames.has(nameLower)) {
          seenNames.add(nameLower);
          allNames.push({ ...name, source: 'ai' });

          if (allNames.length >= TARGET_COUNT) {
            break;
          }
        }
      }
    }

    const finalNames = allNames.slice(0, TARGET_COUNT);

    console.log('🔗 [Orchestrator] Fetching external links for names...');
    const enrichedNames = await Promise.all(
      finalNames.map(async (name) => {
        try {
          const cleanName = name.name.replace(/\d+$/g, '').trim();
          const enrichmentResult = await enrichNameWithMultipleSources(
            cleanName,
            request.gender,
            request.religion
          );

          if (enrichmentResult.success && enrichmentResult.enrichmentData.length > 0) {
            const allLinks = enrichmentResult.enrichmentData.flatMap(
              data => data.externalLinks || []
            );
            return { ...name, externalLinks: allLinks };
          }
          return name;
        } catch (error) {
          console.error(`Error fetching links for ${name.name}:`, error);
          return name;
        }
      })
    );

    const aiCount = enrichedNames.filter(n => n.source === 'ai').length;
    const dbCount = enrichedNames.filter(n => n.source === 'database').length;

    const executionTimeMs = Date.now() - startTime;

    console.log('🎉 [Orchestrator] Generation complete!');
    console.log(`📊 [Orchestrator] Stats: ${enrichedNames.length} names (${aiCount} AI + ${dbCount} DB) in ${executionTimeMs}ms`);

    const namesWithoutSource = enrichedNames.map(({ source, ...name }) => name);

    return {
      names: namesWithoutSource,
      metadata: {
        totalGenerated: enrichedNames.length,
        aiCount,
        databaseCount: dbCount,
        executionTimeMs
      }
    };
  }
};

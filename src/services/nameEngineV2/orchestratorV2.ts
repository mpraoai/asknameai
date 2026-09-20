import { databaseNameAgent } from '../agents/databaseNameAgent';
import { streamAINames } from './generationAgent';
import { enrichNameLinks } from './enrichmentAgent';
import { persistNamesInBackground } from './persistenceAgent';
import { NameEngineV2Request, GeneratedNameV2 } from './types';

export interface GenerateNamesV2Params extends NameEngineV2Request {
  count: number;
  excludeNames: string[];
}

export interface GenerateNamesV2Callbacks {
  onName: (name: GeneratedNameV2) => void;
  onEnriched: (name: string, links: Array<{ url: string; title: string; type: string }>) => void;
  onDone: (totalReceived: number) => void;
  onError: (error: Error) => void;
}

/**
 * New, additive name-generation orchestrator: dispatches DB and AI name
 * fetches concurrently, streams every name to the UI the moment it's ready
 * (progressive reveal), then enriches + persists each name in the
 * background without blocking display. Does not touch the existing
 * src/services/agents/orchestratorService.ts pipeline at all - it only
 * calls databaseNameAgent (read-only usage) for extra volume/diversity.
 */
export function generateNamesV2(
  params: GenerateNamesV2Params,
  callbacks: GenerateNamesV2Callbacks
): { cancel: () => void } {
  const controller = new AbortController();
  let received = 0;
  let cancelled = false;

  const handleName = (name: GeneratedNameV2) => {
    if (cancelled) return;
    received++;
    callbacks.onName(name);

    enrichNameLinks(name.name, params.gender, params.religion).then((links) => {
      if (!cancelled && links.length > 0) {
        callbacks.onEnriched(name.name, links);
      }
    });
  };

  const allNames: GeneratedNameV2[] = [];
  const trackAndHandle = (name: GeneratedNameV2) => {
    allNames.push(name);
    handleName(name);
  };

  const aiCount = Math.ceil(params.count * 0.7);
  const dbCount = params.count - aiCount;

  const aiPromise = streamAINames(
    { ...params, count: aiCount },
    trackAndHandle,
    controller.signal
  ).catch((error) => {
    if (!cancelled) console.error('[NameEngineV2] AI stream error:', error);
  });

  const dbPromise = dbCount > 0
    ? databaseNameAgent
        .fetchNames({ ...params, count: dbCount })
        .then((names) => {
          names
            .filter((n) => !params.excludeNames.some((e) => e.toLowerCase() === n.name.toLowerCase()))
            .forEach((n) => trackAndHandle({ ...n, source: 'database' as const }));
        })
        .catch((error) => {
          console.error('[NameEngineV2] Database fetch error:', error);
        })
    : Promise.resolve();

  Promise.all([aiPromise, dbPromise])
    .then(() => {
      if (cancelled) return;
      persistNamesInBackground(
        params.gender,
        params.religion,
        params.driver,
        params.conductor,
        params.targetNumbers,
        allNames
      );
      callbacks.onDone(received);
    })
    .catch((error) => {
      if (!cancelled) callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    });

  return {
    cancel: () => {
      cancelled = true;
      controller.abort();
    },
  };
}

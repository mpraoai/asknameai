import { saveAIGenerationSession, saveGeneratedName } from '../aiNameGenerationService';
import { GeneratedNameV2 } from './types';

/**
 * Fire-and-forget persistence: writes generated names to the existing
 * ai_generation_sessions / ai_generated_names tables in the background,
 * never blocking or awaited by the UI.
 */
export function persistNamesInBackground(
  gender: 'male' | 'female',
  religion: string,
  driver: number,
  conductor: number,
  targetNumbers: number[],
  names: GeneratedNameV2[]
): void {
  if (names.length === 0) return;

  saveAIGenerationSession(gender, religion, driver, conductor, targetNumbers)
    .then((sessionId) => {
      if (!sessionId) return;
      names.forEach((name) => {
        saveGeneratedName(sessionId, name).catch((err) =>
          console.error('[NameEngineV2] Failed to persist name:', name.name, err)
        );
      });
    })
    .catch((err) => console.error('[NameEngineV2] Failed to create session:', err));
}

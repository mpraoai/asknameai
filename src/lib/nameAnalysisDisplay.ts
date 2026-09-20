import { NumerologyResult } from './numerology';

/**
 * Display-only helpers for the "step-by-step" name analysis breakdown
 * (matching the reference site's report page). These never make their
 * own pass/fail decision - every verdict shown here is read back out of
 * `result.isAuspicious`/`result.verdict`, which the protected
 * numerology.ts engine already computed. That keeps this file safe to
 * add/edit freely without ever risking disagreeing with the real engine.
 */

// Standard Chaldean letter values - the same static table already
// duplicated (for the same reason: display, not calculation) in
// supabase/functions/generate-names-with-ai/index.ts. Verified to match
// numerology.ts's internal totals by cross-checking real report output.
const CHALDEAN_LETTERS: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1, J: 1,
  K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2, S: 3, T: 4,
  U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7,
};

// Traditional Vedic planetary rulers for numbers 1-9 - purely descriptive labels shown next to Mulank/Bhagyank.
export const PLANET_RULERS: Record<number, string> = {
  1: 'Sun', 2: 'Moon', 3: 'Jupiter', 4: 'Rahu', 5: 'Mercury', 6: 'Venus', 7: 'Ketu', 8: 'Saturn', 9: 'Mars',
};

export interface LetterValue {
  letter: string;
  value: number;
}

export function getLetterBreakdown(name: string): LetterValue[] {
  return name
    .toUpperCase()
    .split('')
    .filter((c) => /[A-Z]/.test(c))
    .map((c) => ({ letter: c, value: CHALDEAN_LETTERS[c] || 0 }));
}

export type StepStatus = 'pass' | 'fail' | 'skipped';

export interface AnalysisStep {
  title: string;
  status: StepStatus;
  detail: string;
}

/** Rough, informational-only compound-quality note - not a gating decision, just extra context alongside the real verdict. */
function compoundNote(compound: number): string {
  const challenging = [13, 14, 16, 18, 26, 44];
  if (challenging.includes(compound)) return `Compound ${compound} is traditionally considered a challenging number in Chaldean numerology.`;
  if (compound <= 8) return `Compound ${compound} is a simple, single-digit-range number.`;
  return `Compound ${compound} is a commonly used Chaldean compound.`;
}

/**
 * Reconstructs the reference site's 4-step narrative from data the
 * engine already produced. Step 2 is the real decision (read from
 * isAuspicious/verdict); Steps 3-4 are informational context that only
 * "run" when Step 2 passed, mirroring the reference's "no need to check
 * further" behaviour once the fundamental check has already failed.
 */
export function getAnalysisSteps(result: NumerologyResult): AnalysisStep[] {
  const step1: AnalysisStep = {
    title: 'Name Number Calculation',
    status: 'pass',
    detail: `Compound ${result.fullNameValue} → Name Number: ${result.fullNameReduced}`,
  };

  const partiallyAligned = result.verdict.toLowerCase().includes('partially aligned');
  const step2Status: StepStatus = result.isAuspicious ? 'pass' : 'fail';
  const step2: AnalysisStep = {
    title: 'Friendship with Birth Numbers',
    status: step2Status,
    detail: result.isAuspicious
      ? `Name Number ${result.fullNameReduced} is friendly with Driver ${result.driver}.`
      : partiallyAligned
        ? `Name Number ${result.fullNameReduced} is only partially friendly with Driver ${result.driver} — a minor correction would fully align it.`
        : `Name Number ${result.fullNameReduced} is not friendly with Driver ${result.driver}.`,
  };

  const favorableSet = [1, 3, 5, 6];
  const isFavorable = favorableSet.includes(result.fullNameReduced);
  const step3: AnalysisStep = {
    title: 'Favorable Number Check',
    status: step2Status === 'fail' ? 'skipped' : (isFavorable ? 'pass' : 'skipped'),
    detail: step2Status === 'fail'
      ? 'Skipped — the fundamental alignment check above already failed.'
      : `Checks if the name number is 1, 3, 5, or 6 — yours is ${result.fullNameReduced}${isFavorable ? ', which is in the favorable set.' : ' (not in the favorable set).'}`,
  };

  const step4: AnalysisStep = {
    title: 'Compound Number Quality',
    status: step2Status === 'fail' ? 'skipped' : 'pass',
    detail: step2Status === 'fail'
      ? 'Skipped — the fundamental alignment check above already failed.'
      : compoundNote(result.fullNameValue),
  };

  return [step1, step2, step3, step4];
}

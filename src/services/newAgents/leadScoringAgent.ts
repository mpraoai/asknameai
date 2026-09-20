/**
 * Sales/Lead-Scoring Agent (PRD Section 3, Phase 3). Previously this was a
 * single inline ternary in CompatibilityReport.tsx (`isAuspicious ? 'hot'
 * : 'warm'`) - this pulls it out into a real, testable rules engine that
 * weighs multiple signals, matching the PRD's "decides hot/warm/cold lead"
 * description more completely. Deliberately rules-based, not LLM-based:
 * scoring needs to be instant and deterministic on every free-check
 * submission, and there's no ambiguity here an LLM would resolve better
 * than clear business rules would.
 */

export interface LeadScoringInput {
  /** A name/birth-date mismatch is the strongest buying signal - it's the exact problem this product sells the fix for. */
  isAuspicious: boolean;
  hasMobile: boolean;
  hasEmail: boolean;
  sourceType: 'free_check' | 'baby_names' | 'manual';
}

export type LeadScore = 'hot' | 'warm' | 'cold';

export function scoreLead(input: LeadScoringInput): LeadScore {
  let points = 0;

  if (!input.isAuspicious) points += 2; // has a problem this product fixes
  if (input.hasMobile && input.hasEmail) points += 2; // gave both contact channels - more serious
  else if (input.hasMobile || input.hasEmail) points += 1;
  if (input.sourceType === 'free_check') points += 1; // came in through the highest-intent funnel

  if (points >= 4) return 'hot';
  if (points >= 2) return 'warm';
  return 'cold';
}

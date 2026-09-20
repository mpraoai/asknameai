import { reduceNumber, calculateNameValue, NUMBER_MEANINGS } from './numerology';

/**
 * Mobile / Business-name / Domain-name numerology - the three Phase 2 tool
 * types the PRD calls for beyond personal names and baby names. Each one
 * reuses the existing, unmodified Chaldean engine (`calculateNameValue`,
 * `reduceNumber`, `NUMBER_MEANINGS` from ./numerology) rather than
 * reimplementing the math, exactly like NumerologyToolsPanel already does
 * for name correction and baby names - a new file, nothing in numerology.ts
 * touched.
 */

export interface DigitBreakdown {
  digit: string;
  value: number;
}

export interface ExtendedNumerologyResult {
  input: string;
  total: number;
  reduced: number;
  meaning: (typeof NUMBER_MEANINGS)[number] | undefined;
  breakdown: DigitBreakdown[];
}

/** Sums the digits of a mobile number (any punctuation/spaces stripped) and reduces to a single/master number. */
export function calculateMobileNumerology(mobileNumber: string): ExtendedNumerologyResult {
  const digits = mobileNumber.replace(/\D/g, '');
  const breakdown: DigitBreakdown[] = digits.split('').map((d) => ({ digit: d, value: Number(d) }));
  const total = breakdown.reduce((sum, b) => sum + b.value, 0);
  const reduced = reduceNumber(total, true);
  return { input: digits, total, reduced, meaning: NUMBER_MEANINGS[reduced], breakdown };
}

/** Business name numerology - same Chaldean letter values as a personal name, applied to the trading/brand name. */
export function calculateBusinessNameNumerology(businessName: string): ExtendedNumerologyResult {
  const total = calculateNameValue(businessName);
  const reduced = reduceNumber(total, true);
  const breakdown: DigitBreakdown[] = businessName
    .toUpperCase()
    .split('')
    .filter((c) => /[A-Z]/.test(c))
    .map((c) => ({ digit: c, value: calculateNameValue(c) }));
  return { input: businessName, total, reduced, meaning: NUMBER_MEANINGS[reduced], breakdown };
}

/**
 * Domain name numerology - letters use the same Chaldean values as a name;
 * digits already in the domain (e.g. "name4u") count at face value; the
 * TLD (.com/.in/etc.) is stripped since it's shared by millions of domains
 * and carries no distinguishing numerological signal.
 */
export function calculateDomainNumerology(domain: string): ExtendedNumerologyResult {
  const withoutProtocol = domain.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  const nameOnly = withoutProtocol.split('.')[0];
  const letters = nameOnly.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const breakdown: DigitBreakdown[] = letters.split('').map((c) => ({
    digit: c,
    value: /[0-9]/.test(c) ? Number(c) : calculateNameValue(c),
  }));
  const total = breakdown.reduce((sum, b) => sum + b.value, 0);
  const reduced = reduceNumber(total, true);
  return { input: nameOnly, total, reduced, meaning: NUMBER_MEANINGS[reduced], breakdown };
}

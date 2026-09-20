import { reduceNumber } from './numerology';

/**
 * Personal Year number - a standard numerology concept (birth day + birth
 * month + current year, reduced) that this app didn't have yet. New file,
 * reuses the existing `reduceNumber` export from the protected
 * numerology.ts rather than reimplementing digit-reduction.
 */
export function calculatePersonalYear(dob: string, forYear?: number): number {
  const [, month, day] = dob.split('-').map(Number);
  const year = forYear ?? new Date().getFullYear();
  const yearDigitSum = String(year).split('').reduce((sum, d) => sum + Number(d), 0);
  return reduceNumber(day + month + yearDigitSum);
}

export const PERSONAL_YEAR_MEANINGS: Record<number, string> = {
  1: 'A year of new beginnings - start what you have been putting off.',
  2: 'A year for patience, partnership, and building relationships.',
  3: 'A year for creativity, self-expression, and social connection.',
  4: 'A year for hard work, structure, and laying solid foundations.',
  5: 'A year of change, travel, and unexpected opportunity.',
  6: 'A year centered on home, family, and responsibility.',
  7: 'A year for reflection, study, and inner growth.',
  8: 'A year of ambition, achievement, and financial focus.',
  9: 'A year of completion - closing chapters before a new cycle begins.',
  11: 'A high-vibration year of insight and spiritual awareness.',
  22: 'A powerful year for turning big ideas into lasting achievement.',
};

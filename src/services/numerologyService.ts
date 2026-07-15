// Chaldean numerology system

const CHALDEAN_VALUES: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

export function getChaldeanValue(letter: string): number {
  return CHALDEAN_VALUES[letter.toUpperCase()] || 0;
}

export function reduceToSingleDigit(num: number): number {
  while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
    num = num.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  }
  return num;
}

export function calculateNameNumber(name: string): number {
  const cleanName = name.replace(/[^a-zA-Z]/g, '');
  let total = 0;
  for (const letter of cleanName) total += getChaldeanValue(letter);
  return reduceToSingleDigit(total);
}

export function calculateCompoundNumber(name: string): number {
  const cleanName = name.replace(/[^a-zA-Z]/g, '');
  let total = 0;
  for (const letter of cleanName) total += getChaldeanValue(letter);
  return total;
}

export interface NumerologyNumberInfo {
  number: number;
  planet: string;
  traits: string[];
  lucky: string[];
  caution: string[];
}

const NUMBER_INFO: Record<number, NumerologyNumberInfo> = {
  1: { number: 1, planet: 'Sun', traits: ['Leadership', 'Independence', 'Ambition'], lucky: ['Gold', 'Orange', 'Sunday'], caution: ['Avoid being overly dominant'] },
  2: { number: 2, planet: 'Moon', traits: ['Diplomacy', 'Sensitivity', 'Cooperation'], lucky: ['White', 'Silver', 'Monday'], caution: ['Avoid over-sensitivity'] },
  3: { number: 3, planet: 'Jupiter', traits: ['Creativity', 'Expression', 'Optimism'], lucky: ['Yellow', 'Purple', 'Thursday'], caution: ['Avoid scattering energy'] },
  4: { number: 4, planet: 'Rahu', traits: ['Discipline', 'Structure', 'Hard work'], lucky: ['Grey', 'Blue', 'Saturday'], caution: ['Avoid rigidity'] },
  5: { number: 5, planet: 'Mercury', traits: ['Communication', 'Versatility', 'Freedom'], lucky: ['Green', 'Light Grey', 'Wednesday'], caution: ['Avoid restlessness'] },
  6: { number: 6, planet: 'Venus', traits: ['Love', 'Harmony', 'Responsibility'], lucky: ['Pink', 'White', 'Friday'], caution: ['Avoid over-indulgence'] },
  7: { number: 7, planet: 'Ketu', traits: ['Spirituality', 'Analysis', 'Wisdom'], lucky: ['Light Blue', 'Green', 'Monday'], caution: ['Avoid isolation'] },
  8: { number: 8, planet: 'Saturn', traits: ['Authority', 'Ambition', 'Material success'], lucky: ['Dark Blue', 'Black', 'Saturday'], caution: ['Avoid pessimism'] },
  9: { number: 9, planet: 'Mars', traits: ['Energy', 'Courage', 'Determination'], lucky: ['Red', 'Crimson', 'Tuesday'], caution: ['Avoid aggression'] },
  11: { number: 11, planet: 'Master Number', traits: ['Intuition', 'Inspiration', 'Spiritual insight'], lucky: ['Silver', 'White', 'All days'], caution: ['Channel nervous energy'] },
  22: { number: 22, planet: 'Master Number', traits: ['Master Builder', 'Practical vision', 'Large-scale achievement'], lucky: ['Coral', 'Gold', 'All days'], caution: ['Stay grounded'] },
  33: { number: 33, planet: 'Master Number', traits: ['Master Teacher', 'Compassion', 'Selfless service'], lucky: ['Rose', 'Pink', 'All days'], caution: ['Avoid self-sacrifice'] },
};

export function getNumberInfo(num: number): NumerologyNumberInfo {
  return NUMBER_INFO[num] || NUMBER_INFO[reduceToSingleDigit(num)];
}

export function calculateLoShuGrid(dob: string): number[][] {
  const digits = dob.replace(/[^0-9]/g, '').split('').map(Number);
  const grid: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const loShuPositions: Record<number, [number, number]> = {
    1: [2, 1], 2: [0, 2], 3: [1, 0], 4: [2, 0], 5: [1, 1],
    6: [2, 2], 7: [1, 2], 8: [0, 0], 9: [0, 1],
  };
  for (const d of digits) {
    if (d === 0) continue;
    const [r, c] = loShuPositions[d];
    grid[r][c]++;
  }
  return grid;
}

export function calculateMulank(dob: string): number {
  const parts = dob.split(/[-\/]/);
  const day = parseInt(parts[0] || parts[2] || '1');
  return reduceToSingleDigit(day);
}

export function calculateBhagyank(dob: string): number {
  const digits = dob.replace(/[^0-9]/g, '').split('').map(Number);
  const total = digits.reduce((a, b) => a + b, 0);
  return reduceToSingleDigit(total);
}

export interface NameAnalysisResult {
  name: string;
  nameNumber: number;
  compoundNumber: number;
  planet: string;
  traits: string[];
  luckyColors: string[];
  isFavorable: boolean;
  suggestion: string;
  letterValues: { letter: string; value: number }[];
}

export function analyzeName(name: string): NameAnalysisResult {
  const cleanName = name.replace(/[^a-zA-Z ]/g, '').trim();
  const nameNumber = calculateNameNumber(cleanName);
  const compoundNumber = calculateCompoundNumber(cleanName);
  const info = getNumberInfo(nameNumber);
  const letterValues: { letter: string; value: number }[] = [];

  for (const letter of cleanName) {
    if (letter === ' ') continue;
    letterValues.push({ letter, value: getChaldeanValue(letter) });
  }

  const favorableNumbers = [1, 3, 5, 6];
  const isFavorable = favorableNumbers.includes(nameNumber);

  let suggestion = '';
  if (isFavorable) {
    suggestion = `Your name number ${nameNumber} (ruled by ${info.planet}) is favorable. It supports ${info.traits.join(', ').toLowerCase()}.`;
  } else {
    suggestion = `Your name number ${nameNumber} (ruled by ${info.planet}) may create challenges. Consider a name correction to align with numbers 1, 5, or 6 for better harmony.`;
  }

  return {
    name: cleanName, nameNumber, compoundNumber, planet: info.planet,
    traits: info.traits, luckyColors: info.lucky, isFavorable, suggestion, letterValues,
  };
}

export interface MobileAnalysisResult {
  mobileNumber: string;
  total: number;
  reducedNumber: number;
  planet: string;
  traits: string[];
  isFavorable: boolean;
  recommendation: string;
  digitCount: Record<number, number>;
  missingDigits: number[];
  repeatedDigits: number[];
}

export function analyzeMobileNumber(mobile: string, dob: string): MobileAnalysisResult {
  const digits = mobile.replace(/[^0-9]/g, '').split('').map(Number);
  const total = digits.reduce((a, b) => a + b, 0);
  const reducedNumber = reduceToSingleDigit(total);
  const info = getNumberInfo(reducedNumber);

  const digitCount: Record<number, number> = {};
  for (let i = 0; i <= 9; i++) digitCount[i] = 0;
  for (const d of digits) digitCount[d]++;

  const missingDigits: number[] = [];
  const repeatedDigits: number[] = [];
  for (let i = 0; i <= 9; i++) {
    if (digitCount[i] === 0) missingDigits.push(i);
    if (digitCount[i] > 1) repeatedDigits.push(i);
  }

  const mulank = calculateMulank(dob);
  const bhagyank = calculateBhagyank(dob);

  const friendlyNumbers: Record<number, number[]> = {
    1: [1, 2, 3, 9], 2: [1, 2, 3], 3: [1, 2, 3, 5], 4: [1, 5, 7],
    5: [1, 3, 5, 6], 6: [2, 5, 6, 9], 7: [1, 4, 7], 8: [3, 5, 6],
    9: [1, 3, 5, 6, 9],
  };
  const isFavorable = friendlyNumbers[mulank]?.includes(reducedNumber) || friendlyNumbers[bhagyank]?.includes(reducedNumber);

  let recommendation: string;
  if (isFavorable) {
    recommendation = `Your mobile number totals to ${reducedNumber} (${info.planet}), which is compatible with your Mulank ${mulank} and Bhagyank ${bhagyank}. This number supports ${info.traits.join(', ').toLowerCase()}.`;
  } else {
    recommendation = `Your mobile number totals to ${reducedNumber} (${info.planet}), which may not be fully compatible with your Mulank ${mulank} and Bhagyank ${bhagyank}. Consider a number correction to align with friendly numbers: ${(friendlyNumbers[mulank] || []).join(', ')}.`;
  }

  return {
    mobileNumber: mobile, total, reducedNumber, planet: info.planet,
    traits: info.traits, isFavorable, recommendation, digitCount, missingDigits, repeatedDigits,
  };
}

export interface BabyNameSuggestion {
  name: string;
  meaning: string;
  numerologyValue: number;
  compatibilityScore: number;
  gender: string;
}

export function generateBabyNameSuggestions(
  targetNumber: number,
  gender: 'male' | 'female' | 'unisex',
  count: number = 10
): BabyNameSuggestion[] {
  const maleNames: Record<string, string> = {
    'Aarav': 'Peaceful, calm', 'Vivaan': 'Full of life', 'Aditya': 'Sun god',
    'Arjun': 'Bright, shining', 'Rohan': 'Ascending', 'Krishna': 'Dark, attractive',
    'Ayaan': 'Gift of God', 'Reyansh': 'Ray of light', 'Sai': 'Divine',
    'Ishaan': 'Sun, ruler', 'Kabir': 'Great, powerful', 'Vihaan': 'Dawn',
    'Arnav': 'Ocean', 'Atharv': 'Wise', 'Dhruv': 'Pole star',
    'Kiaan': 'Grace of God', 'Aryan': 'Noble', 'Shaurya': 'Bravery',
    'Advik': 'Unique', 'Pranav': 'Sacred syllable Om',
  };
  const femaleNames: Record<string, string> = {
    'Aanya': 'Grace, favor', 'Diya': 'Lamp, light', 'Saanvi': 'Goddess Lakshmi',
    'Anika': 'Graceful', 'Myra': 'Favorable, admirable', 'Ira': 'Earth, Saraswati',
    'Kiara': 'Dark-haired, beautiful', 'Navya': 'New, young', 'Riya': 'Singer',
    'Aadhya': 'First power', 'Pari': 'Fairy', 'Tara': 'Star',
    'Zara': 'Princess, flower', 'Sara': 'Pure', 'Mira': 'Ocean, devotee',
    'Anaya': 'Caring, protection', 'Vera': 'Faith, true',
    'Aria': 'Melody, air', 'Nila': 'Moon, blue',
  };

  const pool = gender === 'male' ? maleNames : gender === 'female' ? femaleNames : { ...maleNames, ...femaleNames };
  const suggestions: BabyNameSuggestion[] = [];

  for (const [name, meaning] of Object.entries(pool)) {
    const num = calculateNameNumber(name);
    if (num === targetNumber) {
      suggestions.push({ name, meaning, numerologyValue: num, compatibilityScore: 90 + Math.floor(Math.random() * 10), gender });
    }
    if (suggestions.length >= count) break;
  }

  if (suggestions.length < count) {
    for (const [name, meaning] of Object.entries(pool)) {
      const num = calculateNameNumber(name);
      if (Math.abs(num - targetNumber) <= 1 && !suggestions.find(s => s.name === name)) {
        suggestions.push({ name, meaning, numerologyValue: num, compatibilityScore: 75 + Math.floor(Math.random() * 15), gender });
      }
      if (suggestions.length >= count) break;
    }
  }

  return suggestions.slice(0, count);
}

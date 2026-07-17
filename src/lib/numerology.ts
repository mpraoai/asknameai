// Chaldean Numerology Engine
// Core numerology calculation logic for AskNameAI

export interface NumerologyInput {
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  gender: 'male' | 'female' | 'other';
}

export interface NumerologyResult {
  firstName: string;
  lastName: string;
  fullName: string;
  dob: string;
  gender: string;
  driver: number;
  conductor: number;
  firstNameValue: number;
  fullNameValue: number;
  firstNameReduced: number;
  fullNameReduced: number;
  isAuspicious: boolean;
  verdict: string;
  kuaNumber: number;
  lifePathNumber: number;
  destinyNumber: number;
  soulUrgeNumber: number;
  personalityNumber: number;
  birthDayNumber: number;
}

// Chaldean letter-value mapping
const CHALDEAN_MAP: Record<string, number> = {
  A: 1, I: 1, J: 1, Y: 1, Q: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

// Driver numbers: 1-9
const DRIVER_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Reduce a number to a single digit (1-9), keeping master numbers 11, 22, 33
export function reduceNumber(num: number, keepMaster: boolean = false): number {
  if (keepMaster && (num === 11 || num === 22 || num === 33)) return num;
  while (num > 9) {
    const digits = num.toString().split('').map(Number);
    num = digits.reduce((a, b) => a + b, 0);
  }
  return num;
}

// Calculate the Chaldean value of a name
export function calculateNameValue(name: string): number {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
  let total = 0;
  for (const char of clean) {
    total += CHALDEAN_MAP[char] || 0;
  }
  return total;
}

// Driver Number: sum of all digits in the date of birth, reduced to single digit
export function calculateDriver(dob: string): number {
  const digits = dob.replace(/[^0-9]/g, '').split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  return reduceNumber(sum);
}

// Conductor Number: sum of just the day portion of DOB, reduced
export function calculateConductor(dob: string): number {
  const parts = dob.split('-');
  const day = parts[2] ? parseInt(parts[2], 10) : 0;
  return reduceNumber(day);
}

// Life Path Number: sum of all digits in DOB reduced (same as driver but keep master)
export function calculateLifePath(dob: string): number {
  const digits = dob.replace(/[^0-9]/g, '').split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  return reduceNumber(sum, true);
}

// Destiny Number: full name value reduced
export function calculateDestiny(fullName: string): number {
  return reduceNumber(calculateNameValue(fullName), true);
}

// Soul Urge Number: vowels only
export function calculateSoulUrge(name: string): number {
  const vowels = name.toUpperCase().replace(/[^AEIOU]/g, '');
  return reduceNumber(calculateNameValue(vowels), true);
}

// Personality Number: consonants only
export function calculatePersonality(name: string): number {
  const consonants = name.toUpperCase().replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/g, '');
  return reduceNumber(calculateNameValue(consonants), true);
}

// Birth Day Number: the day of birth (not reduced)
export function calculateBirthDay(dob: string): number {
  const parts = dob.split('-');
  return parts[2] ? parseInt(parts[2], 10) : 0;
}

// Kua Number (for Feng Shui / personal energy direction)
export function calculateKua(dob: string, gender: string): number {
  const year = parseInt(dob.split('-')[0], 10);
  const digits = year.toString().split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  let kua = reduceNumber(sum);
  if (gender === 'female') {
    kua = kua + 4;
    if (kua > 9) kua = kua - 9;
  }
  if (kua === 0) kua = 9;
  return kua;
}

// Determine if a name is auspicious based on Chaldean rules
export function isNameAuspicious(
  firstNameValue: number,
  fullNameValue: number,
  driver: number,
  conductor: number
): { isAuspicious: boolean; verdict: string } {
  const firstNameReduced = reduceNumber(firstNameValue);
  const fullNameReduced = reduceNumber(fullNameValue);

  // Friendly number groups (Chaldean numerology compatibility)
  const friendlyGroups: Record<number, number[]> = {
    1: [1, 2, 3, 5, 6, 9],
    2: [1, 2, 3, 5, 6, 9],
    3: [1, 2, 3, 5, 6, 8, 9],
    4: [5],
    5: [1, 2, 3, 5, 6, 8, 9],
    6: [1, 2, 3, 5, 6, 9],
    7: [5],
    8: [3, 5],
    9: [1, 2, 3, 5, 6, 9],
  };

  const driverFriends = friendlyGroups[driver] || [];
  const firstNameOk = driverFriends.includes(firstNameReduced);
  const fullNameOk = driverFriends.includes(fullNameReduced);

  if (firstNameOk && fullNameOk) {
    return {
      isAuspicious: true,
      verdict: `Your name is perfectly aligned with your Driver ${driver} / Conductor ${conductor}. Your name brings success, harmony, and positive energy.`,
    };
  } else if (firstNameOk || fullNameOk) {
    return {
      isAuspicious: false,
      verdict: `Your name is partially aligned. Consider a minor spelling correction to fully harmonize with your Driver ${driver} / Conductor ${conductor}.`,
    };
  } else {
    return {
      isAuspicious: false,
      verdict: `Your current name reduces to ${fullNameReduced}, which is not aligned with your Driver ${driver} / Conductor ${conductor}. A corrected spelling is recommended.`,
    };
  }
}

// Main calculation function
export function calculateNumerology(input: NumerologyInput): NumerologyResult {
  const fullName = `${input.firstName} ${input.lastName}`;
  const firstNameValue = calculateNameValue(input.firstName);
  const fullNameValue = calculateNameValue(fullName);
  const firstNameReduced = reduceNumber(firstNameValue);
  const fullNameReduced = reduceNumber(fullNameValue);
  const driver = calculateDriver(input.dob);
  const conductor = calculateConductor(input.dob);
  const { isAuspicious, verdict } = isNameAuspicious(
    firstNameValue,
    fullNameValue,
    driver,
    conductor
  );

  return {
    firstName: input.firstName,
    lastName: input.lastName,
    fullName,
    dob: input.dob,
    gender: input.gender,
    driver,
    conductor,
    firstNameValue,
    fullNameValue,
    firstNameReduced,
    fullNameReduced,
    isAuspicious,
    verdict,
    kuaNumber: calculateKua(input.dob, input.gender),
    lifePathNumber: calculateLifePath(input.dob),
    destinyNumber: calculateDestiny(fullName),
    soulUrgeNumber: calculateSoulUrge(fullName),
    personalityNumber: calculatePersonality(fullName),
    birthDayNumber: calculateBirthDay(input.dob),
  };
}

// Number meanings for display
export const NUMBER_MEANINGS: Record<number, { title: string; traits: string[]; description: string }> = {
  1: {
    title: 'The Leader',
    traits: ['Independent', 'Ambitious', 'Pioneering', 'Confident'],
    description: 'Number 1 represents leadership, individuality, and new beginnings. You have a strong drive to succeed and pioneer new paths.',
  },
  2: {
    title: 'The Diplomat',
    traits: ['Cooperative', 'Sensitive', 'Harmonious', 'Patient'],
    description: 'Number 2 represents partnership, balance, and diplomacy. You excel in cooperation and creating harmony around you.',
  },
  3: {
    title: 'The Communicator',
    traits: ['Creative', 'Expressive', 'Optimistic', 'Social'],
    description: 'Number 3 represents creativity, self-expression, and joy. You are naturally artistic and communicative.',
  },
  4: {
    title: 'The Builder',
    traits: ['Practical', 'Disciplined', 'Reliable', 'Hardworking'],
    name: 'The Builder',
    description: 'Number 4 represents stability, structure, and hard work. You are the foundation-builder of society.',
  } as any,
  5: {
    title: 'The Freedom Seeker',
    traits: ['Adventurous', 'Versatile', 'Dynamic', 'Curious'],
    description: 'Number 5 represents freedom, change, and adventure. You thrive on variety and new experiences.',
  },
  6: {
    title: 'The Nurturer',
    traits: ['Caring', 'Responsible', 'Loving', 'Healing'],
    description: 'Number 6 represents love, family, and responsibility. You are the caretaker who brings harmony to relationships.',
  },
  7: {
    title: 'The Seeker',
    traits: ['Analytical', 'Spiritual', 'Intuitive', 'Wise'],
    description: 'Number 7 represents wisdom, spirituality, and introspection. You are the seeker of truth and deeper meaning.',
  },
  8: {
    title: 'The Powerhouse',
    traits: ['Ambitious', 'Authoritative', 'Business-minded', 'Successful'],
    description: 'Number 8 represents power, material success, and authority. You are destined for achievement in the material world.',
  },
  9: {
    title: 'The Humanitarian',
    traits: ['Compassionate', 'Idealistic', 'Generous', 'Selfless'],
    description: 'Number 9 represents completion, compassion, and universal love. You are the humanitarian who serves others.',
  },
  11: {
    title: 'The Master Intuitive',
    traits: ['Visionary', 'Inspirational', 'Sensitive', 'Spiritual'],
    description: 'Master Number 11 represents intuition, spiritual insight, and inspiration. You are a beacon of light for others.',
  },
  22: {
    title: 'The Master Builder',
    traits: ['Visionary Builder', 'Practical Idealist', 'Powerful', 'Manifestor'],
    description: 'Master Number 22 represents the master builder who can turn dreams into reality on a large scale.',
  },
  33: {
    name: 'The Master Teacher',
    title: 'The Master Teacher',
    traits: ['Compassionate Teacher', 'Healer', 'Uplifting', 'Selfless'],
    description: 'Master Number 33 represents the master teacher of unconditional love and healing.',
  } as any,
};

// Generate name suggestions based on driver number
export function generateNameSuggestions(
  firstName: string,
  lastName: string,
  driver: number,
  count: number = 10
): { name: string; value: number; reduced: number; compatible: boolean }[] {
  const friendlyGroups: Record<number, number[]> = {
    1: [1, 2, 3, 5, 6, 9],
    2: [1, 2, 3, 5, 6, 9],
    3: [1, 2, 3, 5, 6, 8, 9],
    4: [5],
    5: [1, 2, 3, 5, 6, 8, 9],
    6: [1, 2, 3, 5, 6, 9],
    7: [5],
    8: [3, 5],
    9: [1, 2, 3, 5, 6, 9],
  };

  const targetNumbers = friendlyGroups[driver] || [1, 5, 6];
  const suggestions: { name: string; value: number; reduced: number; compatible: boolean }[] = [];

  // Generate spelling variations of the first name
  const base = firstName.toUpperCase();
  const variations: string[] = [];

  // Double letter variations
  for (let i = 0; i < base.length; i++) {
    variations.push(base.slice(0, i + 1) + base[i] + base.slice(i + 1));
  }
  // Add/remove silent letters
  const silentAdd: Record<string, string> = {
    A: 'AA', E: 'EE', I: 'II', O: 'OO', U: 'UU',
    K: 'KK', S: 'SS', T: 'TT', M: 'MM', N: 'NN', L: 'LL', R: 'RR',
  };
  for (let i = 0; i < base.length; i++) {
    if (silentAdd[base[i]]) {
      variations.push(base.slice(0, i) + silentAdd[base[i]] + base.slice(i + 1));
    }
  }
  // Vowel swaps
  const vowelSwaps: Record<string, string[]> = {
    A: ['E', 'I', 'O', 'U'],
    E: ['A', 'I', 'O', 'U'],
    I: ['A', 'E', 'O', 'U'],
    O: ['A', 'E', 'I', 'U'],
    U: ['A', 'E', 'I', 'O'],
  };
  for (let i = 0; i < base.length; i++) {
    if (vowelSwaps[base[i]]) {
      for (const swap of vowelSwaps[base[i]]) {
        variations.push(base.slice(0, i) + swap + base.slice(i + 1));
      }
    }
  }

  const seen = new Set<string>();
  for (const v of variations) {
    if (seen.has(v) || v === base) continue;
    seen.add(v);
    const val = calculateNameValue(v + ' ' + lastName.toUpperCase());
    const reduced = reduceNumber(val);
    const compatible = targetNumbers.includes(reduced);
    if (compatible) {
      suggestions.push({
        name: v.charAt(0) + v.slice(1).toLowerCase(),
        value: val,
        reduced,
        compatible: true,
      });
    }
    if (suggestions.length >= count) break;
  }

  return suggestions.slice(0, count);
}

import { supabase } from '../../lib/supabase';
import { filterNamesByLastName } from '../../utils/lastNameValidation';

interface DatabaseQueryParams {
  gender: 'male' | 'female';
  religion: string;
  driver: number;
  conductor: number;
  targetNumbers: number[];
  count?: number;
  lastName?: string;
}

interface DatabaseName {
  name: string;
  meaning: string;
  numerologyValue: number;
  compoundNumber: number;
  compatibilityScore: number;
  explanation: string;
}

const CHALDEAN_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1, J: 1,
  K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2, S: 3, T: 4,
  U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7
};

const calculateNameValue = (name: string): number => {
  if (!name || typeof name !== 'string') return 0;
  return name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .reduce((sum, letter) => sum + (CHALDEAN_VALUES[letter] || 0), 0);
};

const reduceToSingleDigit = (num: number): number => {
  while (num > 9) {
    num = Math.floor(num / 10) + (num % 10);
  }
  return num;
};

const getAntiNumbers = (number: number): number[] => {
  const antiPairs: Record<number, number[]> = {
    1: [8], 2: [4, 9], 3: [6], 4: [2, 9], 5: [],
    6: [3], 7: [], 8: [1], 9: [2, 4]
  };
  return antiPairs[number] || [];
};

const getNumerologyDescription = (value: number, driver: number, conductor: number): string => {
  const descriptions: Record<number, string> = {
    1: "symbolizing new beginnings, leadership, and independence",
    3: "representing creativity, expression, and joyful energy",
    5: "reflecting freedom, adventure, and dynamic change",
    6: "embodying harmony, nurturing, and responsibility"
  };

  const baseDesc = descriptions[value] || "carrying auspicious energy";

  if (value === driver) {
    return `This name carries numerology value ${value}, ${baseDesc}, perfectly aligned with the Life Purpose ${driver}.`;
  } else if (value === conductor) {
    return `This name resonates with numerology value ${value}, ${baseDesc}, harmonizing beautifully with the Destiny ${conductor}.`;
  } else {
    return `This name embodies numerology value ${value}, ${baseDesc}, bringing favorable vibrations to the child's numerological profile.`;
  }
};

const buildExplanation = (
  name: string,
  meaning: string,
  religion: string,
  numerologyValue: number,
  driver: number,
  conductor: number
): string => {
  const meaningText = meaning || 'a name of significance';
  const numerologyDesc = getNumerologyDescription(numerologyValue, driver, conductor);

  const religionLower = religion.toLowerCase();
  const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  let templates: string[] = [];

  if (religionLower === 'hindu') {
    templates = [
      `${name} means '${meaningText}' in Sanskrit tradition, embodying a virtue celebrated in Hindu philosophy. This name appears in ancient texts and spiritual literature, carried by sages and deities who exemplified its meaning. Parents choosing ${name} connect their child to spiritual heritage that resonates with dharmic values. ${numerologyDesc}`,

      `In Hindu tradition, ${name} signifies '${meaningText}', representing a quality revered in Vedic culture. The name has adorned heroes of the epics and spiritual teachers throughout Indian history. Families selecting ${name} honor these traditions, bestowing a designation rich with mythological significance. ${numerologyDesc}`,

      `The name ${name}, meaning '${meaningText}', holds deep resonance in Hindu communities. Found in classical literature from ancient scriptures, this name embodies ideals that parents hope to nurture. ${name} represents a connection to timeless wisdom and spiritual values. ${numerologyDesc}`
    ];
  } else if (religionLower === 'muslim') {
    templates = [
      `${name} translates to '${meaningText}' in Arabic tradition, embodying a quality deeply admired in Islamic culture. The name bears witness to virtues exemplified by historical figures who carried this designation with honor. Parents selecting ${name} aspire to see these noble traits flourish in their child. ${numerologyDesc}`,

      `In Muslim tradition, ${name} means '${meaningText}', representing an attribute celebrated throughout Islamic history. This name has graced scholars and spiritual guides across centuries. Families choosing ${name} honor this legacy, selecting a name that carries both beauty and character. ${numerologyDesc}`,

      `The name ${name}, signifying '${meaningText}', holds special resonance in Muslim communities worldwide. Its melodious sound is matched by profound meaning, reflecting qualities parents hope to instill from birth. ${name} represents values central to Islamic heritage. ${numerologyDesc}`
    ];
  } else if (religionLower === 'christian') {
    templates = [
      `${name} means '${meaningText}', embodying a virtue cherished in Christian tradition. The name may appear in Biblical narratives or reflect qualities praised in scripture, connecting the bearer to centuries of faith. Parents selecting ${name} choose a name that carries spiritual significance. ${numerologyDesc}`,

      `In Christian tradition, ${name} signifies '${meaningText}', representing an attribute valued throughout the faith's history. This name has been borne by saints and faithful servants who exemplified its meaning. Families choosing ${name} honor this legacy. ${numerologyDesc}`,

      `The name ${name}, meaning '${meaningText}', holds special significance in Christian communities. Found in Biblical texts or church history, this name embodies ideals that align with teachings of faith, hope, and love. ${numerologyDesc}`
    ];
  } else if (religionLower === 'sikh') {
    templates = [
      `${name} translates to '${meaningText}', embodying a quality valued in Sikh philosophy. The name reflects virtues taught in the Guru Granth Sahib, emphasizing courage and devotion. Parents choosing ${name} connect their child to Sikh heritage and spiritual strength. ${numerologyDesc}`,

      `In Sikh tradition, ${name} means '${meaningText}', representing an attribute celebrated in the community. This name carries associations with the warrior-saint ideal, embodying both spiritual devotion and worldly courage. Families selecting ${name} honor Sikh values. ${numerologyDesc}`,

      `The name ${name}, signifying '${meaningText}', holds special resonance in Sikh communities. It embodies qualities that align with Sikh principles of truth, compassion, and fearlessness. ${name} represents a connection to Punjabi culture and spiritual heritage. ${numerologyDesc}`
    ];
  } else {
    templates = [
      `${name} means '${meaningText}', embodying a quality admired across cultures. The name carries timeless appeal, reflecting virtues that parents hope to see flourish in their child. ${name} represents a thoughtful choice that honors heritage while celebrating individual potential. ${numerologyDesc}`,

      `The name ${name} signifies '${meaningText}', representing an attribute valued universally. This designation has been chosen by families across different cultures, each finding resonance in its meaning. ${name} carries both significance and beauty. ${numerologyDesc}`
    ];
  }

  return templates[nameHash % templates.length];
};

const calculateCompatibilityScore = (
  numerologyValue: number,
  driver: number,
  conductor: number,
  targetNumbers: number[]
): number => {
  let score = 70;

  if (numerologyValue === driver) score += 15;
  if (numerologyValue === conductor) score += 15;
  if (targetNumbers.includes(numerologyValue)) score += 10;

  return Math.min(100, score);
};

export const databaseNameAgent = {
  async fetchNames(params: DatabaseQueryParams): Promise<DatabaseName[]> {
    const { gender, religion, driver, conductor, targetNumbers, count = 6, lastName } = params;

    console.log('[DatabaseAgent] Starting query...', { gender, religion, count, lastName: lastName || 'none' });

    const FAVORABLE_NUMBERS = [1, 3, 5, 6];
    const antiToDriver = getAntiNumbers(driver);
    const antiToConductor = getAntiNumbers(conductor);
    const allAntiNumbers = [...new Set([...antiToDriver, ...antiToConductor])];

    const allowedNumbers = FAVORABLE_NUMBERS.filter(
      num => !allAntiNumbers.includes(num)
    );

    console.log('[DatabaseAgent] Allowed numerology values:', allowedNumbers);

    if (allowedNumbers.length === 0) {
      console.warn('[DatabaseAgent] No allowed numbers available!');
      return [];
    }

    let query = supabase
      .from('baby_names')
      .select('name, meaning, origin, compound_number, numerology_value')
      .eq('gender', gender)
      .ilike('religion', `%${religion}%`)
      .in('numerology_value', allowedNumbers)
      .order('popularity_score', { ascending: false })
      .limit(count * 5);

    const { data, error } = await query;

    if (error) {
      console.error('[DatabaseAgent] Query error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('[DatabaseAgent] No names found in database');
      return [];
    }

    console.log(`[DatabaseAgent] Found ${data.length} names, filtering...`);

    let results: DatabaseName[] = data
      .map(dbName => {
        const compoundNumber = dbName.compound_number || calculateNameValue(dbName.name);
        const numerologyValue = dbName.numerology_value || reduceToSingleDigit(compoundNumber);

        return {
          name: dbName.name,
          meaning: dbName.meaning || 'A meaningful name',
          numerologyValue,
          compoundNumber,
          compatibilityScore: calculateCompatibilityScore(
            numerologyValue,
            driver,
            conductor,
            targetNumbers
          ),
          explanation: buildExplanation(
            dbName.name,
            dbName.meaning || '',
            religion,
            numerologyValue,
            driver,
            conductor
          )
        };
      })
      .filter(name => {
        if (!FAVORABLE_NUMBERS.includes(name.numerologyValue)) return false;
        if (antiToDriver.includes(name.numerologyValue)) return false;
        if (antiToConductor.includes(name.numerologyValue)) return false;
        return true;
      });

    if (lastName) {
      console.log(`[DatabaseAgent] Applying last name filter for: ${lastName}`);
      const beforeCount = results.length;
      results = filterNamesByLastName(results, lastName);
      console.log(`[DatabaseAgent] Filtered from ${beforeCount} to ${results.length} names with valid last name combinations`);
    }

    results = results.slice(0, count);

    console.log(`[DatabaseAgent] Returning ${results.length} validated names`);

    return results;
  }
};

import { BabyNameSuggestion } from '../types/numerology';
import { calculateNameValue, reduceToSingleDigit } from './chaldeanValues';
import { fetchCompatibleNames, BabyNameData } from '../services/babyNameService';
import { isCompatibleWithDriverConductor } from './compatibility';
import { calculateCombinedName } from './lastNameValidation';

const BABY_NAMES = {
  hindu: {
    male: [
      { name: 'Aarav', meaning: 'Peaceful, wise' },
      { name: 'Arjun', meaning: 'Bright, shining' },
      { name: 'Dev', meaning: 'God, divine' },
      { name: 'Karan', meaning: 'Helper, compassionate' },
      { name: 'Raj', meaning: 'King, rule' },
      { name: 'Rohan', meaning: 'Ascending, growing' },
      { name: 'Sai', meaning: 'Divine master' },
      { name: 'Vedant', meaning: 'Ultimate knowledge' },
      { name: 'Yash', meaning: 'Fame, glory' },
      { name: 'Neil', meaning: 'Blue sapphire' },
      { name: 'Aditya', meaning: 'Sun god' },
      { name: 'Akash', meaning: 'Sky, space' },
      { name: 'Ankit', meaning: 'Marked, distinguished' },
      { name: 'Deepak', meaning: 'Light, lamp' },
      { name: 'Gaurav', meaning: 'Pride, honor' },
      { name: 'Harsh', meaning: 'Joy, happiness' },
      { name: 'Ishaan', meaning: 'Sun, lord Shiva' },
      { name: 'Kartik', meaning: 'Name of a month' },
      { name: 'Manish', meaning: 'God of mind' },
      { name: 'Nikhil', meaning: 'Complete, whole' },
      { name: 'Pranav', meaning: 'Sacred syllable Om' },
      { name: 'Rahul', meaning: 'Conqueror of miseries' },
      { name: 'Shivam', meaning: 'Auspicious, lord Shiva' },
      { name: 'Varun', meaning: 'God of water' },
      { name: 'Vivek', meaning: 'Wisdom, knowledge' }
    ],
    female: [
      { name: 'Aadhya', meaning: 'Beginning, first' },
      { name: 'Anaya', meaning: 'Caring, guardian' },
      { name: 'Diya', meaning: 'Lamp, light' },
      { name: 'Isha', meaning: 'Goddess, supreme' },
      { name: 'Kavya', meaning: 'Poetry, literature' },
      { name: 'Maya', meaning: 'Illusion, divine power' },
      { name: 'Priya', meaning: 'Beloved, dear' },
      { name: 'Riya', meaning: 'Singer, graceful' },
      { name: 'Siya', meaning: 'Sita, pure' },
      { name: 'Zara', meaning: 'Princess, flower' },
      { name: 'Aditi', meaning: 'Boundless, entire' },
      { name: 'Anjali', meaning: 'Offering, tribute' },
      { name: 'Deepika', meaning: 'Little lamp' },
      { name: 'Gauri', meaning: 'Fair, goddess Parvati' },
      { name: 'Jyoti', meaning: 'Light, flame' },
      { name: 'Kiran', meaning: 'Ray of light' },
      { name: 'Meera', meaning: 'Devotee of Krishna' },
      { name: 'Nisha', meaning: 'Night' },
      { name: 'Pooja', meaning: 'Worship, prayer' },
      { name: 'Radha', meaning: 'Success, prosperity' },
      { name: 'Shreya', meaning: 'Auspicious, beautiful' },
      { name: 'Tara', meaning: 'Star' },
      { name: 'Uma', meaning: 'Goddess Parvati' },
      { name: 'Vidya', meaning: 'Knowledge, learning' }
    ]
  },
  muslim: {
    male: [
      { name: 'Ahmed', meaning: 'Praiseworthy' },
      { name: 'Ali', meaning: 'High, elevated' },
      { name: 'Arif', meaning: 'Knowledgeable' },
      { name: 'Faisal', meaning: 'Judge, decisive' },
      { name: 'Hassan', meaning: 'Handsome, good' },
      { name: 'Ibrahim', meaning: 'Father of nations' },
      { name: 'Khalil', meaning: 'Friend' },
      { name: 'Omar', meaning: 'Long-lived' },
      { name: 'Saad', meaning: 'Happiness' },
      { name: 'Zain', meaning: 'Beauty, grace' },
      { name: 'Abdullah', meaning: 'Servant of Allah' },
      { name: 'Bilal', meaning: 'Water, refreshing' },
      { name: 'Danish', meaning: 'Knowledge, wisdom' },
      { name: 'Farhan', meaning: 'Happy, joyful' },
      { name: 'Hamza', meaning: 'Strong, steadfast' },
      { name: 'Imran', meaning: 'Prosperity' },
      { name: 'Junaid', meaning: 'Warrior' },
      { name: 'Kamran', meaning: 'Successful' },
      { name: 'Luqman', meaning: 'Prophet name' },
      { name: 'Mustafa', meaning: 'Chosen one' },
      { name: 'Nasir', meaning: 'Helper, supporter' },
      { name: 'Qasim', meaning: 'Distributor' },
      { name: 'Rashid', meaning: 'Rightly guided' },
      { name: 'Tariq', meaning: 'Morning star' },
      { name: 'Usman', meaning: 'Baby bustard' }
    ],
    female: [
      { name: 'Aisha', meaning: 'Living, alive' },
      { name: 'Aliya', meaning: 'High, elevated' },
      { name: 'Farah', meaning: 'Joy, happiness' },
      { name: 'Hiba', meaning: 'Gift' },
      { name: 'Layla', meaning: 'Night beauty' },
      { name: 'Maryam', meaning: 'Beloved' },
      { name: 'Noor', meaning: 'Light' },
      { name: 'Sarah', meaning: 'Princess' },
      { name: 'Yasmin', meaning: 'Jasmine flower' },
      { name: 'Zara', meaning: 'Blooming flower' },
      { name: 'Amina', meaning: 'Trustworthy' },
      { name: 'Bushra', meaning: 'Good news' },
      { name: 'Dua', meaning: 'Prayer' },
      { name: 'Fatima', meaning: 'Captivating' },
      { name: 'Hafsa', meaning: 'Young lioness' },
      { name: 'Iman', meaning: 'Faith' },
      { name: 'Khadija', meaning: 'Premature child' },
      { name: 'Lubna', meaning: 'Kind of tree' },
      { name: 'Mariam', meaning: 'Wished for child' },
      { name: 'Nawal', meaning: 'Gift' },
      { name: 'Qurat', meaning: 'Comfort of eyes' },
      { name: 'Rabia', meaning: 'Spring' },
      { name: 'Sana', meaning: 'Brilliance' },
      { name: 'Zainab', meaning: 'Fragrant flower' }
    ]
  },
  christian: {
    male: [
      { name: 'Aaron', meaning: 'Teacher, lofty' },
      { name: 'David', meaning: 'Beloved' },
      { name: 'Daniel', meaning: 'God is my judge' },
      { name: 'Ethan', meaning: 'Strong, firm' },
      { name: 'Isaac', meaning: 'Laughter' },
      { name: 'Jacob', meaning: 'Supplanter' },
      { name: 'John', meaning: 'God is gracious' },
      { name: 'Michael', meaning: 'Who is like God' },
      { name: 'Samuel', meaning: 'Heard by God' },
      { name: 'Timothy', meaning: 'Honoring God' },
      { name: 'Andrew', meaning: 'Manly' },
      { name: 'Benjamin', meaning: 'Son of right hand' },
      { name: 'Christopher', meaning: 'Bearer of Christ' },
      { name: 'Emmanuel', meaning: 'God with us' },
      { name: 'Gabriel', meaning: 'God is my strength' },
      { name: 'Joshua', meaning: 'God is salvation' },
      { name: 'Matthew', meaning: 'Gift of God' },
      { name: 'Nathan', meaning: 'Gift from God' },
      { name: 'Peter', meaning: 'Rock, stone' },
      { name: 'Stephen', meaning: 'Crown' },
      { name: 'Thomas', meaning: 'Twin' },
      { name: 'William', meaning: 'Resolute protector' },
      { name: 'Alexander', meaning: 'Defender of men' },
      { name: 'Jonathan', meaning: 'God has given' },
      { name: 'Nicholas', meaning: 'Victory of people' }
    ],
    female: [
      { name: 'Anna', meaning: 'Grace, favor' },
      { name: 'Deborah', meaning: 'Bee' },
      { name: 'Elizabeth', meaning: 'God is my oath' },
      { name: 'Grace', meaning: 'Divine favor' },
      { name: 'Hannah', meaning: 'Favor, grace' },
      { name: 'Joy', meaning: 'Happiness' },
      { name: 'Mary', meaning: 'Beloved' },
      { name: 'Naomi', meaning: 'Pleasant' },
      { name: 'Ruth', meaning: 'Companion' },
      { name: 'Sarah', meaning: 'Princess' },
      { name: 'Abigail', meaning: 'Father rejoiced' },
      { name: 'Catherine', meaning: 'Pure' },
      { name: 'Diana', meaning: 'Divine' },
      { name: 'Esther', meaning: 'Star' },
      { name: 'Faith', meaning: 'Trust, belief' },
      { name: 'Hope', meaning: 'Expectation' },
      { name: 'Julia', meaning: 'Youthful' },
      { name: 'Katherine', meaning: 'Pure' },
      { name: 'Lydia', meaning: 'From Lydia' },
      { name: 'Martha', meaning: 'Lady' },
      { name: 'Priscilla', meaning: 'Ancient' },
      { name: 'Rebecca', meaning: 'To bind' },
      { name: 'Susanna', meaning: 'Lily' },
      { name: 'Victoria', meaning: 'Victory' }
    ]
  },
  sikh: {
    male: [
      { name: 'Arman', meaning: 'Desire, hope' },
      { name: 'Gurpreet', meaning: 'Love of guru' },
      { name: 'Harpreet', meaning: 'Love of God' },
      { name: 'Jasdeep', meaning: 'Glory lamp' },
      { name: 'Karan', meaning: 'Helper' },
      { name: 'Manpreet', meaning: 'Love of mind' },
      { name: 'Navdeep', meaning: 'New light' },
      { name: 'Rajveer', meaning: 'Brave king' },
      { name: 'Simran', meaning: 'Remembrance' },
      { name: 'Tejpal', meaning: 'Protector of light' },
      { name: 'Amardeep', meaning: 'Eternal light' },
      { name: 'Balpreet', meaning: 'Love of strength' },
      { name: 'Daljeet', meaning: 'Victory of army' },
      { name: 'Gurbir', meaning: 'Brave guru' },
      { name: 'Harjeet', meaning: 'Victory of God' },
      { name: 'Jasbir', meaning: 'Brave in glory' },
      { name: 'Kuldeep', meaning: 'Light of family' },
      { name: 'Lovepreet', meaning: 'Love of love' },
      { name: 'Manveer', meaning: 'Brave mind' },
      { name: 'Parmeet', meaning: 'Friend of supreme' },
      { name: 'Ranjeet', meaning: 'Victory in battle' },
      { name: 'Sukhdeep', meaning: 'Light of peace' },
      { name: 'Taranjeet', meaning: 'Victory of star' },
      { name: 'Varinder', meaning: 'Ocean lord' }
    ],
    female: [
      { name: 'Amrit', meaning: 'Nectar, immortal' },
      { name: 'Gurleen', meaning: 'Absorbed in guru' },
      { name: 'Harleen', meaning: 'Absorbed in God' },
      { name: 'Jaspreet', meaning: 'Love of glory' },
      { name: 'Kirpal', meaning: 'Compassionate' },
      { name: 'Manpreet', meaning: 'Love of mind' },
      { name: 'Navleen', meaning: 'New absorption' },
      { name: 'Rajveer', meaning: 'Brave princess' },
      { name: 'Simran', meaning: 'Remembrance' },
      { name: 'Tejpal', meaning: 'Protector of light' },
      { name: 'Amarleen', meaning: 'Absorbed in eternal' },
      { name: 'Balpreet', meaning: 'Love of strength' },
      { name: 'Daljeet', meaning: 'Victory of army' },
      { name: 'Gurleen', meaning: 'Absorbed in guru' },
      { name: 'Harjeet', meaning: 'Victory of God' },
      { name: 'Jasbir', meaning: 'Brave in glory' },
      { name: 'Kuldeep', meaning: 'Light of family' },
      { name: 'Loveleen', meaning: 'Absorbed in love' },
      { name: 'Manveer', meaning: 'Brave mind' },
      { name: 'Parmeet', meaning: 'Friend of supreme' },
      { name: 'Ranjeet', meaning: 'Victory in battle' },
      { name: 'Sukhleen', meaning: 'Absorbed in peace' },
      { name: 'Taranjeet', meaning: 'Victory of star' },
      { name: 'Varinder', meaning: 'Ocean lord' }
    ]
  }
};

const generateNameExplanation = (dbName: BabyNameData, numerologyValue: number): string => {
  const parts: string[] = [];

  if (dbName.detailed_meaning) {
    parts.push(dbName.detailed_meaning);
  } else if (dbName.meaning) {
    parts.push(dbName.meaning);
  }

  if (dbName.etymology) {
    parts.push(dbName.etymology);
  }

  if (dbName.deity_association) {
    parts.push(`Associated with ${dbName.deity_association}.`);
  }

  if (dbName.source_scripture) {
    parts.push(`Referenced in ${dbName.source_scripture}.`);
  }

  const numerologyTraits: { [key: number]: string } = {
    1: 'This name embodies numerology value 1, symbolizing new beginnings, leadership, and independence, bringing favorable vibrations to the child\'s numerological profile.',
    2: 'This name embodies numerology value 2, reflecting cooperation, diplomacy, and harmony, bringing favorable vibrations to the child\'s numerological profile.',
    3: 'This name embodies numerology value 3, reflecting creativity, expression, and optimism, bringing favorable vibrations to the child\'s numerological profile.',
    4: 'This name embodies numerology value 4, symbolizing stability, hard work, and practicality, bringing favorable vibrations to the child\'s numerological profile.',
    5: 'This name embodies numerology value 5, reflecting freedom, adventure, and dynamic change, bringing favorable vibrations to the child\'s numerological profile.',
    6: 'This name embodies numerology value 6, symbolizing responsibility, nurturing, and balance, bringing favorable vibrations to the child\'s numerological profile.',
    7: 'This name embodies numerology value 7, reflecting wisdom, spirituality, and deep analysis, bringing favorable vibrations to the child\'s numerological profile.',
    8: 'This name embodies numerology value 8, symbolizing ambition, success, and material abundance, bringing favorable vibrations to the child\'s numerological profile.',
    9: 'This name embodies numerology value 9, reflecting compassion, humanitarianism, and completion, bringing favorable vibrations to the child\'s numerological profile.'
  };

  if (numerologyTraits[numerologyValue]) {
    parts.push(numerologyTraits[numerologyValue]);
  }

  return parts.length > 0 ? parts.join(' - ') : `A beautiful name with numerology value ${numerologyValue}.`;
};

export const generateBabyNameSuggestions = async (
  gender: 'male' | 'female',
  religion: string,
  driver: number,
  conductor: number,
  loshuGrid: number[][],
  providedFirstName?: string,
  providedLastName?: string
): Promise<BabyNameSuggestion[]> => {
  const religionKey = religion.toLowerCase() as keyof typeof BABY_NAMES;

  let nameDataList: Array<{ name: string; meaning: string; explanation?: string }>;

  const targetNumbers = determineTargetNumbers(driver, conductor, loshuGrid, providedFirstName, providedLastName);

  try {
    const dbNames = await fetchCompatibleNames(gender, religion, driver, conductor, targetNumbers, providedLastName);

    if (dbNames.length > 0) {
      nameDataList = dbNames.map(n => ({
        name: n.name,
        meaning: n.meaning,
        explanation: generateNameExplanation(n, n.numerology_value || 0)
      }));
    } else {
      nameDataList = BABY_NAMES[religionKey]?.[gender] || BABY_NAMES.hindu[gender];
    }
  } catch (error) {
    console.error('Database fetch failed, using static names:', error);
    nameDataList = BABY_NAMES[religionKey]?.[gender] || BABY_NAMES.hindu[gender];
  }

  const suggestions: BabyNameSuggestion[] = [];
  const seenBaseNames = new Set<string>();

  nameDataList.forEach(nameData => {
    const baseName = nameData.name.replace(/\d+$/g, '').toLowerCase().trim();

    if (seenBaseNames.has(baseName)) {
      return;
    }

    const cleanName = nameData.name.replace(/\d+$/g, '').trim();
    const firstNameTotal = calculateNameValue(cleanName);
    const firstNameReduced = reduceToSingleDigit(firstNameTotal);

    let numerologyValue = firstNameReduced;
    let combinedInfo: {
      firstNameTotal: number;
      lastNameTotal?: number;
      combinedTotal?: number;
      combinedReduced?: number;
      compatibilityPercentage?: number;
    } = {
      firstNameTotal
    };

    if (providedLastName && providedLastName.trim()) {
      const combined = calculateCombinedName(cleanName, providedLastName);
      if (!combined.isValid) {
        return;
      }
      numerologyValue = combined.combinedReduced;
      combinedInfo = {
        firstNameTotal: combined.firstNameTotal,
        lastNameTotal: combined.lastNameTotal,
        combinedTotal: combined.combinedTotal,
        combinedReduced: combined.combinedReduced,
        compatibilityPercentage: combined.compatibilityPercentage
      };
    }

    if (!isCompatibleWithDriverConductor(numerologyValue, driver, conductor)) {
      return;
    }

    let compatibility = 'Good';

    if (targetNumbers.includes(numerologyValue)) {
      compatibility = 'Perfect Match';
    } else if (numerologyValue === driver || numerologyValue === conductor) {
      compatibility = 'Driver/Conductor Match';
    } else if ([1, 3, 5, 6].includes(numerologyValue)) {
      compatibility = 'Highly Favorable';
    }

    seenBaseNames.add(baseName);
    suggestions.push({
      name: nameData.name,
      numerologyValue,
      meaning: nameData.meaning,
      explanation: nameData.explanation,
      compatibility,
      ...combinedInfo
    });
  });

  const sorted = suggestions.sort((a, b) => {
    const compatibilityOrder = ['Perfect Match', 'Driver/Conductor Match', 'Highly Favorable', 'Good'];
    const aIndex = compatibilityOrder.indexOf(a.compatibility);
    const bIndex = compatibilityOrder.indexOf(b.compatibility);
    return aIndex - bIndex;
  });

  if (sorted.length === 0 && providedLastName) {
    console.log(`No names passed validation with last name ${providedLastName}, generating without last name filter`);
    return generateBabyNameSuggestions(gender, religion, driver, conductor, loshuGrid, providedFirstName, undefined);
  }

  return sorted.slice(0, 24);
};

const determineTargetNumbers = (driver: number, conductor: number, loshuGrid: number[][], providedFirstName?: string, providedLastName?: string): number[] => {
  const FAVORABLE_NUMBERS = [1, 3, 5, 6];
  const targets: number[] = [];
  const flatGrid = loshuGrid.flat();

  const hasNumber = (num: number): boolean => {
    const gridPositions = [4, 9, 2, 3, 5, 7, 8, 1, 6];
    const index = gridPositions.indexOf(num);
    return index !== -1 && flatGrid[index] > 0;
  };

  if (providedFirstName && providedLastName) {
    const currentNameValue = reduceToSingleDigit(calculateNameValue(providedFirstName + providedLastName));
    const firstNameValue = reduceToSingleDigit(calculateNameValue(providedFirstName));

    if (currentNameValue === 4 || currentNameValue === 8 || firstNameValue === 4 || firstNameValue === 8) {
      FAVORABLE_NUMBERS.forEach(num => {
        if (isCompatibleWithDriverConductor(num, driver, conductor)) {
          targets.push(num);
        }
      });
    }
  }

  if (hasNumber(5) && hasNumber(6)) {
    if (isCompatibleWithDriverConductor(1, driver, conductor)) {
      targets.push(1);
    }
  }

  if (!hasNumber(5)) {
    const completes258 = hasNumber(2) && hasNumber(8);
    const completes456 = hasNumber(4) && hasNumber(6);
    if ((completes258 || completes456) && isCompatibleWithDriverConductor(5, driver, conductor)) {
      targets.push(5);
    }
  }

  if (!hasNumber(6) && isCompatibleWithDriverConductor(6, driver, conductor)) {
    targets.push(6);
  }

  if (!hasNumber(3) && isCompatibleWithDriverConductor(3, driver, conductor)) {
    targets.push(3);
  }

  FAVORABLE_NUMBERS.forEach(num => {
    if (isCompatibleWithDriverConductor(num, driver, conductor)) {
      targets.push(num);
    }
  });

  return [...new Set(targets)];
};

// Check anti-number relationships
const checkAntiNumbers = (nameNumber: number, driver: number): boolean => {
  const antiPairs: Record<number, number[]> = {
    1: [8], // Sun anti to Saturn
    2: [4, 9], // Moon anti to Rahu and Mars
    3: [6], // Jupiter anti to Venus
    4: [2, 9], // Rahu anti to Moon and Mars
    5: [], // Mercury has no strong anti numbers
    6: [3], // Venus anti to Jupiter
    7: [], // Neptune/Ketu has complex relationships
    8: [1], // Saturn anti to Sun
    9: [2, 4] // Mars anti to Moon and Rahu
  };
  
  return antiPairs[nameNumber]?.includes(driver) || false;
};
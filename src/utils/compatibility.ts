// Complete Driver-Conductor Compatibility Matrix (81 combinations) as per instructions
const COMPATIBILITY_MATRIX: Record<string, { rating: number; description: string; profession: string[] }> = {
  // Number 1 combinations
  '1-1': { rating: 4, description: 'Fortunes favourite', profession: ['Leadership', 'Politics', 'Business'] },
  '1-2': { rating: 4, description: 'Best for Navy', profession: ['Navy', 'Water Sports', 'Marine Business'] },
  '1-3': { rating: 3.5, description: 'Best for Occult', profession: ['Spiritual', 'Healing', 'Teaching'] },
  '1-4': { rating: 3, description: 'Politics', profession: ['Politics', 'Government', 'Administration'] },
  '1-5': { rating: 4, description: 'Banking & Finance', profession: ['Banking', 'Finance', 'Investment'] },
  '1-6': { rating: 3.5, description: 'Luxury / Glamour', profession: ['Fashion', 'Entertainment', 'Luxury Goods'] },
  '1-7': { rating: 3, description: 'Best for Occult / Education / Research', profession: ['Research', 'Education', 'Occult'] },
  '1-8': { rating: 1, description: 'Struggle / Marriage issues / Police / Politics', profession: ['Police', 'Politics', 'Law'] },
  '1-9': { rating: 5, description: 'Super Successful', profession: ['Army', 'Leadership', 'Sports'] },

  // Number 2 combinations
  '2-1': { rating: 3.5, description: 'Successful', profession: ['Management', 'Business', 'Leadership'] },
  '2-2': { rating: 2, description: 'Best for water related work / Navy / Sweets / Colddrink', profession: ['Navy', 'Water Sports', 'Beverages', 'Sweets'] },
  '2-3': { rating: 2.5, description: 'Occult education / Healer / Teacher', profession: ['Teaching', 'Healing', 'Counseling'] },
  '2-4': { rating: 1.5, description: 'Struggle / Depression', profession: ['Labor', 'Manual Work'] },
  '2-5': { rating: 3, description: 'Best for Property / Real estate / Finance M.B.A / Banking', profession: ['Real Estate', 'Finance', 'Banking', 'MBA'] },
  '2-6': { rating: 2.5, description: 'Best for Sweets', profession: ['Food Business', 'Hospitality', 'Celebrations'] },
  '2-7': { rating: 2.5, description: 'Teaching / Occult', profession: ['Teaching', 'Research', 'Spiritual'] },
  '2-8': { rating: 1, description: 'Struggle / Health issue', profession: ['Medical', 'Social Work'] },
  '2-9': { rating: 1.5, description: 'Marriage problem', profession: ['Sports', 'Physical Work'] },

  // Number 3 combinations
  '3-1': { rating: 3.5, description: 'Occult / Education / Healer / Doctor / Administrative job', profession: ['Education', 'Healing', 'Administration', 'Medical'] },
  '3-2': { rating: 2.5, description: 'Water related work / Navy work', profession: ['Navy', 'Water Sports', 'Marine'] },
  '3-3': { rating: 3, description: 'Best for education / Occult', profession: ['Education', 'Spiritual', 'Teaching'] },
  '3-4': { rating: 2, description: 'Good for Sales & Marketing', profession: ['Sales', 'Marketing', 'Business'] },
  '3-5': { rating: 3, description: 'Excellent communication, Anchoring, News, Reading, Acting, Teaching, Banking', profession: ['Communication', 'Media', 'Acting', 'Banking'] },
  '3-6': { rating: 1, description: 'Struggle / Health & Marriage issues (3 & 6 are anti to each other)', profession: ['Healthcare', 'Counseling'] },
  '3-7': { rating: 4, description: 'Best for education / Occult / Healing and teaching', profession: ['Education', 'Healing', 'Spiritual', 'Teaching'] },
  '3-8': { rating: 2, description: 'Lawyer, Printing, Sales', profession: ['Law', 'Printing', 'Sales'] },
  '3-9': { rating: 4, description: 'Education / Occult / Army / Administrative / Doctor', profession: ['Education', 'Army', 'Administration', 'Medical'] },

  // Number 4 combinations
  '4-1': { rating: 3.5, description: 'Politics', profession: ['Politics', 'Government', 'Leadership'] },
  '4-2': { rating: 1.5, description: 'Depression / Struggle', profession: ['Labor', 'Manual Work'] },
  '4-3': { rating: 2, description: 'Sales & Marketing / Occult education', profession: ['Sales', 'Marketing', 'Education'] },
  '4-4': { rating: 1.5, description: 'Best for Law / Struggle', profession: ['Law', 'Legal Services'] },
  '4-5': { rating: 3, description: 'Banking / Event management', profession: ['Banking', 'Event Management', 'Finance'] },
  '4-6': { rating: 3, description: 'Media / luxury / Glamour', profession: ['Media', 'Fashion', 'Entertainment'] },
  '4-7': { rating: 4, description: 'Successful / Best in Occult', profession: ['Spiritual', 'Research', 'Occult'] },
  '4-8': { rating: 1, description: 'Struggle excellent for Law', profession: ['Law', 'Legal Services'] },
  '4-9': { rating: 1, description: 'Struggle / Health / Problems / Surgeries / Accidents', profession: ['Medical', 'Emergency Services'] },

  // Number 5 combinations
  '5-1': { rating: 4, description: 'Successful / Finance / Loan / Property (Balanced Life)', profession: ['Finance', 'Real Estate', 'Banking'] },
  '5-2': { rating: 3.5, description: 'Property', profession: ['Real Estate', 'Property Development'] },
  '5-3': { rating: 3, description: 'Communication / Occult', profession: ['Communication', 'Spiritual', 'Media'] },
  '5-4': { rating: 3, description: 'Overall successful / Sales & Marketing', profession: ['Sales', 'Marketing', 'Business'] },
  '5-5': { rating: 4, description: 'Very Successful, Romantic (May Be Lazy)', profession: ['Entertainment', 'Arts', 'Business'] },
  '5-6': { rating: 4.5, description: 'Life is successful', profession: ['Luxury Business', 'Entertainment', 'Fashion'] },
  '5-7': { rating: 3, description: 'Occult & Banking', profession: ['Banking', 'Spiritual', 'Finance'] },
  '5-8': { rating: 3, description: 'Property', profession: ['Real Estate', 'Property Management'] },
  '5-9': { rating: 3, description: 'Successful', profession: ['Business', 'Leadership', 'Management'] },

  // Number 6 combinations
  '6-1': { rating: 3.5, description: 'Media / luxury / Glamour', profession: ['Media', 'Fashion', 'Entertainment'] },
  '6-2': { rating: 2, description: 'Sweet shop', profession: ['Food Business', 'Sweets', 'Hospitality'] },
  '6-3': { rating: 1, description: 'Health & Marriage issues', profession: ['Healthcare', 'Counseling'] },
  '6-4': { rating: 3, description: 'Successful / Media', profession: ['Media', 'Entertainment', 'Communication'] },
  '6-5': { rating: 4.5, description: 'Super Successful', profession: ['Business', 'Entertainment', 'Luxury'] },
  '6-6': { rating: 4, description: 'Super Successful in media / Film industry / Tour & Travel', profession: ['Film Industry', 'Media', 'Travel'] },
  '6-7': { rating: 3.5, description: 'Successful, Sports, Romantic', profession: ['Sports', 'Entertainment', 'Arts'] },
  '6-8': { rating: 3, description: 'Best for Law', profession: ['Law', 'Legal Services'] },
  '6-9': { rating: 3, description: 'Successful but Marriage problem. Scandals, Controversies', profession: ['Media', 'Politics', 'Entertainment'] },

  // Number 7 combinations
  '7-1': { rating: 3, description: 'Best in occult', profession: ['Spiritual', 'Occult', 'Research'] },
  '7-2': { rating: 2, description: 'Intuitive / Occult', profession: ['Spiritual', 'Healing', 'Intuitive Arts'] },
  '7-3': { rating: 3, description: 'Teaching / Healing / Occult', profession: ['Teaching', 'Healing', 'Spiritual'] },
  '7-4': { rating: 3, description: 'Successful', profession: ['Business', 'Management', 'Leadership'] },
  '7-5': { rating: 3, description: 'Occult', profession: ['Spiritual', 'Research', 'Occult'] },
  '7-6': { rating: 4, description: 'Sports', profession: ['Sports', 'Athletics', 'Physical Training'] },
  '7-7': { rating: 1, description: 'Disappointment in life / Marriage life in danger', profession: ['Counseling', 'Social Work'] },
  '7-8': { rating: 1, description: 'Occult', profession: ['Spiritual', 'Research'] },
  '7-9': { rating: 1, description: 'Teaching / Occult', profession: ['Teaching', 'Spiritual'] },

  // Number 8 combinations
  '8-1': { rating: 1, description: 'Marriage problem & Struggle', profession: ['Law', 'Politics', 'Struggle-based work'] },
  '8-2': { rating: 1, description: 'Health issue / Struggle', profession: ['Healthcare', 'Social Work'] },
  '8-3': { rating: 2, description: 'Law / Printing', profession: ['Law', 'Printing', 'Publishing'] },
  '8-4': { rating: 1, description: 'Best Law, Sales & marketing, But struggle in life', profession: ['Law', 'Sales', 'Marketing'] },
  '8-5': { rating: 3, description: 'Real estate, Property', profession: ['Real Estate', 'Property', 'Construction'] },
  '8-6': { rating: 3, description: 'Best for law', profession: ['Law', 'Legal Services'] },
  '8-7': { rating: 2, description: 'Occult', profession: ['Spiritual', 'Research'] },
  '8-8': { rating: 1, description: 'Struggle but good in Sports', profession: ['Sports', 'Physical Work'] },
  '8-9': { rating: 1, description: 'Army (Saturn represents physical efforts)', profession: ['Army', 'Defense', 'Physical Work'] },

  // Number 9 combinations
  '9-1': { rating: 4, description: 'Successful, Army is best', profession: ['Army', 'Defense', 'Leadership'] },
  '9-2': { rating: 1, description: 'Struggle, Marriage Problem', profession: ['Counseling', 'Social Work'] },
  '9-3': { rating: 2.5, description: 'Occult / Healing', profession: ['Spiritual', 'Healing', 'Alternative Medicine'] },
  '9-4': { rating: 1.5, description: 'Struggle, Surgeries, Health issues', profession: ['Medical', 'Healthcare', 'Surgery'] },
  '9-5': { rating: 3, description: 'Successful', profession: ['Business', 'Management', 'Leadership'] },
  '9-6': { rating: 2, description: 'Scandals / Controversies', profession: ['Media', 'Politics', 'Public Relations'] },
  '9-7': { rating: 1, description: 'Occult / Teaching', profession: ['Teaching', 'Spiritual', 'Education'] },
  '9-8': { rating: 2, description: 'Army / Police', profession: ['Army', 'Police', 'Defense'] },
  '9-9': { rating: 1, description: 'Marriage problem', profession: ['Counseling', 'Social Work'] }
};

export const getCompatibility = (driver: number, conductor: number) => {
  const key = `${driver}-${conductor}`;
  return COMPATIBILITY_MATRIX[key] || {
    rating: 2,
    description: 'Moderate compatibility',
    profession: ['General Business', 'Service Industry']
  };
};

const ANTI_NUMBER_PAIRS: Record<number, number[]> = {
  1: [8],
  2: [4, 9],
  3: [6],
  4: [2, 9],
  6: [3],
  8: [1],
  9: [2, 4]
};

export const isAntiNumber = (nameNumber: number, targetNumber: number): boolean => {
  const antiNumbers = ANTI_NUMBER_PAIRS[targetNumber] || [];
  return antiNumbers.includes(nameNumber);
};

export const isCompatibleWithDriverConductor = (
  nameNumber: number,
  driver: number,
  conductor: number
): boolean => {
  const FAVORABLE_NUMBERS = [1, 3, 5, 6];

  if (!FAVORABLE_NUMBERS.includes(nameNumber)) {
    return false;
  }

  if (isAntiNumber(nameNumber, driver)) {
    return false;
  }

  if (isAntiNumber(nameNumber, conductor)) {
    return false;
  }

  return true;
};

export const calculateCompatibilityScore = (
  numerologyValue: number,
  driver: number,
  conductor: number,
  targetNumbers: number[] = []
): number => {
  let score = 50;

  if (isAntiNumber(numerologyValue, driver)) {
    score -= 30;
  }

  if (isAntiNumber(numerologyValue, conductor)) {
    score -= 30;
  }

  if (numerologyValue === driver) {
    score += 25;
  } else if (numerologyValue === conductor) {
    score += 20;
  }

  if (targetNumbers.includes(numerologyValue)) {
    score += 15;
  }

  const FAVORABLE_NUMBERS = [1, 3, 5, 6];
  if (FAVORABLE_NUMBERS.includes(numerologyValue)) {
    score += 10;
  }

  const UNFAVORABLE_NUMBERS = [4, 8];
  if (UNFAVORABLE_NUMBERS.includes(numerologyValue)) {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
};
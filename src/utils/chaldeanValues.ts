// Chaldean Numerology Alphabet Values
export const CHALDEAN_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1, J: 1,
  K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2, S: 3, T: 4,
  U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7
};

export const calculateNameValue = (name: string): number => {
  if (!name || typeof name !== 'string') {
    console.warn('calculateNameValue received invalid input:', name);
    return 0;
  }
  console.log(`Calculating value for: "${name}"`);
  return name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .reduce((sum, letter) => {
      const value = CHALDEAN_VALUES[letter] || 0;
      console.log(`Letter ${letter} = ${value}, Running sum: ${sum + value}`);
      return sum + value;
    }, 0);
};

export const reduceToSingleDigit = (num: number): number => {
  while (num > 9) {
    num = Math.floor(num / 10) + (num % 10);
  }
  return num;
};

export const calculateCompoundAndSingleDigit = (name: string): { compound: number; single: number; display: string } => {
  const compound = calculateNameValue(name);
  const single = reduceToSingleDigit(compound);

  if (compound === single || compound <= 9) {
    return { compound, single, display: `${single}` };
  }

  return { compound, single, display: `${compound}→${single}` };
};
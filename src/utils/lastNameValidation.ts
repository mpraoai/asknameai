import { calculateNameValue, reduceToSingleDigit } from './chaldeanValues';

const FAVORABLE_NUMBERS = [1, 3, 5, 6];
const FORBIDDEN_COMPOUNDS = [44, 48, 28, 18, 36];

export interface CombinedNameResult {
  firstNameTotal: number;
  lastNameTotal: number;
  combinedTotal: number;
  combinedReduced: number;
  isValid: boolean;
  compatibilityPercentage: number;
  status: string;
}

export const calculateLastNameTotal = (lastName: string): number => {
  return calculateNameValue(lastName);
};

export const calculateCombinedName = (
  firstName: string,
  lastName: string
): CombinedNameResult => {
  const firstNameTotal = calculateNameValue(firstName);
  const lastNameTotal = calculateNameValue(lastName);
  const combinedTotal = firstNameTotal + lastNameTotal;
  const combinedReduced = reduceToSingleDigit(combinedTotal);

  const isValid = FAVORABLE_NUMBERS.includes(combinedReduced) &&
                  !FORBIDDEN_COMPOUNDS.includes(combinedTotal);

  const compatibilityPercentage = calculateCompatibilityPercentage(
    combinedReduced,
    combinedTotal
  );

  const status = getCompatibilityStatus(compatibilityPercentage);

  return {
    firstNameTotal,
    lastNameTotal,
    combinedTotal,
    combinedReduced,
    isValid,
    compatibilityPercentage,
    status
  };
};

const calculateCompatibilityPercentage = (
  reducedValue: number,
  compoundValue: number
): number => {
  let baseScore = 0;

  switch (reducedValue) {
    case 1:
      baseScore = 95;
      break;
    case 3:
      baseScore = 88;
      break;
    case 5:
      baseScore = 92;
      break;
    case 6:
      baseScore = 90;
      break;
    default:
      baseScore = 50;
  }

  if (FORBIDDEN_COMPOUNDS.includes(compoundValue)) {
    baseScore = Math.max(0, baseScore - 40);
  }

  if (compoundValue >= 40 && compoundValue <= 50) {
    baseScore = Math.max(0, baseScore - 10);
  }

  return baseScore;
};

const getCompatibilityStatus = (percentage: number): string => {
  if (percentage >= 90) return 'Highly Favorable';
  if (percentage >= 80) return 'Favorable';
  if (percentage >= 70) return 'Good';
  if (percentage >= 60) return 'Acceptable';
  return 'Not Recommended';
};

export const isForbiddenCompound = (total: number): boolean => {
  return FORBIDDEN_COMPOUNDS.includes(total);
};

export const isValidCombinedName = (
  firstName: string,
  lastName: string
): boolean => {
  const result = calculateCombinedName(firstName, lastName);
  return result.isValid;
};

export const filterNamesByLastName = <T extends { name: string }>(
  names: T[],
  lastName: string
): T[] => {
  if (!lastName) return names;

  return names.filter(nameObj => {
    const result = calculateCombinedName(nameObj.name, lastName);
    return result.isValid;
  });
};

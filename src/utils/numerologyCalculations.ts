import { reduceToSingleDigit } from './chaldeanValues';
import { NumerologyCalculation } from '../types/numerology';

export const calculateDriver = (birthDate: string): number => {
  const date = new Date(birthDate);
  const day = date.getDate();
  return reduceToSingleDigit(day);
};

export const calculateConductor = (birthDate: string): number => {
  const date = new Date(birthDate);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  const daySum = reduceToSingleDigit(day);
  const monthSum = reduceToSingleDigit(month);
  const yearSum = reduceToSingleDigit(year);
  
  return reduceToSingleDigit(daySum + monthSum + yearSum);
};

export const calculateKua = (birthDate: string, gender: 'male' | 'female'): number => {
  const date = new Date(birthDate);
  const year = date.getFullYear();
  const yearSum = reduceToSingleDigit(year);
  
  if (gender === 'male') {
    let result = 11 - yearSum;
    if (result <= 0) {
      result = result + 9;
    }
    // Always reduce to single digit
    return reduceToSingleDigit(result);
  } else {
    const result = 4 + yearSum;
    // Always reduce to single digit
    return reduceToSingleDigit(result);
  }
};

export const createLoshuGrid = (birthDate: string, driver: number, conductor: number, kua: number, gender: 'male' | 'female'): number[][] => {
  // Initialize empty grid with Lo Shu positions
  const grid = [
    [0, 0, 0], // positions for 4, 9, 2
    [0, 0, 0], // positions for 3, 5, 7
    [0, 0, 0]  // positions for 8, 1, 6
  ];
  
  // Lo Shu grid number positions
  const positions: Record<number, [number, number]> = {
    4: [0, 0], 9: [0, 1], 2: [0, 2],
    3: [1, 0], 5: [1, 1], 7: [1, 2],
    8: [2, 0], 1: [2, 1], 6: [2, 2]
  };
  
  // Count occurrences of each digit from the complete birth date
  const counts: Record<number, number> = {};
  
  // Extract all digits from birth date (DD/MM/YYYY format)
  const dateDigits = birthDate.replace(/[-\/]/g, '').split('').map(Number);
  
  // Count each digit occurrence
  dateDigits.forEach(digit => {
    if (digit >= 1 && digit <= 9) { // Only count digits 1-9, ignore 0
      counts[digit] = (counts[digit] || 0) + 1;
    }
  });

  // Get the day of birth to check if we should add driver separately
  const date = new Date(birthDate);
  const day = date.getDate();

  // Add the three lotteries (Driver, Conductor, Kua)
  // Special rule for driver: Don't add separately if day is 1-9, 10, 20, or 30
  // because the driver number is already included in the birth date digits
  const shouldAddDriver = day > 9 && day !== 10 && day !== 20 && day !== 30;

  if (shouldAddDriver) {
    counts[driver] = (counts[driver] || 0) + 1;
  }
  counts[conductor] = (counts[conductor] || 0) + 1;
  counts[kua] = (counts[kua] || 0) + 1;
  
  // Place counts in correct Lo Shu positions
  for (let num = 1; num <= 9; num++) {
    if (positions[num]) {
      const [row, col] = positions[num];
      grid[row][col] = counts[num] || 0;
    }
  }
  
  return grid;
};

export const analyzePlanes = (grid: number[][]): NumerologyCalculation['planes'] => {
  return {
    mental: [grid[0][0], grid[0][1], grid[0][2]], // 4,9,2
    thought: [grid[0][0], grid[1][0], grid[2][0]], // 4,3,8
    will: [grid[0][1], grid[1][1], grid[2][1]], // 9,5,1
    action: [grid[0][2], grid[1][2], grid[2][2]], // 2,7,6
    practical: [grid[2][0], grid[2][1], grid[2][2]], // 8,1,6
    emotional: [grid[1][0], grid[1][1], grid[1][2]], // 3,5,7
    success1: [grid[0][0], grid[1][1], grid[2][2]], // 4,5,6
    success2: [grid[0][2], grid[1][1], grid[2][0]] // 2,5,8
  };
};
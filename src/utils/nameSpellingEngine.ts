import { CHALDEAN_VALUES, calculateNameValue, reduceToSingleDigit } from './chaldeanValues';

export interface NameSpellingResult {
  currentAnalysis: {
    firstName: {
      total: number;
      reduced: number;
      isPairing: boolean;
      pairingType?: string;
      isAntiToDriver: boolean;
      isForbiddenPairing: boolean;
    };
    fullName: {
      total: number;
      reduced: number;
      isPairing: boolean;
      pairingType?: string;
      isAntiToDriver: boolean;
      isForbiddenPairing: boolean;
    };
  };
  isAuspicious: boolean;
  recommendations: string[];
  correctedNames: Array<{
    name: string;
    total: number;
    reduced: number;
    series: string;
    compatibility: number;
    method: string;
  }>;
  targetNumber: number;
}

// Anti-number relationships
const ANTI_NUMBERS: Record<number, number[]> = {
  1: [8], 2: [4, 9], 3: [6], 4: [2, 9], 5: [], 6: [3], 7: [], 8: [1], 9: [2, 4]
};

// Silent letters that can replace existing letters without changing pronunciation
const SILENT_LETTER_REPLACEMENTS: Record<string, string[]> = {
  'A': ['AA'], // A(1) -> AA(2)
  'E': ['EE'], // E(5) -> EE(10)
  'I': ['II'], // I(1) -> II(2)
  'O': ['OO'], // O(7) -> OO(14)
  'U': ['UU'], // U(6) -> UU(12)
  'H': ['HH'], // H(5) -> HH(10)
  'R': ['RR'], // R(2) -> RR(4)
  'S': ['SS'], // S(3) -> SS(6)
  'T': ['TT'], // T(4) -> TT(8)
  'N': ['NN'], // N(5) -> NN(10)
  'M': ['MM'], // M(4) -> MM(8)
  'L': ['LL'], // L(3) -> LL(6)
};

function isAntiToDriver(number: number, driver: number): boolean {
  return ANTI_NUMBERS[number]?.includes(driver) || ANTI_NUMBERS[driver]?.includes(number) || false;
}

function isForbiddenPairing(total: number): boolean {
  const reduced = reduceToSingleDigit(total);
  if (reduced === 4 || reduced === 8) return true;
  
  const digits = total.toString().split('').map(Number);
  if (digits.length === 2) {
    const [first, second] = digits;
    const antiPairs = [[2, 8], [8, 2], [1, 8], [8, 1], [3, 6], [6, 3], [2, 4], [4, 2], [2, 9], [9, 2], [4, 9], [9, 4]];
    if (antiPairs.some(([a, b]) => first === a && second === b)) return true;
  }
  return false;
}

function determineTargetNumber(driver: number, conductor: number, loshuGrid: number[][]): number {
  const flatGrid = loshuGrid.flat();
  const gridPositions = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  
  const hasNumber = (num: number): boolean => {
    const index = gridPositions.indexOf(num);
    return index !== -1 && flatGrid[index] > 0;
  };
  
  if (hasNumber(5) && hasNumber(6) && driver !== 8 && conductor !== 8) return 1;
  if (!hasNumber(5) && (hasNumber(2) && hasNumber(8) || hasNumber(4) && hasNumber(6))) return 5;
  if (!hasNumber(6) && driver !== 3 && conductor !== 3) return 6;
  if (!hasNumber(3) && driver !== 6 && conductor !== 6) return 3;
  
  return 6; // Default
}

function findWaysToAddValue(name: string, needed: number): Array<{ name: string; value: number; method: string }> {
  const options: Array<{ name: string; value: number; method: string }> = [];
  
  // Try duplicating each letter
  for (let i = 0; i < name.length; i++) {
    const letter = name[i].toUpperCase();
    const letterValue = CHALDEAN_VALUES[letter] || 0;
    
    if (letterValue === needed) {
      const newName = name.slice(0, i) + letter.toLowerCase() + name.slice(i);
      options.push({
        name: newName,
        value: letterValue,
        method: `Duplicate ${letter} (+${letterValue})`
      });
    }
  }
  
  return options;
}

// 4-Step Name Correction Logic as per user requirements
function generateNameCorrections(
  firstName: string,
  lastName: string,
  driver: number,
  targetNumber: number,
  fatherInitial?: string,
  motherInitial?: string
): Array<{ name: string; total: number; reduced: number; series: string; compatibility: number; method: string }> {
  
  const corrections: Array<{ name: string; total: number; reduced: number; series: string; compatibility: number; method: string }> = [];
  const firstNameTotal = calculateNameValue(firstName);
  const lastNameTotal = calculateNameValue(lastName);
  const currentTotal = firstNameTotal + lastNameTotal;
  
  console.log(`=== SIMPLE UPLIFT LOGIC FOR ${firstName} ${lastName} ===`);
  console.log(`Current Total: ${currentTotal}`);
  
  // Calculate how much to add to reach target numbers
  const calculateNeededForTarget = (target: number, current: number): number => {
    let nextNumber = current + 1;
    while (reduceToSingleDigit(nextNumber) !== target) {
      nextNumber++;
      if (nextNumber - current > 50) break; // Safety limit
    }
    return nextNumber - current;
  };
  
  console.log(`To get 1: Need +${calculateNeededForTarget(1, currentTotal)} more`);
  console.log(`To get 3: Need +${calculateNeededForTarget(3, currentTotal)} more`);
  console.log(`To get 5: Need +${calculateNeededForTarget(5, currentTotal)} more`);
  console.log(`To get 6: Need +${calculateNeededForTarget(6, currentTotal)} more`);
  
  // Calculate exact numbers needed to reach targets
  const targetsNeeded = [];
  
  // Find next numbers that reduce to the specific target number
  for (let target of [targetNumber]) {
    let nextTarget = currentTotal;
    while (reduceToSingleDigit(nextTarget) !== target) {
      nextTarget++;
    }
    const needed = nextTarget - currentTotal;
    if (needed > 0 && needed <= 20) { // Reasonable limit
      targetsNeeded.push({ target, needed, total: nextTarget });
    }
  }
  
  // Also try other auspicious numbers if primary target doesn't work
  if (targetsNeeded.length === 0) {
    for (let target of [1, 3, 5, 6]) {
      if (target === targetNumber) continue; // Already tried
      let nextTarget = currentTotal;
      while (reduceToSingleDigit(nextTarget) !== target) {
        nextTarget++;
      }
      const needed = nextTarget - currentTotal;
      if (needed > 0 && needed <= 20) {
        targetsNeeded.push({ target, needed, total: nextTarget });
      }
    }
  }
  
  console.log('Targets needed:', targetsNeeded);
  
  // CRITICAL: Check if first name itself needs correction
  const firstNameReduced = reduceToSingleDigit(firstNameTotal);
  const isFirstNameForbidden = isForbiddenPairing(firstNameTotal) || 
                              firstNameReduced === 4 || firstNameReduced === 8 ||
                              isAntiToDriver(firstNameReduced, driver);
  
  if (isFirstNameForbidden) {
    console.log(`❌ CRITICAL: First name ${firstName} (${firstNameTotal}→${firstNameReduced}) is FORBIDDEN and must be corrected first!`);
  }
  
  // Try to add needed numbers through strategic placement
  for (const { target, needed, total } of targetsNeeded) {
    console.log(`\n--- TRYING TO ADD ${needed} TO REACH ${target} (Total: ${total}) ---`);
    
    // Method 1: Add to first name through duplication
    const firstNameOptions = findWaysToAddValue(firstName, needed);
    for (const option of firstNameOptions) {
      const newFirstNameTotal = firstNameTotal + option.value;
      const newTotal = newFirstNameTotal + lastNameTotal;
      const newFirstNameReduced = reduceToSingleDigit(newFirstNameTotal);
      const newTotalReduced = reduceToSingleDigit(newTotal);
      
      console.log(`${option.name} ${lastName}: First=${newFirstNameTotal}→${newFirstNameReduced}, Full=${newTotal}→${newTotalReduced}`);
      
      const isFirstNameValid = !isForbiddenPairing(newFirstNameTotal) && 
                              newFirstNameReduced !== 4 && newFirstNameReduced !== 8 &&
                              !isAntiToDriver(newFirstNameReduced, driver);
      const isFullNameValid = newTotalReduced === target && 
                             !isForbiddenPairing(newTotal) && 
                             !isAntiToDriver(newTotalReduced, driver);
      
      if (isFirstNameValid && isFullNameValid) {
        corrections.push({
          name: `${option.name} ${lastName}`,
          total: newTotal,
          reduced: newTotalReduced,
          series: `Target ${target} Series`,
          compatibility: target === targetNumber ? 10 : 8,
          method: `Add ${needed} to first name: ${option.method}`
        });
        console.log(`✅ FOUND: ${option.name} ${lastName} → ${newTotal} → ${target}`);
      }
    }
    
    // Method 2: Add to last name through duplication
    const lastNameOptions = findWaysToAddValue(lastName, needed);
    for (const option of lastNameOptions) {
      const newLastNameTotal = lastNameTotal + option.value;
      const newTotal = firstNameTotal + newLastNameTotal;
      const newTotalReduced = reduceToSingleDigit(newTotal);
      
      console.log(`${firstName} ${option.name}: First=${firstNameTotal}→${reduceToSingleDigit(firstNameTotal)}, Full=${newTotal}→${newTotalReduced}`);
      
      const isFullNameValid = newTotalReduced === target && 
                             !isForbiddenPairing(newTotal) && 
                             !isAntiToDriver(newTotalReduced, driver);
      
      if (!isFirstNameForbidden && isFullNameValid) {
        corrections.push({
          name: `${firstName} ${option.name}`,
          total: newTotal,
          reduced: newTotalReduced,
          series: `Target ${target} Series`,
          compatibility: target === targetNumber ? 10 : 8,
          method: `Add ${needed} to last name: ${option.method}`
        });
        console.log(`✅ FOUND: ${firstName} ${option.name} → ${newTotal} → ${target}`);
      }
    }
    
    // Method 3: Add parent initials
    if (fatherInitial) {
      const fatherValue = CHALDEAN_VALUES[fatherInitial.toUpperCase()] || 0;
      if (fatherValue === needed) {
        const newTotal = currentTotal + fatherValue;
        const newTotalReduced = reduceToSingleDigit(newTotal);
        
        if (newTotalReduced === target && !isFirstNameForbidden) {
          corrections.push({
            name: `${firstName} ${fatherInitial.toUpperCase()} ${lastName}`,
            total: newTotal,
            reduced: newTotalReduced,
            series: `Target ${target} Series`,
            compatibility: target === targetNumber ? 10 : 9,
            method: `Add father initial '${fatherInitial}' (+${fatherValue})`
          });
          console.log(`✅ FOUND: ${firstName} ${fatherInitial} ${lastName} → ${newTotal} → ${target}`);
        }
      }
    }
    
    if (motherInitial) {
      const motherValue = CHALDEAN_VALUES[motherInitial.toUpperCase()] || 0;
      if (motherValue === needed) {
        const newTotal = currentTotal + motherValue;
        const newTotalReduced = reduceToSingleDigit(newTotal);
        
        if (newTotalReduced === target && !isFirstNameForbidden) {
          corrections.push({
            name: `${firstName} ${motherInitial.toUpperCase()} ${lastName}`,
            total: newTotal,
            reduced: newTotalReduced,
            series: `Target ${target} Series`,
            compatibility: target === targetNumber ? 10 : 9,
            method: `Add mother initial '${motherInitial}' (+${motherValue})`
          });
          console.log(`✅ FOUND: ${firstName} ${motherInitial} ${lastName} → ${newTotal} → ${target}`);
        }
      }
    }
  }
  
  return corrections.slice(0, 15);
}

export function analyzeNameSpelling(
  fullFirstName: string,
  fullLastName: string,
  driver: number,
  conductor: number,
  loshuGrid: number[][],
  fatherInitial?: string,
  motherInitial?: string
): NameSpellingResult {
  const firstNameValue = calculateNameValue(fullFirstName);
  const fullNameValue = calculateNameValue(fullFirstName + fullLastName);
  const firstNameReduced = reduceToSingleDigit(firstNameValue);
  const fullNameReduced = reduceToSingleDigit(fullNameValue);
  
  const targetNumber = determineTargetNumber(driver, conductor, loshuGrid);
  
  const firstNameForbidden = isForbiddenPairing(firstNameValue) || 
                            firstNameReduced === 4 || firstNameReduced === 8 ||
                            isAntiToDriver(firstNameReduced, driver);
  
  const fullNameForbidden = isForbiddenPairing(fullNameValue) || 
                           fullNameReduced === 4 || fullNameReduced === 8 ||
                           isAntiToDriver(fullNameReduced, driver);
  
  const isAuspicious = !firstNameForbidden && !fullNameForbidden && 
                      [1, 3, 5, 6].includes(fullNameReduced);
  
  const recommendations: string[] = [];
  
  if (firstNameForbidden) {
    recommendations.push(`First name ${fullFirstName} (${firstNameValue}→${firstNameReduced}) needs correction`);
  }
  
  if (fullNameForbidden) {
    recommendations.push(`Full name total ${fullNameValue}→${fullNameReduced} needs correction`);
  }
  
  if (!isAuspicious) {
    recommendations.push(`Target number ${targetNumber} for optimal results`);
  }
  
  let correctedNames: Array<{
    name: string;
    total: number;
    reduced: number;
    series: string;
    compatibility: number;
    method: string;
  }> = [];
  
  if (!isAuspicious) {
    correctedNames = generateNameCorrections(
      fullFirstName,
      fullLastName,
      driver,
      targetNumber,
      fatherInitial,
      motherInitial
    );
    
    // If no corrections found and parent initials are available, try fallback
    if (correctedNames.length === 0 && !isAuspicious && (fatherInitial || motherInitial)) {
      console.log(`=== NO CORRECTIONS FOUND - TRYING PARENT INITIALS FALLBACK ===`);
      const fallbackCorrections = tryParentInitialsFallback(
        fullFirstName, 
        fullLastName, 
        fullNameValue, 
        driver, 
        targetNumber, 
        fatherInitial, 
        motherInitial
      );
      correctedNames.push(...fallbackCorrections);
      console.log(`Found ${fallbackCorrections.length} fallback corrections`);
      
      // If still no corrections, try amendment fallback
      if (correctedNames.length === 0) {
        console.log(`=== TRYING AMENDMENT FALLBACK ===`);
        const amendmentCorrections = tryNameAmendmentFallback(
          fullFirstName,
          fullLastName,
          fullNameValue,
          driver,
          targetNumber,
          fatherInitial,
          motherInitial
        );
        correctedNames.push(...amendmentCorrections);
        console.log(`Found ${amendmentCorrections.length} amendment corrections`);
      }
    }

    // If still no corrections found, try basic amendment fallback
    if (correctedNames.length === 0) {
      console.log(`=== TRYING BASIC AMENDMENT FALLBACK ===`);
      const amendmentCorrections = tryBasicAmendmentFallback(
        fullFirstName,
        fullLastName,
        driver,
        targetNumber,
        fatherInitial,
        motherInitial
      );
      correctedNames.push(...amendmentCorrections);
      console.log(`Found ${amendmentCorrections.length} basic amendment corrections`);
    }
  }
  
  return {
    currentAnalysis: {
      firstName: {
        total: firstNameValue,
        reduced: firstNameReduced,
        isPairing: false,
        isAntiToDriver: isAntiToDriver(firstNameReduced, driver),
        isForbiddenPairing: firstNameForbidden
      },
      fullName: {
        total: fullNameValue,
        reduced: fullNameReduced,
        isPairing: false,
        isAntiToDriver: isAntiToDriver(fullNameReduced, driver),
        isForbiddenPairing: fullNameForbidden
      }
    },
    isAuspicious,
    recommendations,
    correctedNames,
    targetNumber
  };
}

function tryParentInitialsFallback(
  firstName: string,
  lastName: string,
  currentTotal: number,
  driver: number,
  targetNumber: number,
  fatherInitial?: string,
  motherInitial?: string
): Array<{ name: string; total: number; reduced: number; series: string; compatibility: number; method: string }> {
  return [];
}

function tryNameAmendmentFallback(
  firstName: string,
  lastName: string,
  currentTotal: number,
  driver: number,
  targetNumber: number,
  fatherInitial?: string,
  motherInitial?: string
): Array<{ name: string; total: number; reduced: number; series: string; compatibility: number; method: string }> {
  const corrections: Array<{ name: string; total: number; reduced: number; series: string; compatibility: number; method: string }> = [];
  
  console.log(`=== NAME AMENDMENT FALLBACK FOR ${firstName} ${lastName} (${currentTotal}) ===`);
  
  const targets = [targetNumber, 1, 3, 5, 6]; // Try target first, then other auspicious numbers
  
  for (const target of targets) {
    // Find next number that reduces to target
    let nextTarget = currentTotal + 1;
    while (reduceToSingleDigit(nextTarget) !== target && nextTarget - currentTotal < 15) {
      nextTarget++;
    }
    
    if (nextTarget - currentTotal >= 10) continue; // Skip if too far
    
    const needed = nextTarget - currentTotal;
    console.log(`Target ${target}: Need +${needed} to reach ${nextTarget}`);
    
    // Try first name amendment
    const firstNameOptions = findWaysToAddValue(firstName, needed);
    for (const option of firstNameOptions) {
      const newFirstNameTotal = calculateNameValue(firstName) + option.value;
      const newFirstNameReduced = reduceToSingleDigit(newFirstNameTotal);
      
      // Check if first name amendment is safe
      if (newFirstNameReduced !== 4 && newFirstNameReduced !== 8 && 
          !isForbiddenPairing(newFirstNameTotal) && 
          !isAntiToDriver(newFirstNameReduced, driver)) {
        
        const newTotal = newFirstNameTotal + calculateNameValue(lastName);
        const newTotalReduced = reduceToSingleDigit(newTotal);
        
        if (newTotalReduced === target) {
          corrections.push({
            name: `${option.name} ${lastName}`,
            total: newTotal,
            reduced: newTotalReduced,
            series: `Target ${target} Series`,
            compatibility: 9,
            method: `First name amendment: ${option.method}`
          });
          console.log(`✅ First name amendment: ${option.name} ${lastName} → ${newTotal} → ${target}`);
        }
      }
    }
    
    // Try last name amendment
    const lastNameOptions = findWaysToAddValue(lastName, needed);
    for (const option of lastNameOptions) {
      const newLastNameTotal = calculateNameValue(lastName) + option.value;
      const newTotal = calculateNameValue(firstName) + newLastNameTotal;
      const newTotalReduced = reduceToSingleDigit(newTotal);
      
      // Check if first name is still safe
      const firstNameReduced = reduceToSingleDigit(calculateNameValue(firstName));
      if (firstNameReduced !== 4 && firstNameReduced !== 8 && 
          !isAntiToDriver(firstNameReduced, driver) && 
          newTotalReduced === target) {
        
        corrections.push({
          name: `${firstName} ${option.name}`,
          total: newTotal,
          reduced: newTotalReduced,
          series: `Target ${target} Series`,
          compatibility: 8,
          method: `Last name amendment: ${option.method}`
        });
        console.log(`✅ Last name amendment: ${firstName} ${option.name} → ${newTotal} → ${target}`);
      }
    }
  }
  
  return corrections.slice(0, 10); // Return top 10 corrections
}

// ONLY amendment fallback - does not change existing logic
function tryBasicAmendmentFallback(
  firstName: string,
  lastName: string,
  driver: number,
  targetNumber: number,
  fatherInitial?: string,
  motherInitial?: string
): Array<{ name: string; total: number; reduced: number; series: string; compatibility: number; method: string }> {
  const corrections: Array<{ name: string; total: number; reduced: number; series: string; compatibility: number; method: string }> = [];
  const currentTotal = calculateNameValue(firstName) + calculateNameValue(lastName);
  
  console.log(`=== AMENDMENT FALLBACK FOR ${firstName} ${lastName} (${currentTotal}) ===`);
  
  // Only try single letter duplication (not multiple letters)
  const targets = [targetNumber]; // Only try the specific target number
  
  for (const target of targets) {
    // Find next number that reduces to target
    let nextTarget = currentTotal + 1;
    while (reduceToSingleDigit(nextTarget) !== target && nextTarget - currentTotal < 20) {
      nextTarget++;
    }
    
    if (nextTarget - currentTotal >= 10) continue; // Skip if too far
    
    const needed = nextTarget - currentTotal;
    console.log(`Target ${target}: Need +${needed} to reach ${nextTarget}`);
    
    // FIRST: Try parent initials (existing logic)
    if (fatherInitial) {
      const fatherValue = CHALDEAN_VALUES[fatherInitial.toUpperCase()] || 0;
      if (fatherValue === needed) {
        const newTotal = currentTotal + fatherValue;
        const newTotalReduced = reduceToSingleDigit(newTotal);
        const firstNameReduced = reduceToSingleDigit(calculateNameValue(firstName));
        
        // Check if first name is safe and result matches target
        if (firstNameReduced !== 4 && firstNameReduced !== 8 && 
            !isAntiToDriver(firstNameReduced, driver) && 
            newTotalReduced === target) {
          corrections.push({
            name: `${firstName} ${fatherInitial.toUpperCase()} ${lastName}`,
            total: newTotal,
            reduced: newTotalReduced,
            series: `Target ${target} Series`,
            compatibility: 10,
            method: `Add father initial '${fatherInitial}' (+${fatherValue})`
          });
          console.log(`✅ Father initial: ${fatherInitial.toUpperCase()} ${firstName} ${lastName} → ${newTotal} → ${target}`);
        }
      }
    }
    
    if (motherInitial) {
      const motherValue = CHALDEAN_VALUES[motherInitial.toUpperCase()] || 0;
      if (motherValue === needed) {
        const newTotal = currentTotal + motherValue;
        const newTotalReduced = reduceToSingleDigit(newTotal);
        const firstNameReduced = reduceToSingleDigit(calculateNameValue(firstName));
        
        // Check if first name is safe and result matches target
        if (firstNameReduced !== 4 && firstNameReduced !== 8 && 
            !isAntiToDriver(firstNameReduced, driver) && 
            newTotalReduced === target) {
          corrections.push({
            name: `${firstName} ${motherInitial.toUpperCase()} ${lastName}`,
            total: newTotal,
            reduced: newTotalReduced,
            series: `Target ${target} Series`,
            compatibility: 10,
            method: `Add mother initial '${motherInitial}' (+${motherValue})`
          });
          console.log(`✅ Mother initial: ${motherInitial.toUpperCase()} ${firstName} ${lastName} → ${newTotal} → ${target}`);
        }
      }
    }
    
    // Try first name amendment - ONLY single letter duplication
    for (let i = 0; i < firstName.length; i++) {
      const letter = firstName[i].toUpperCase();
      if (CHALDEAN_VALUES[letter] === needed) {
        const newFirstName = firstName.slice(0, i) + letter.toLowerCase() + firstName.slice(i);
        const newFirstNameTotal = calculateNameValue(newFirstName);
        const newTotal = newFirstNameTotal + calculateNameValue(lastName);
        const newTotalReduced = reduceToSingleDigit(newTotal);
        
        if (newTotalReduced === target) {
          corrections.push({
            name: `${newFirstName} ${lastName}`,
            total: newTotal,
            reduced: newTotalReduced,
            series: `Target ${target} Series`,
            compatibility: 9,
            method: `First name amendment: Add ${letter} (+${needed})`
          });
          console.log(`✅ First name amendment: ${newFirstName} ${lastName} → ${newTotal} → ${target}`);
        }
      }
    }
    
    // Try last name amendment - ONLY single letter duplication
    for (let i = 0; i < lastName.length; i++) {
      const letter = lastName[i].toUpperCase();
      if (CHALDEAN_VALUES[letter] === needed) {
        const newLastName = lastName.slice(0, i) + letter.toLowerCase() + lastName.slice(i);
        const newLastNameTotal = calculateNameValue(newLastName);
        const newTotal = calculateNameValue(firstName) + newLastNameTotal;
        const newTotalReduced = reduceToSingleDigit(newTotal);
        
        if (newTotalReduced === target) {
          corrections.push({
            name: `${firstName} ${newLastName}`,
            total: newTotal,
            reduced: newTotalReduced,
            series: `Target ${target} Series`,
            compatibility: 8,
            method: `Last name amendment: Add ${letter} (+${needed})`
          });
          console.log(`✅ Last name amendment: ${firstName} ${newLastName} → ${newTotal} → ${target}`);
        }
      }
    }
  }
  
  return corrections.slice(0, 5); // Return top 5 corrections only
}
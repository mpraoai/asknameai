export interface PersonData {
  name: string;
  surname: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  religion?: string;
  fatherInitial?: string;
  motherInitial?: string;
}

export interface NumerologyCalculation {
  driver: number;
  conductor: number;
  kua: number;
  loshuGrid: number[][];
  planes: {
    mental: number[];
    thought: number[];
    will: number[];
    action: number[];
    practical: number[];
    emotional: number[];
    success1: number[];
    success2: number[];
  };
  compatibility: {
    rating: number;
    description: string;
    profession: string[];
  };
}

export interface NameAnalysis {
  firstName: number;
  fullName: number;
  isAuspicious: boolean;
  recommendations: string[];
  correctedNames?: string[];
  firstNameTotal?: number;
  fullNameTotal?: number;
  driver?: number;
  conductor?: number;
  currentAnalysis?: {
    firstName: {
      total: number;
      reduced: number;
      isPairing: boolean;
      pairingType?: string;
      isAntiToDriver?: boolean;
      isForbiddenPairing?: boolean;
    };
    fullName: {
      total: number;
      reduced: number;
      isPairing: boolean;
      pairingType?: string;
      isAntiToDriver?: boolean;
      isForbiddenPairing?: boolean;
    };
  };
  pairingAnalysis?: {
    firstNamePairing: {
      isGood: boolean;
      pair: string;
      reason: string;
      series?: string;
    };
    fullNamePairing: {
      isGood: boolean;
      pair: string;
      reason: string;
      series?: string;
    };
  };
  targetNumber?: number;
  numeroscopeAnalysis?: {
    missing: number[];
    present: number[];
    has5and6: boolean;
    canComplete258: boolean;
    canComplete456: boolean;
  };
  missingNumbersAnalysis?: Array<{
    number: number;
    rating: number;
    reason: string;
    pairings: number[];
    planetName: string;
    planesStrengthened: string[];
  }>;
}

export interface BabyNameSuggestion {
  name: string;
  numerologyValue: number;
  meaning: string;
  compatibility: string;
  explanation?: string;
  firstNameTotal?: number;
  lastNameTotal?: number;
  combinedTotal?: number;
  combinedReduced?: number;
  compatibilityPercentage?: number;
}
import { analyzeNameSpelling as analyzeNameSpellingEngine } from './nameSpellingEngine';
import { calculateNameValue, reduceToSingleDigit } from './chaldeanValues';
import { NameAnalysis } from '../types/numerology';

export const analyzeNameSpelling = (
  firstName: string,
  lastName: string,
  driver: number,
  conductor: number,
  loshuGrid: number[][]
): NameAnalysis => {
  // Use the Master Stroke Name Spelling Engine
  const result = analyzeNameSpellingEngine(
    firstName,
    lastName,
    driver,
    conductor,
    loshuGrid
  );
  
  return {
    firstName: result.currentAnalysis.firstName.reduced,
    fullName: result.currentAnalysis.fullName.reduced,
    isAuspicious: result.isAuspicious,
    recommendations: result.recommendations,
    firstNameTotal: result.currentAnalysis.firstName.total,
    fullNameTotal: result.currentAnalysis.fullName.total,
    correctedNames: result.correctedNames.map(correction => correction.name),
    targetNumber: result.targetNumber,
    driver: driver,
    conductor: conductor,
    currentAnalysis: result.currentAnalysis,
    pairingAnalysis: {
      firstNamePairing: {
        isGood: !result.currentAnalysis.firstName.isForbiddenPairing,
        pair: `${result.currentAnalysis.firstName.total} → ${result.currentAnalysis.firstName.reduced}`,
        reason: result.currentAnalysis.firstName.pairingType || 'Standard pairing',
        series: result.currentAnalysis.firstName.pairingType
      },
      fullNamePairing: {
        isGood: !result.currentAnalysis.fullName.isForbiddenPairing,
        pair: `${result.currentAnalysis.fullName.total} → ${result.currentAnalysis.fullName.reduced}`,
        reason: result.currentAnalysis.fullName.pairingType || 'Standard pairing',
        series: result.currentAnalysis.fullName.pairingType
      }
    }
  };
};

export const generateCorrectedNamesWithCompleteFormula = (
  firstName: string,
  lastName: string,
  driver: number,
  conductor: number,
  loshuGrid: number[][]
): string[] => {
  const result = analyzeNameSpellingEngine(
    firstName,
    lastName,
    driver,
    conductor,
    loshuGrid
  );
  
  return result.correctedNames.map(correction => correction.name);
};

export const generateNameCorrectionsWithParents = (
  firstName: string,
  lastName: string,
  driver: number,
  conductor: number,
  loshuGrid: number[][],
  fatherInitial?: string,
  motherInitial?: string
): string[] => {
  const result = analyzeNameSpellingEngine(
    firstName,
    lastName,
    driver,
    conductor,
    loshuGrid,
    fatherInitial,
    motherInitial
  );
  
  return result.correctedNames.map(correction => correction.name);
};
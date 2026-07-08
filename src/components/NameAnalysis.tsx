import React from 'react';
import { NameAnalysis as NameAnalysisType } from '../types/numerology';
import { CheckCircle, XCircle, AlertTriangle, Edit3 } from 'lucide-react';
import { calculateNameValue, reduceToSingleDigit } from '../utils/chaldeanValues';

interface NameAnalysisProps {
  analysis: NameAnalysisType;
  originalFirstName: string;
  originalLastName: string;
  driver: number;
  conductor: number;
}

export const NameAnalysis: React.FC<NameAnalysisProps> = ({ analysis, originalFirstName, originalLastName, driver, conductor }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Edit3 className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">Name Spelling Analysis</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-2">
            {analysis.firstNameTotal || calculateNameValue(originalFirstName)} → {analysis.firstName}
          </div>
          <div className="text-sm font-semibold text-gray-700">First Name Value</div>
          {analysis.pairingAnalysis?.firstNamePairing && (
            <div className={`text-xs mt-2 px-2 py-1 rounded-full ${
              isForbiddenPairing(analysis.firstNameTotal || 0) || analysis.currentAnalysis?.firstName.isAntiToDriver || analysis.firstName === 4 || analysis.firstName === 8
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {isForbiddenPairing(analysis.firstNameTotal || 0) || analysis.currentAnalysis?.firstName.isAntiToDriver || analysis.firstName === 4 || analysis.firstName === 8
                ? 'Forbidden Pairing (Anti Numbers)'
                : (analysis.currentAnalysis?.firstName.pairingType || 'Good Pairing')}
            </div>
          )}
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {analysis.fullNameTotal || 0} → {analysis.fullName}
          </div>
          <div className="text-sm font-semibold text-gray-700">Full Name Value</div>
          <div className="text-xs text-gray-500 mt-1">Total → Reduced</div>
          {analysis.pairingAnalysis?.fullNamePairing && (
            <div className={`text-xs mt-2 px-2 py-1 rounded-full ${
              isForbiddenPairing(analysis.fullNameTotal || 0) || analysis.currentAnalysis?.fullName.isAntiToDriver || analysis.fullName === 4 || analysis.fullName === 8
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {isForbiddenPairing(analysis.fullNameTotal || 0) || analysis.currentAnalysis?.fullName.isAntiToDriver || analysis.fullName === 4 || analysis.fullName === 8
                ? 'Forbidden Pairing (Anti Numbers)'
                : (analysis.currentAnalysis?.fullName.pairingType || 'Good Pairing')}
            </div>
          )}
        </div>
      </div>

      <div className={`rounded-xl p-6 mb-6 ${
        analysis.isAuspicious 
          ? 'bg-green-50 border-2 border-green-200' 
          : 'bg-red-50 border-2 border-red-200'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          {analysis.isAuspicious ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600" />
          )}
          <h3 className="text-xl font-semibold text-gray-800">
            {analysis.isAuspicious ? 'Name is Auspicious!' : 'Name Needs Correction'}
          </h3>
        </div>
        
        {analysis.recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h4 className="font-semibold text-gray-700">Recommendations:</h4>
            </div>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {analysis.correctedNames && analysis.correctedNames.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Suggested Name Corrections ({analysis.correctedNames.length} options)
            {analysis.targetNumber && (
              <span className="text-sm font-normal text-green-700 ml-2">
                (Target: {analysis.targetNumber} - {getTargetDescription(analysis.targetNumber)})
              </span>
            )}
          </h3>
          
          <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Pairing Series Reference:</h4>
            <div className="text-sm text-green-700 space-y-1">
              <div><strong>Target {analysis.targetNumber} Series:</strong> {getTargetSeriesDescription(analysis.targetNumber)}</div>
              <div><strong>Method:</strong> Parent initials between names → Silent letters → Strategic placement</div>
              <div><strong>Rules:</strong> No 4/8 numbers, No anti-pairings, Pronunciation preserved</div>
              <div className="mt-2 text-blue-700"><strong>Master Stroke Formula Applied</strong></div>
            </div>
            <div className="text-xs text-green-600 mt-2 space-y-1">
              <div>✓ Master Stroke Formula: Target {analysis.targetNumber} ({getTargetDescription(analysis.targetNumber)})</div>
              <div>✓ Anti-number detection: Prevents forbidden combinations</div>
              <div>✓ Pronunciation preservation: Silent letters prioritized</div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analysis.correctedNames?.filter(name => name && typeof name === 'string').map((name, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                <div className="font-semibold text-green-800">{name}</div>
                {(() => {
                  // For corrected names, we need to parse them properly
                  // The format should be "CORRECTED_FIRST_NAME LAST_NAME"
                  // We need to identify where first name ends and last name begins
                  const nameParts = name.split(' ');
                  
                  // Ensure we have at least one part and handle edge cases
                  if (nameParts.length === 0) {
                    return <div className="text-sm text-red-600">Invalid name format</div>;
                  }
                  
                  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''; // Last word is surname
                  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0]; // Everything else is first name
                  
                  const firstNameTotal = calculateNameValue(firstName);
                  const lastNameTotal = calculateNameValue(lastName);
                  const fullNameTotal = calculateNameValue(name);
                  const firstNameReduced = reduceToSingleDigit(firstNameTotal);
                  const lastNameReduced = reduceToSingleDigit(lastNameTotal);
                  const fullNameReduced = reduceToSingleDigit(fullNameTotal);
                  
                  // Check for forbidden first name
                  const isFirstNameForbidden = firstNameReduced === 4 || firstNameReduced === 8 || 
                                              isForbiddenPairing(firstNameTotal);
                  
                  return (
                    <div className="text-sm space-y-1">
                      <div className={`${isFirstNameForbidden ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                        First: {firstName} = {firstNameTotal} → {firstNameReduced}
                        {isFirstNameForbidden && ' ❌ FORBIDDEN'}
                      </div>
                      {lastName && (
                        <div className="text-blue-600">
                          Last: {lastName} = {lastNameTotal} → {lastNameReduced}
                        </div>
                      )}
                      <div className="text-purple-600 font-semibold">
                        Total: {firstNameTotal} + {lastNameTotal} = {fullNameTotal} → {fullNameReduced}
                      </div>
                    </div>
                  );
                })()}
                <div className="text-xs mt-2">
                  {(() => {
                    const total = calculateNameValue(name);
                    const reduced = reduceToSingleDigit(total);
                    const series = getPairingType(total);
                    const isCompatible = isCompatibleWithDriverConductor(reduced, driver, conductor);
                    return (
                      <span className={`px-2 py-1 rounded-full ${isCompatible ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {isCompatible ? '✓ Master Stroke' : '❌ Conflict'} {series}
                      </span>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {analysis.correctedNames && analysis.correctedNames.length === 0 && !analysis.isAuspicious && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-yellow-800 mb-4">
            No Compatible Corrections Found
          </h3>
          <p className="text-yellow-700 mb-4">
            The current Driver-Conductor combination makes it challenging to find compatible name corrections. 
            This may be due to:
          </p>
          <ul className="text-yellow-700 space-y-2 mb-4">
            <li>• Driver-Conductor combination has low compatibility rating</li>
            <li>• Anti-number relationships preventing safe corrections</li>
            <li>• Limited safe pairing options for your numerological profile</li>
          </ul>
          <p className="text-yellow-700 text-sm">
            Consider consulting with a numerology expert for personalized guidance.
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to check if a pairing is forbidden
const isForbiddenPairing = (total: number): boolean => {
  // Check if total reduces to 4 or 8
  const reduced = reduceToSingleDigit(total);
  if (reduced === 4 || reduced === 8) {
    return true;
  }
  
  // Check if it's an anti-pairing (like 28, 18, 36, etc.)
  const digits = total.toString().split('').map(Number);
  if (digits.length === 2) {
    const [first, second] = digits;
    // Anti-number relationships
    const antiNumbers: Record<number, number[]> = {
      1: [8], 2: [4, 8, 9], 3: [6], 4: [2, 8, 9], 5: [], 6: [3], 7: [], 8: [1, 2, 4], 9: [2, 4]
    };
    // Check if first digit is anti to second digit
    if (antiNumbers[first]?.includes(second) || antiNumbers[second]?.includes(first)) {
      return true;
    }
  }
  
  return false;
};

const getDriverConductorDescription = (analysis: NameAnalysisType): string => {
  return 'Master Stroke Formula - 81 compatibility combinations analyzed';
};

const getTargetSeriesDescription = (targetNumber: number): string => {
  const series = {
    1: '10, 19, 37, 55, 46',
    3: '12, 21, 39, 57, 30', 
    5: '14, 41, 50, 32, 23, 59',
    6: '42, 51, 24, 33, 60'
  };
  return series[targetNumber as keyof typeof series] || 'Auspicious series';
};

const getPairingType = (total: number): string => {
  if ([10, 19, 37, 55, 46].includes(total)) return 'Number 1 Series (Sun)';
  if ([14, 41, 50, 32, 23, 59].includes(total)) return 'Number 5 Series (Mercury)';
  if ([42, 51, 24, 33, 60].includes(total)) return 'Number 6 Series (Venus)';
  if ([12, 21, 39, 57, 30].includes(total)) return 'Number 3 Series (Jupiter)';
  return 'Standard Pairing';
};

const isCompatibleWithDriverConductor = (nameNumber: number, driver: number, conductor: number): boolean => {
  // Simplified compatibility check - in real implementation this would use the full engine
  const antiNumbers = {
    1: [8], 2: [4, 8, 9], 3: [6], 4: [2, 8, 9], 5: [], 6: [3], 7: [], 8: [1, 2, 4], 9: [2, 4]
  };
  
  const antiToDriver = antiNumbers[nameNumber]?.includes(driver) || false;
  const antiToConductor = antiNumbers[nameNumber]?.includes(conductor) || false;
  
  return !antiToDriver && !antiToConductor;
};

const getTargetDescription = (targetNumber: number): string => {
  switch (targetNumber) {
    case 1: return 'Sun - Leadership & Authority';
    case 3: return 'Jupiter - Education & Spirituality';
    case 5: return 'Mercury - Communication & Business';
    case 6: return 'Venus - Luxury & Creativity';
    default: return 'Auspicious Number';
  }
};
import React from 'react';
import { NumerologyCalculation, PersonData } from '../types/numerology';
import { Calculator, Grid3x3, Star, TrendingUp } from 'lucide-react';

interface NumerologyResultsProps {
  person: PersonData;
  calculation: NumerologyCalculation;
}

export const NumerologyResults: React.FC<NumerologyResultsProps> = ({ person, calculation }) => {
  const renderLoshuGrid = () => {
    const gridLabels = [
      [4, 9, 2],
      [3, 5, 7],
      [8, 1, 6]
    ];

    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-purple-600" />
          Lo Shu Grid Analysis
        </h3>
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
          {gridLabels.map((row, rowIndex) =>
            row.map((label, colIndex) => {
              const count = calculation.loshuGrid[rowIndex][colIndex];
              const isPresent = count > 0;
              const isMissing = count === 0;
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-20 h-20 rounded-lg border-2 flex flex-col items-center justify-center text-sm font-bold ${
                    isPresent
                      ? 'bg-green-100 border-green-400 text-green-800 shadow-md' 
                      : 'bg-red-100 border-red-300 text-red-600'
                  }`}
                >
                  <div className={`text-sm font-bold ${isPresent ? 'text-green-700' : 'text-red-500'} text-center leading-tight`}>
                    {isPresent ? Array(count).fill(label).join(' ') : 'X'}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Driver: {calculation.driver} | Conductor: {calculation.conductor} | Kua: {calculation.kua}</p>
          <p className="text-xs mt-2">Numbers from birth date + Driver + Conductor + Kua (3 lotteries)</p>
          <p className="text-xs">Green boxes show repeated numbers from birth date + lotteries, Red X shows missing numbers</p>
          <div className="mt-3 flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-400 rounded"></div>
              Present Numbers
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
              Missing Numbers
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderPlaneAnalysis = () => {
    const planes = [
      { name: 'Mental Plane (4,9,2)', values: calculation.planes.mental, description: 'Memory & Intelligence' },
      { name: 'Thought Plane (4,3,8)', values: calculation.planes.thought, description: 'Visualization Power' },
      { name: 'Will Plane (9,5,1)', values: calculation.planes.will, description: 'Will Power & Adaptability' },
      { name: 'Action Plane (2,7,6)', values: calculation.planes.action, description: 'Quick Action & Approach' },
      { name: 'Practical Plane (8,1,6)', values: calculation.planes.practical, description: 'Practical Approach' },
      { name: 'Emotional Plane (3,5,7)', values: calculation.planes.emotional, description: 'Emotional Nature' },
      { name: 'Success Plane 1 (4,5,6)', values: calculation.planes.success1, description: 'Raj Yoga - Progress' },
      { name: 'Success Plane 2 (2,5,8)', values: calculation.planes.success2, description: 'Earth Element - Property' }
    ];

    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Plane Analysis (Yogas)</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {planes.map((plane, index) => {
            const isActive = plane.values.every(val => val > 0);
            const activeCount = plane.values.filter(val => val > 0).length;
            const totalNumbers = plane.values.reduce((sum, val) => sum + val, 0);
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  isActive 
                    ? 'bg-green-100 border-green-400 text-green-800 shadow-md' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              >
                <div className="font-semibold text-sm">{plane.name}</div>
                <div className="text-xs mt-1">{plane.description}</div>
                <div className="flex gap-1 mt-2">
                  {plane.values.map((val, i) => (
                    <span key={i} className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                      val > 0 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-600'
                    }`}>
                      {val > 0 ? val : 'X'}
                    </span>
                  ))}
                </div>
                {isActive && (
                  <div className="text-xs mt-2 font-bold text-green-700">
                    ✓ YOGA ACTIVE - Total Numbers: {totalNumbers}
                  </div>
                )}
                {!isActive && activeCount > 0 && (
                  <div className="text-xs mt-2 text-amber-600">
                    Partial ({activeCount}/3 numbers present)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">
          Numerology Analysis for {person.name} {person.surname}
        </h2>
      </div>

      {/* Core Numbers */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-2">{calculation.driver}</div>
          <div className="text-sm font-semibold text-gray-700">Driver Number</div>
          <div className="text-xs text-gray-500 mt-1">(Moolank)</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{calculation.conductor}</div>
          <div className="text-sm font-semibold text-gray-700">Conductor Number</div>
          <div className="text-xs text-gray-500 mt-1">(Bhagyank)</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{calculation.kua}</div>
          <div className="text-sm font-semibold text-gray-700">Kua Number</div>
          <div className="text-xs text-gray-500 mt-1">(Direction Energy)</div>
        </div>
      </div>

      {/* Compatibility Analysis */}
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-amber-600" />
          <h3 className="text-xl font-semibold text-gray-800">Driver-Conductor Compatibility</h3>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= calculation.compatibility.rating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-lg font-semibold text-gray-700">
            {calculation.compatibility.rating}/5 Stars
          </span>
        </div>
        <p className="text-gray-700 mb-3">{calculation.compatibility.description}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-600">Best Professions:</span>
          {calculation.compatibility.profession.map((prof, index) => (
            <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
              {prof}
            </span>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {renderLoshuGrid()}
        {renderPlaneAnalysis()}
      </div>
    </div>
  );
};
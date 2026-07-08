import React, { useState } from 'react';
import { BabyNameSuggestion } from '../types/numerology';
import { Baby, Heart, Star, Sparkles } from 'lucide-react';
import { CHALDEAN_VALUES, calculateCompoundAndSingleDigit } from '../utils/chaldeanValues';

interface BabyNameSuggestionsProps {
  suggestions: BabyNameSuggestion[];
  gender: 'male' | 'female';
  religion: string;
  driver: number;
  conductor: number;
  providedName?: string;
  providedLastName?: string;
}

export const BabyNameSuggestions: React.FC<BabyNameSuggestionsProps> = ({
  suggestions,
  gender,
  religion,
  driver,
  conductor,
  providedName,
  providedLastName
}) => {

  const getCompatibilityColor = (compatibility: string) => {
    switch (compatibility) {
      case 'Perfect Match': return 'text-green-600 bg-green-100';
      case 'Driver/Conductor Match': return 'text-blue-600 bg-blue-100';
      case 'Highly Favorable': return 'text-blue-600 bg-blue-100';
      case 'Good': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getNameNumerology = (name: string): string => {
    const { compound, single } = calculateCompoundAndSingleDigit(name);
    return compound > 9 ? `${compound}→${single}` : `${single}`;
  };

  const getNumerologyTraits = (number: number): string => {
    const traits: { [key: number]: string } = {
      1: 'Leadership, independence, and pioneering spirit. Natural born leaders with strong willpower.',
      2: 'Cooperation, diplomacy, and harmony. Excellent at building relationships and partnerships.',
      3: 'Creativity, expression, and optimism. Gifted communicators with artistic talents.',
      4: 'Stability, hard work, and practicality. Reliable and organized with strong foundations.',
      5: 'Freedom, adventure, and versatility. Dynamic personalities who embrace change.',
      6: 'Responsibility, nurturing, and balance. Natural caregivers with strong family values.',
      7: 'Wisdom, spirituality, and analysis. Deep thinkers with intuitive abilities.',
      8: 'Ambition, success, and material abundance. Natural business acumen and authority.',
      9: 'Compassion, humanitarianism, and completion. Old souls with universal consciousness.'
    };
    return traits[number] || 'Unique numerological influence with special attributes.';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <Baby className="w-6 h-6 text-pink-600" />
        <h2 className="text-2xl font-bold text-gray-800">
          Baby {gender === 'male' ? 'Boy' : 'Girl'} Names
        </h2>
        <Sparkles className="w-5 h-5 text-yellow-500" />
      </div>

      <div className="mb-4 text-center">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-4">
          <h3 className="text-lg font-semibold text-indigo-800 mb-2">Name Suggestions Based on Your Numeroscope</h3>
          <p className="text-sm text-indigo-700">
            Names are suggested to fill missing numbers and strengthen your Lo Shu grid planes.
            Focus on numbers 1, 3, 5, 6 for maximum auspiciousness.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {providedName && (
            <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              Analyzing: {providedName}
            </span>
          )}
          {providedLastName && (
            <span className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium">
              Last Name: {providedLastName.toUpperCase()}
            </span>
          )}
          <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
            {religion.charAt(0).toUpperCase() + religion.slice(1)} Names for {gender === 'male' ? 'Boys' : 'Girls'}
          </span>
          <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            Driver: {driver} | Conductor: {conductor}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {suggestions.map((suggestion) => (
          <div
            key={`${suggestion.name}-${suggestion.numerologyValue}`}
            className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all hover:border-blue-300 hover:shadow-blue-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold flex flex-wrap items-baseline gap-2">
                  <span className="text-gray-800 whitespace-nowrap">{suggestion.name.replace(/\d+$/g, '')}</span>
                  {providedLastName && <span className="text-blue-600 whitespace-nowrap">{providedLastName.charAt(0).toUpperCase() + providedLastName.slice(1).toLowerCase()}</span>}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {suggestion.meaning && suggestion.meaning !== 'Strong'
                    ? suggestion.meaning
                    : `${gender === 'male' ? 'Boy' : 'Girl'} name from ${religion} origin`}
                </p>
              </div>
              <button
                className="p-2 rounded-lg transition-all flex-shrink-0 bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>

            {providedLastName && suggestion.combinedTotal ? (
              <div className="mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 font-medium">First Name:</span>
                    <span className="text-sm font-bold text-gray-900">{suggestion.firstNameTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 font-medium">Last Name:</span>
                    <span className="text-sm font-bold text-gray-900">{suggestion.lastNameTotal}</span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent my-2"></div>
                  <div className="flex justify-between items-center bg-white rounded-md p-2 shadow-sm">
                    <span className="text-xs font-bold text-purple-700">Numerology:</span>
                    <span className="text-base font-bold text-purple-600">
                      {suggestion.combinedTotal}→{suggestion.combinedReduced}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-gray-600 font-medium">Match:</span>
                    <span className="text-sm font-bold text-green-600">
                      {suggestion.compatibilityPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-3 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-purple-700">Numerology:</span>
                  <span className="text-base font-bold text-purple-600">{getNameNumerology(suggestion.name)}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg mb-3">
              {suggestion.explanation || getNumerologyTraits(suggestion.combinedReduced || suggestion.numerologyValue)}
            </p>

            <div className="pt-3 border-t border-gray-200 flex items-center justify-center">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCompatibilityColor(suggestion.compatibility)}`}>
                {suggestion.compatibility}
              </span>
            </div>
          </div>
        ))}
      </div>

      {suggestions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Baby className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-600">
            {providedName 
              ? `Analyzing provided name: ${providedName}. Generating corrections...`
              : 'No auspicious names found for current numerological parameters.'
            }
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Names targeting missing numbers (1, 3, 5, 6) and compatible with Driver ({driver}) & Conductor ({conductor}).
          </p>
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { NumerologyLogo } from './NumerologyLogo';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white py-8 shadow-2xl">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center mb-4">
          <NumerologyLogo size="xl" variant="light" showText={false} />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent ml-3">
            AskNameAI
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-indigo-100 mb-2">
          Chaldean Numerology Name Correction System
        </p>
        <p className="text-lg text-indigo-200 max-w-2xl mx-auto">
          Discover your perfect name through ancient Chaldean numerology and Lo Shu grid analysis.
          Transform your destiny with scientifically calculated name corrections.
        </p>
      </div>
    </header>
  );
};

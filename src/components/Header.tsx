import React from 'react';
import { Star, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white py-8 shadow-2xl">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-8 h-8 text-yellow-400" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            AskNameAI
          </h1>
          <Star className="w-8 h-8 text-yellow-400" />
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
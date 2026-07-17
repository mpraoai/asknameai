import React from 'react';
import { Grid3x3, Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showText?: boolean;
  onClick?: () => void;
}

const sizeMap = {
  sm: { icon: 'w-5 h-5', grid: 'w-3.5 h-3.5', text: 'text-lg', spark: 'w-3 h-3' },
  md: { icon: 'w-7 h-7', grid: 'w-5 h-5', text: 'text-2xl', spark: 'w-3.5 h-3.5' },
  lg: { icon: 'w-8 h-8', grid: 'w-6 h-6', text: 'text-3xl', spark: 'w-4 h-4' },
  xl: { icon: 'w-12 h-12', grid: 'w-9 h-9', text: 'text-5xl', spark: 'w-6 h-6' },
};

export const NumerologyLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'dark',
  showText = true,
  onClick,
}) => {
  const s = sizeMap[size];
  const accentColor = variant === 'light' ? 'text-yellow-400' : 'text-indigo-600';
  const textColor = variant === 'light' ? 'text-white' : 'text-gray-800';
  const subColor = variant === 'light' ? 'text-yellow-400' : 'text-indigo-500';

  return (
    <div
      className={`flex items-center gap-2 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Numerology-specific icon: Lo Shu Grid + Star = numerological calculation */}
      <div className="relative flex items-center justify-center">
        <div className={`relative ${s.icon} flex items-center justify-center`}>
          <Grid3x3 className={`${s.grid} ${accentColor}`} strokeWidth={2.5} />
          <Sparkles className={`${s.spark} ${variant === 'light' ? 'text-orange-400' : 'text-purple-500'} absolute -top-1 -right-1`} />
        </div>
      </div>
      {showText && (
        <span className={`${s.text} font-bold ${textColor} tracking-tight`}>
          AskName<span className={subColor}>AI</span>
        </span>
      )}
    </div>
  );
};

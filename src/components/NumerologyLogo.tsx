import React from 'react';

interface NumerologyLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showText?: boolean;
  onClick?: () => void;
}

export const NumerologyLogo: React.FC<NumerologyLogoProps> = ({
  size = 'md',
  variant = 'light',
  showText = true,
  onClick,
}) => {
  const dimensions = {
    sm: { box: 'w-8 h-8', text: 'text-lg', icon: 18 },
    md: { box: 'w-10 h-10', text: 'text-xl', icon: 24 },
    lg: { box: 'w-14 h-14', text: 'text-2xl', icon: 32 },
  };

  const d = dimensions[size];
  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900';
  const subColor = variant === 'light' ? 'text-indigo-200' : 'text-indigo-600';

  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={onClick}>
      <div className={`${d.box} rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-700 flex items-center justify-center shadow-lg`}>
        <svg width={d.icon} height={d.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinejoin="round" opacity="0.7" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${d.text} font-bold ${textColor}`}>AskName<span className="text-indigo-400">AI</span></span>
          <span className={`text-[10px] ${subColor}`}>AI-Powered Numerology</span>
        </div>
      )}
    </div>
  );
};

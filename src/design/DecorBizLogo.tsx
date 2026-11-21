import React from 'react';

export interface DecorBizLogoProps {
  variant?: 'light' | 'dark' | 'symbol' | 'compact' | 'primary';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const DecorBizLogo: React.FC<DecorBizLogoProps> = ({
  variant = 'primary',
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const sizeMap = {
    sm: {
      text: 'text-base font-bold',
      tagline: 'text-[8px]',
      gap: 'gap-2',
      iconSize: 24,
    },
    md: {
      text: 'text-xl font-bold',
      tagline: 'text-[9.5px]',
      gap: 'gap-2.5',
      iconSize: 32,
    },
    lg: {
      text: 'text-2xl font-bold',
      tagline: 'text-[11px]',
      gap: 'gap-3',
      iconSize: 40,
    },
    xl: {
      text: 'text-3xl font-bold',
      tagline: 'text-xs',
      gap: 'gap-3.5',
      iconSize: 52,
    },
  }[size];

  const isLightText = variant === 'light' || variant === 'dark';
  const textColor = isLightText ? 'text-white' : 'text-[#1F4D3A]';

  return (
    <div className={`flex items-center ${sizeMap.gap} select-none ${className}`}>
      {/* Tile & Sanitary Brand Icon */}
      <div
        className="flex items-center justify-center rounded-lg bg-[#1F4D3A] text-[#C4A574] shadow-sm flex-shrink-0"
        style={{ width: sizeMap.iconSize, height: sizeMap.iconSize }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3/5 h-3/5"
        >
          <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" fillOpacity="0.2" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" fill="currentColor" fillOpacity="0.2" />
        </svg>
      </div>

      {variant !== 'symbol' && (
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <span className={`tracking-tight ${textColor} ${sizeMap.text}`}>
              Decor<span className="text-[#C4A574]">Biz</span>
            </span>
          </div>
          {showTagline && (
            <span className={`font-medium tracking-wide uppercase ${isLightText ? 'text-stone-300' : 'text-stone-500'} ${sizeMap.tagline}`}>
              Tiles & Bath ERP
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DecorBizLogo;

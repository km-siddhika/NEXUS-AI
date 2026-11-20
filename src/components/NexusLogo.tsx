import React from 'react';

interface NexusLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

export function NexusLogo({ size = 'md', showWordmark = true, className = '' }: NexusLogoProps) {
  const dim = size === 'sm' ? 26 : size === 'lg' ? 36 : 30;
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none ${className}`}>
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="36" height="36" rx="10" fill="#7955E8" />
        {/* Minimal geometric N-shaped interlocking mark */}
        <path
          d="M10.5 25.5V10.5L18.2 19.6L25.5 10.5V25.5"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.5 25.5L18.2 16.4L25.5 25.5"
          stroke="#EEE8FF"
          strokeOpacity="0.65"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="25.5" cy="10.5" r="2.1" fill="#63CBEA" />
      </svg>
      {showWordmark && (
        <span className={`font-display font-bold tracking-tight text-[#171725] dark:text-[#F4F4FA] ${textSize}`}>
          NEXUS <span className="text-[#7955E8]">AI</span>
        </span>
      )}
    </span>
  );
}

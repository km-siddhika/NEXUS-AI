import React from 'react';
import type { ProjectCoverTheme, ProjectDomain } from '../types/nexus';

const THEME_PALETTES: Record<
  ProjectCoverTheme,
  { bg: string; darkBg: string; primary: string; secondary: string; tertiary: string }
> = {
  lavender: {
    bg: '#EEE8FF',
    darkBg: '#231D3A',
    primary: '#7955E8',
    secondary: '#F47BA7',
    tertiary: '#63CBEA',
  },
  coral: {
    bg: '#FFF0EA',
    darkBg: '#2F1F1D',
    primary: '#FF895E',
    secondary: '#7955E8',
    tertiary: '#F47BA7',
  },
  cyan: {
    bg: '#E8F7FC',
    darkBg: '#192935',
    primary: '#63CBEA',
    secondary: '#7955E8',
    tertiary: '#FF895E',
  },
  rose: {
    bg: '#FDEBF2',
    darkBg: '#311C28',
    primary: '#F47BA7',
    secondary: '#7955E8',
    tertiary: '#63CBEA',
  },
  mint: {
    bg: '#EBF8F3',
    darkBg: '#182A24',
    primary: '#2EA87E',
    secondary: '#63CBEA',
    tertiary: '#7955E8',
  },
  amber: {
    bg: '#FFF6E6',
    darkBg: '#2F2618',
    primary: '#E5953B',
    secondary: '#FF895E',
    tertiary: '#7955E8',
  },
};

export function ProjectCoverIllustration({
  theme = 'lavender',
  domain,
  className = '',
}: {
  theme?: ProjectCoverTheme;
  domain?: ProjectDomain;
  className?: string;
}) {
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.lavender;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#ECECF2] dark:border-[#23263A] ${className}`}
      style={{ backgroundColor: palette.bg }}
      aria-label={domain ? `${domain} project visual` : 'Project visual'}
    >
      <div className="hidden dark:block absolute inset-0" style={{ backgroundColor: palette.darkBg }} />
      <svg
        viewBox="0 0 360 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full h-full block"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Subtle architectural grid lines */}
        <path
          d="M0 45H360M0 90H360M0 135H360M90 0V180M180 0V180M270 0V180"
          stroke={palette.primary}
          strokeOpacity="0.08"
          strokeWidth="1"
        />
        {/* Layered isometric planes */}
        <rect
          x="36"
          y="34"
          width="116"
          height="112"
          rx="18"
          fill="#FFFFFF"
          fillOpacity="0.72"
          stroke={palette.primary}
          strokeOpacity="0.16"
        />
        <rect
          x="52"
          y="52"
          width="54"
          height="10"
          rx="5"
          fill={palette.primary}
          fillOpacity="0.75"
        />
        <rect
          x="52"
          y="72"
          width="82"
          height="7"
          rx="3.5"
          fill={palette.primary}
          fillOpacity="0.22"
        />
        <rect
          x="52"
          y="87"
          width="68"
          height="7"
          rx="3.5"
          fill={palette.primary}
          fillOpacity="0.18"
        />
        <circle cx="64" cy="119" r="11" fill={palette.secondary} fillOpacity="0.85" />
        <circle cx="90" cy="119" r="11" fill={palette.tertiary} fillOpacity="0.85" />

        {/* Right modular geometric node cluster */}
        <path
          d="M214 58L268 34L322 58V118L268 142L214 118V58Z"
          fill={palette.primary}
          fillOpacity="0.15"
          stroke={palette.primary}
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
        <path
          d="M268 34V142M214 58L268 84L322 58"
          stroke={palette.primary}
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
        <circle cx="268" cy="84" r="14" fill={palette.primary} />
        <circle cx="268" cy="84" r="5" fill="#FFFFFF" />
        <circle cx="214" cy="58" r="5" fill={palette.secondary} />
        <circle cx="322" cy="118" r="5" fill={palette.tertiary} />

        {/* Connecting vector bridge */}
        <path
          d="M152 90C178 90 186 72 214 72"
          stroke={palette.primary}
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>
    </div>
  );
}

export function HeroWorkspaceVisual() {
  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-[440px] rounded-2xl bg-[#FFFFFF] dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-[0_24px_60px_-24px_rgba(23,23,37,0.12)]">
      {/* Soft geometric backdrop */}
      <svg
        viewBox="0 0 560 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
        aria-hidden="true"
      >
        <circle cx="460" cy="72" r="110" fill="#EEE8FF" className="dark:opacity-15" />
        <circle cx="96" cy="370" r="120" fill="#E8F7FC" className="dark:opacity-10" />
        <path
          d="M40 160H520M40 280H520M180 30V410M380 30V410"
          stroke="#ECECF2"
          className="dark:stroke-[#23263A]"
          strokeWidth="1"
        />
      </svg>

      {/* Top row: Problem Node -> Solution Architecture */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
        <div className="sm:col-span-7 rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45] p-4 animate-nexus-float">
          <div className="flex items-center justify-between text-xs text-[#777789] dark:text-[#9C9DB2] mb-2">
            <span>Problem Brief</span>
            <span>Environment · Active</span>
          </div>
          <p className="font-display font-semibold text-sm text-[#171725] dark:text-[#F4F4FA] leading-snug">
            Urban Heat-Island Microclimate Mesh
          </p>
          <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-1.5 leading-relaxed">
            Block-level thermal sensing & shade routing for dense transit corridors.
          </p>
          <div className="mt-3 pt-3 border-t border-[#ECECF2] dark:border-[#2A2E45] flex items-center justify-between text-xs">
            <span className="text-[#7955E8] font-medium">3 Solution Pathways</span>
            <span className="font-mono tabular-nums text-[#171725] dark:text-[#F4F4FA]">68%</span>
          </div>
        </div>

        <div className="sm:col-span-5 rounded-xl bg-[#EEE8FF] dark:bg-[#251E42] border border-[#7955E8]/20 p-4 animate-nexus-float-delayed">
          <div className="text-xs text-[#7955E8] dark:text-[#B69EFF] font-medium mb-1">
            AI Synthesis
          </div>
          <p className="font-display font-semibold text-xs text-[#171725] dark:text-[#F4F4FA]">
            Solar LoRaWAN Mesh
          </p>
          <p className="text-[11px] text-[#777789] dark:text-[#B8B9CC] mt-1">
            Est. Complexity: Medium · Community Pharmacy Gateways
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/70 dark:bg-white/10 overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-[#7955E8]" />
          </div>
        </div>
      </div>

      {/* Center geometric node connector */}
      <div className="relative z-10 my-4 flex items-center justify-center">
        <div className="w-full flex items-center gap-3">
          <div className="h-px flex-1 bg-[#ECECF2] dark:bg-[#2A2E45]" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFFFFF] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45] text-xs font-medium text-[#171725] dark:text-[#F4F4FA]">
            <span className="w-2 h-2 rounded-sm bg-[#7955E8]" />
            <span>Discover</span>
            <span className="text-[#777789]">→</span>
            <span className="w-2 h-2 rounded-sm bg-[#63CBEA]" />
            <span>Compare</span>
            <span className="text-[#777789]">→</span>
            <span className="w-2 h-2 rounded-sm bg-[#FF895E]" />
            <span>Ship</span>
          </div>
          <div className="h-px flex-1 bg-[#ECECF2] dark:bg-[#2A2E45]" />
        </div>
      </div>

      {/* Bottom row: Roadmap & Pitch Card */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
        <div className="sm:col-span-5 rounded-xl bg-[#FFF4EF] dark:bg-[#2B1E1B] border border-[#FF895E]/25 p-4">
          <div className="text-xs font-medium text-[#C85A32] dark:text-[#FF9F7A]">
            Execution Roadmap
          </div>
          <div className="mt-2 space-y-2 text-xs text-[#171725] dark:text-[#F4F4FA]">
            <div className="flex items-center justify-between">
              <span>01. Shield Calibration</span>
              <span className="font-mono text-[11px] text-[#777789]">Done</span>
            </div>
            <div className="flex items-center justify-between">
              <span>02. Gateway Mesh</span>
              <span className="font-mono text-[11px] text-[#7955E8]">Active</span>
            </div>
          </div>
        </div>

        <div className="sm:col-span-7 rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45] p-4">
          <div className="flex items-center justify-between text-xs text-[#777789] dark:text-[#9C9DB2]">
            <span>Pitch Outline Ready</span>
            <span>9 Sections</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#2A2E45] p-2">
              <div className="w-6 h-1 rounded-full bg-[#7955E8] mb-1.5" />
              <div className="text-[11px] font-medium text-[#171725] dark:text-[#F4F4FA]">Problem</div>
            </div>
            <div className="rounded-lg bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#2A2E45] p-2">
              <div className="w-6 h-1 rounded-full bg-[#63CBEA] mb-1.5" />
              <div className="text-[11px] font-medium text-[#171725] dark:text-[#F4F4FA]">Stack</div>
            </div>
            <div className="rounded-lg bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#2A2E45] p-2">
              <div className="w-6 h-1 rounded-full bg-[#F47BA7] mb-1.5" />
              <div className="text-[11px] font-medium text-[#171725] dark:text-[#F4F4FA]">Impact</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthGeometricIllustration() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#1F2033] p-6">
      <svg
        viewBox="0 0 420 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="nxGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7955E8" />
            <stop offset="100%" stopColor="#63CBEA" />
          </linearGradient>
        </defs>
        <path
          d="M0 55H420M0 110H420M0 165H420M105 0V220M210 0V220M315 0V220"
          stroke="#FFFFFF"
          strokeOpacity="0.06"
        />
        <rect x="34" y="34" width="144" height="152" rx="16" fill="#2A2B45" stroke="#7955E8" strokeOpacity="0.4" />
        <rect x="52" y="54" width="70" height="10" rx="5" fill="#7955E8" />
        <rect x="52" y="74" width="108" height="8" rx="4" fill="#FFFFFF" fillOpacity="0.18" />
        <rect x="52" y="90" width="90" height="8" rx="4" fill="#FFFFFF" fillOpacity="0.12" />
        <rect x="52" y="122" width="108" height="44" rx="10" fill="#171725" />
        <circle cx="74" cy="144" r="9" fill="#F47BA7" />
        <rect x="92" y="139" width="52" height="10" rx="5" fill="#EEE8FF" fillOpacity="0.45" />

        <path
          d="M228 60L302 28L376 60V146L302 178L228 146V60Z"
          fill="url(#nxGrad1)"
          fillOpacity="0.22"
          stroke="#63CBEA"
          strokeOpacity="0.6"
          strokeWidth="1.5"
        />
        <path
          d="M302 28V178M228 60L302 96L376 60"
          stroke="#EEE8FF"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
        <circle cx="302" cy="96" r="14" fill="#7955E8" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M178 110H228" stroke="#FF895E" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    </div>
  );
}

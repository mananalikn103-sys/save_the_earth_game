import React from 'react';

interface GameLogoProps {
  compact?: boolean;
}

export const GameLogo: React.FC<GameLogoProps> = ({ compact = false }) => {
  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${
        compact ? 'scale-90' : 'scale-100'
      }`}
    >
      {/* Decorative leaves behind title */}
      <svg
        width="320"
        height="136"
        viewBox="0 0 320 136"
        className="w-[260px] sm:w-[320px] h-auto overflow-visible drop-shadow-[0_8px_12px_rgba(0,0,0,0.35)]"
        aria-label="Save The Earth"
      >
        <defs>
          <linearGradient id="saveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="55%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="earthWordGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="45%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
        </defs>

        {/* Left & Right Leaf Accents */}
        <path
          d="M28 78 C8 60, 14 34, 42 46 C50 56, 46 72, 28 78 Z"
          fill="#22c55e"
          stroke="#052e16"
          strokeWidth="3.5"
        />
        <path
          d="M284 74 C308 58, 304 32, 276 42 C266 52, 270 68, 284 74 Z"
          fill="#22c55e"
          stroke="#052e16"
          strokeWidth="3.5"
        />

        {/* Top Line: Save The */}
        <text
          x="148"
          y="56"
          textAnchor="middle"
          fontFamily="Fredoka, sans-serif"
          fontWeight="700"
          fontSize="46"
          fill="url(#saveGrad)"
          stroke="#422006"
          strokeWidth="9"
          paintOrder="stroke"
          letterSpacing="1"
        >
          Save The
        </text>

        {/* Tiny Earth Badge on top right of "The" */}
        <g transform="translate(262, 28)">
          <circle cx="0" cy="0" r="16" fill="#2596f5" stroke="#0f172a" strokeWidth="3.5" />
          <path d="M-8 -6 C-2 -11, 6 -7, 4 0 C2 6, -7 4, -8 -6 Z" fill="#4ade80" />
          <path d="M3 5 C9 3, 12 9, 6 12 C2 13, 0 8, 3 5 Z" fill="#4ade80" />
        </g>

        {/* Bottom Line: Earth */}
        <text
          x="160"
          y="114"
          textAnchor="middle"
          fontFamily="Fredoka, sans-serif"
          fontWeight="700"
          fontSize="68"
          fill="url(#earthWordGrad)"
          stroke="#052e16"
          strokeWidth="12"
          paintOrder="stroke"
          letterSpacing="1.5"
        >
          Earth
        </text>
      </svg>
    </div>
  );
};

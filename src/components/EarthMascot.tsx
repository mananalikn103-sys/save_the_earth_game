import React, { useEffect, useState } from 'react';
import { USER_EARTH_IMG, loadTransparentSprite } from '../utils/spriteLoader';

interface EarthMascotProps {
  size?: number;
  mood?: 'happy' | 'worried' | 'stung' | 'cheer';
  skinId?: string;
  oceanColor?: string;
  landColor?: string;
  showHands?: boolean;
  className?: string;
}

export const EarthMascot: React.FC<EarthMascotProps> = ({
  size = 180,
  mood = 'happy',
  skinId = 'classic',
  oceanColor = '#2596f5',
  landColor = '#4ade38',
  showHands = true,
  className = '',
}) => {
  const [spriteUrl, setSpriteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (skinId !== 'classic') return;
    let mounted = true;
    loadTransparentSprite(USER_EARTH_IMG).then((res) => {
      if (mounted) setSpriteUrl(res.dataUrl);
    });
    return () => {
      mounted = false;
    };
  }, [skinId]);

  if (skinId === 'classic' && spriteUrl) {
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={spriteUrl}
          alt="Save The Earth Character"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.3)] ${
            mood === 'stung' ? 'grayscale-[25%] brightness-90 rotate-6' : ''
          }`}
        />
        {mood === 'stung' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-display font-black text-red-600 text-2xl bg-white/85 px-2 py-0.5 rounded-full border-2 border-red-600 shadow">
              Ouch!
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Save The Earth Mascot"
    >
      <defs>
        <radialGradient id={`earthOceanGrad-${skinId}`} cx="38%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="45%" stopColor={oceanColor} />
          <stop offset="100%" stopColor="#1458a8" />
        </radialGradient>
        <clipPath id={`earthSphereClip-${skinId}`}>
          <circle cx="110" cy="110" r="76" />
        </clipPath>
      </defs>

      {showHands && (
        <g>
          <path
            d="M42 134 C22 132, 16 148, 28 158 C34 163, 44 160, 48 152"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M178 134 C196 132, 204 114, 198 100 C194 92, 185 95, 184 108 L175 112"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      <circle
        cx="110"
        cy="110"
        r="76"
        fill={`url(#earthOceanGrad-${skinId})`}
        stroke="#0f2942"
        strokeWidth="5"
      />

      <g clipPath={`url(#earthSphereClip-${skinId})`}>
        <path
          d="M36 68 C52 44, 92 38, 104 54 C112 66, 94 82, 74 84 C54 86, 48 108, 30 98 Z"
          fill={landColor}
          stroke="#15803d"
          strokeWidth="2.5"
        />
        <path
          d="M126 36 C154 38, 184 62, 178 88 C172 104, 150 96, 138 82 C126 70, 114 48, 126 36 Z"
          fill={landColor}
          stroke="#15803d"
          strokeWidth="2.5"
        />
        <path
          d="M38 148 C56 140, 74 156, 70 176 C64 192, 38 186, 32 168 Z"
          fill={landColor}
          stroke="#15803d"
          strokeWidth="2.5"
        />
        <path
          d="M140 144 C158 134, 184 146, 182 172 C178 190, 144 192, 134 172 C128 160, 130 150, 140 144 Z"
          fill={landColor}
          stroke="#15803d"
          strokeWidth="2.5"
        />
        <path
          d="M52 72 C64 46, 98 38, 126 42"
          stroke="#ffffff"
          strokeOpacity="0.45"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </g>

      <ellipse cx="64" cy="126" rx="10" ry="6" fill="#fb7185" fillOpacity="0.55" />
      <ellipse cx="156" cy="126" rx="10" ry="6" fill="#fb7185" fillOpacity="0.55" />

      {mood === 'stung' ? (
        <g stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round">
          <path d="M71 98 L89 112 M89 98 L71 112" />
          <path d="M131 98 L149 112 M149 98 L131 112" />
        </g>
      ) : (
        <g>
          <ellipse cx="81" cy="105" rx="15" ry="18" fill="#0b132b" />
          <circle cx="75" cy="98" r="6" fill="#ffffff" />
          <ellipse cx="139" cy="105" rx="15" ry="18" fill="#0b132b" />
          <circle cx="133" cy="98" r="6" fill="#ffffff" />
        </g>
      )}

      {mood === 'happy' || mood === 'cheer' ? (
        <path
          d="M94 128 Q110 152 126 128 Z"
          fill="#881337"
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M96 140 Q110 127 124 140"
          stroke="#0f172a"
          strokeWidth="4.2"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
};

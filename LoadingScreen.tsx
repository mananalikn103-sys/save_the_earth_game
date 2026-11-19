import React, { useEffect, useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { GameLogo } from './GameLogo';
import { EarthMascot } from './EarthMascot';
import { STUDIO_NAME } from '../data/catalog';
import { USER_BG_IMG } from '../utils/spriteLoader';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 2200;
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const ratio = Math.min(1, elapsed / duration);
      const eased = ratio < 0.7 ? ratio * 1.1 : 0.77 + (ratio - 0.7) * 0.7667;
      const val = Math.min(100, Math.round(eased * 100));
      setPercent(val);
      if (ratio < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setPercent(100);
        setTimeout(onComplete, 260);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className="relative w-full h-full overflow-hidden flex flex-col items-center justify-between py-5 px-4 cursor-pointer bg-sky-400"
    >
      <img
        src={USER_BG_IMG}
        alt="Save The Earth scenic backdrop"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-purple-950/35 via-transparent to-slate-950/30" />

      {/* Top Studio Header */}
      <div className="relative z-10 w-full flex items-center justify-between gap-2">
        <span className="font-display text-lg font-bold text-white text-outline-sm">
          Loading...
        </span>
        <div className="flex items-center gap-1.5 bg-slate-950/80 border-2 border-amber-300/80 rounded-2xl px-3 py-1 shadow-xl">
          <Gamepad2 className="w-4 h-4 text-amber-300" />
          <span className="font-display font-bold text-xs tracking-wide text-white">
            {STUDIO_NAME}
          </span>
        </div>
      </div>

      {/* Center Studio Crest + Logo + User's Earth Character */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center">
        <div className="mb-1 px-3.5 py-1 rounded-full bg-slate-950/75 border border-white/30 shadow-lg">
          <span className="font-display font-bold text-xs tracking-widest text-amber-300">
            {STUDIO_NAME} Presents
          </span>
        </div>
        <div className="scale-90">
          <GameLogo />
        </div>
        <div className="animate-float-slow -mt-1">
          <EarthMascot size={180} mood="happy" skinId="classic" />
        </div>
      </div>

      {/* Bottom Signpost + 0% to 100% Progress Bar */}
      <div className="relative z-10 w-full flex flex-col items-center gap-3 pb-6">
        <div className="bg-gradient-to-b from-amber-700 to-amber-900 border-3 border-amber-950 rounded-xl px-4 py-1.5 shadow-lg text-center">
          <p className="font-display text-xs leading-tight text-amber-50 font-semibold">
            A Small Step for You · A Big Step for Earth
          </p>
        </div>

        <div className="w-full max-w-[88%]">
          <div className="relative h-8 rounded-full bg-slate-900/85 border-3 border-slate-900 shadow-xl overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-b from-lime-300 via-green-500 to-emerald-700 transition-all duration-75"
              style={{ width: `${percent}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-base text-white text-outline-sm font-mono-num">
              {percent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

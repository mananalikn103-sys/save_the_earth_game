import React, { useMemo, useState } from 'react';
import { ArrowLeft, Lock, Star, Sparkles, Rocket, Crown } from 'lucide-react';
import { CHAPTERS, MAX_STARS, TOTAL_STAGES } from '../data/catalog';
import { getChapterForLevel } from '../data/levels';
import { PlayerProgress } from '../types/game';
import { sfx } from '../utils/sound';
import { USER_BG_IMG } from '../utils/spriteLoader';

interface LevelSelectMapProps {
  progress: PlayerProgress;
  onBack: () => void;
  onSelectLevel: (level: number) => void;
  onOpenComingSoon: () => void;
}

export const LevelSelectMap: React.FC<LevelSelectMapProps> = ({
  progress,
  onBack,
  onSelectLevel,
  onOpenComingSoon,
}) => {
  const initialChapter = getChapterForLevel(Math.min(TOTAL_STAGES, progress.unlockedLevel)).id;
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter);
  const [subHalf, setSubHalf] = useState<0 | 1>(() => {
    const ch = getChapterForLevel(Math.min(TOTAL_STAGES, progress.unlockedLevel));
    return progress.unlockedLevel - ch.startLevel >= 50 ? 1 : 0;
  });

  const totalStars = useMemo(
    () => Object.values(progress.starsByLevel).reduce((sum, s) => sum + s, 0),
    [progress.starsByLevel]
  );

  const activeChapter = CHAPTERS.find((c) => c.id === selectedChapter);

  // 4 nodes per row fits 9:16 mobile portrait screens cleanly!
  const rows = useMemo(() => {
    if (!activeChapter) return [];
    const rangeStart = activeChapter.startLevel + subHalf * 50;
    const rangeEnd = Math.min(activeChapter.endLevel, rangeStart + 49);
    const list: number[] = [];
    for (let lv = rangeStart; lv <= rangeEnd; lv++) {
      list.push(lv);
    }
    const chunked: number[][] = [];
    for (let i = 0; i < list.length; i += 4) {
      const slice = list.slice(i, i + 4);
      if ((i / 4) % 2 === 1) slice.reverse();
      chunked.push(slice);
    }
    return chunked;
  }, [activeChapter, subHalf]);

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col bg-emerald-800">
      <img
        src={USER_BG_IMG}
        alt="World level map background"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/30" />

      {/* Top HUD Bar */}
      <header className="relative z-10 w-full px-3.5 pt-3 pb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            onBack();
          }}
          aria-label="Back to Menu"
          className="w-10 h-10 rounded-full bg-gradient-to-b from-sky-400 to-blue-600 border-3 border-white shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="font-display font-bold text-lg text-white text-outline-dark whitespace-nowrap">
          1,000 Stages
        </h1>

        <div className="flex items-center gap-1.5 bg-slate-900/85 border-2 border-yellow-300/75 rounded-full px-2.5 py-1 shadow-md shrink-0">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="font-display font-bold text-white text-xs font-mono-num whitespace-nowrap">
            {totalStars}/{MAX_STARS}
          </span>
        </div>
      </header>

      {/* Chapter Switcher */}
      <div className="relative z-10 w-full px-3.5 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {CHAPTERS.map((ch) => {
          const isActive = selectedChapter === ch.id;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => {
                sfx.playClick();
                setSelectedChapter(ch.id);
                setSubHalf(0);
              }}
              className={`px-2.5 py-1.5 rounded-xl font-display font-bold text-xs border-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? `bg-gradient-to-b ${ch.badgeBg} text-white border-white shadow-md`
                  : 'bg-slate-900/75 text-slate-100 border-white/30'
              }`}
            >
              {ch.startLevel}–{ch.endLevel}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            setSelectedChapter(11);
          }}
          className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs border-2 transition-all whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
            selectedChapter === 11
              ? 'bg-gradient-to-b from-fuchsia-500 to-purple-700 text-white border-white shadow-md'
              : 'bg-purple-950/85 text-fuchsia-200 border-fuchsia-400/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Soon
        </button>
      </div>

      {/* Scrollable Map */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3.5 pb-5">
        {selectedChapter <= 10 && activeChapter ? (
          <div className="bg-amber-950/45 backdrop-blur-[2px] border-2 border-white/25 rounded-3xl p-3.5 shadow-2xl">
            <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-white/20">
              <div className="min-w-0">
                <h2 className="font-display font-bold text-base text-white text-outline-sm truncate">
                  Ch.{activeChapter.id}: {activeChapter.title}
                </h2>
                <p className="text-[11px] font-bold text-amber-100 truncate">
                  Crown = Giant Bee Boss
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-900/75 p-1 rounded-xl border border-white/25 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setSubHalf(0);
                  }}
                  className={`px-2 py-1 rounded-lg font-display font-bold text-[11px] cursor-pointer ${
                    subHalf === 0 ? 'bg-amber-500 text-white' : 'text-slate-200'
                  }`}
                >
                  {activeChapter.startLevel}–{activeChapter.startLevel + 49}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setSubHalf(1);
                  }}
                  className={`px-2 py-1 rounded-lg font-display font-bold text-[11px] cursor-pointer ${
                    subHalf === 1 ? 'bg-amber-500 text-white' : 'text-slate-200'
                  }`}
                >
                  {activeChapter.startLevel + 50}–{activeChapter.endLevel}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {rows.map((row, rowIdx) => (
                <div key={rowIdx} className="relative">
                  <div className="absolute left-8 right-8 top-6 h-4 rounded-full bg-amber-200/75 border-2 border-amber-800/70 shadow-inner" />

                  <div className="relative z-10 grid grid-cols-4 gap-2">
                    {row.map((lv) => {
                      const stars = progress.starsByLevel[lv] ?? 0;
                      const isUnlocked =
                        progress.sandboxUnlockAll || lv <= progress.unlockedLevel;
                      const isCurrent = lv === progress.unlockedLevel && !progress.sandboxUnlockAll;
                      const isBoss = lv % 10 === 0;

                      return (
                        <div key={lv} className="flex flex-col items-center">
                          <button
                            type="button"
                            disabled={!isUnlocked}
                            onClick={() => {
                              sfx.playClick();
                              onSelectLevel(lv);
                            }}
                            className={`relative w-13 h-13 rounded-full border-3 font-display font-bold text-base flex items-center justify-center transition-transform font-mono-num ${
                              isUnlocked
                                ? isCurrent
                                  ? 'bg-gradient-to-b from-lime-300 via-green-500 to-emerald-700 border-white text-white shadow-[0_4px_0_#14532d] ring-3 ring-yellow-300 cursor-pointer'
                                  : isBoss
                                    ? 'bg-gradient-to-b from-rose-400 via-red-600 to-rose-800 border-yellow-300 text-white shadow-[0_4px_0_#4c0519] cursor-pointer'
                                    : 'bg-gradient-to-b from-amber-300 via-amber-500 to-orange-600 border-white text-white shadow-[0_4px_0_#78350f] cursor-pointer'
                                : 'bg-gradient-to-b from-slate-400 to-slate-600 border-slate-200 text-slate-100 shadow-[0_3px_0_#334155] opacity-90 cursor-not-allowed'
                            }`}
                          >
                            {isBoss && (
                              <span
                                title="Giant Boss Bee Stage"
                                className="absolute -top-2 -right-1 w-5 h-5 rounded-full bg-yellow-400 border border-amber-900 flex items-center justify-center shadow"
                              >
                                <Crown className="w-3 h-3 text-amber-950" />
                              </span>
                            )}

                            {isUnlocked ? (
                              <span className="text-outline-sm">{lv}</span>
                            ) : (
                              <div className="flex flex-col items-center">
                                <Lock className="w-3.5 h-3.5" />
                                <span className="text-[9px] leading-none mt-0.5">{lv}</span>
                              </div>
                            )}
                          </button>

                          <div className="flex items-center gap-0.5 mt-1">
                            {[1, 2, 3].map((idx) => (
                              <Star
                                key={idx}
                                className={`w-3 h-3 ${
                                  stars >= idx
                                    ? 'text-yellow-300 fill-yellow-400'
                                    : 'text-slate-900/50 fill-slate-700/40'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {activeChapter.id === 10 && subHalf === 1 && (
              <div className="mt-6 pt-4 border-t border-white/25 flex flex-col items-center gap-3 bg-purple-950/70 rounded-2xl p-4 border border-fuchsia-300/40 text-center">
                <Rocket className="w-8 h-8 text-fuchsia-300" />
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    Chapter 11: Stages 1001+ Coming Soon!
                  </h3>
                  <p className="text-xs text-fuchsia-100">
                    Cosmic Nebula Zero-G puzzles & Solar Queen Bees are next!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    onOpenComingSoon();
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-b from-fuchsia-400 to-purple-700 border-2 border-white font-display font-bold text-white text-xs shadow cursor-pointer"
                >
                  Preview Next Update
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-b from-indigo-950/90 to-purple-950/90 border-3 border-fuchsia-300/60 rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-fuchsia-400 to-indigo-600 border-3 border-white flex items-center justify-center text-white shadow-xl mb-3">
              <Rocket className="w-8 h-8" />
            </div>
            <h2 className="font-display font-bold text-2xl text-white text-outline-dark mb-2">
              Next Stages Coming Soon!
            </h2>
            <p className="text-fuchsia-100 text-xs font-semibold mb-5">
              Stages 1–1,000 are live! Chapter 11 (Stages 1001–1200) is coming soon from
              MananGameWorld.
            </p>

            <div className="grid grid-cols-5 gap-2 mb-5">
              {[1001, 1002, 1003, 1004, 1005].map((lv) => (
                <div
                  key={lv}
                  className="h-12 rounded-xl bg-purple-900/80 border border-fuchsia-300/40 flex flex-col items-center justify-center text-fuchsia-200"
                >
                  <Lock className="w-3.5 h-3.5 mb-0.5" />
                  <span className="font-display font-bold text-[10px] font-mono-num">{lv}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setSelectedChapter(1);
              }}
              className="px-6 py-2.5 rounded-full bg-gradient-to-b from-lime-400 to-green-600 border-2 border-white font-display font-bold text-white text-base shadow-lg cursor-pointer"
            >
              Back to Stages 1–1,000
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

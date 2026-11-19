import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pause,
  RotateCcw,
  Star,
  AlertTriangle,
  ArrowDown,
  Lightbulb,
  Crown,
  Tv,
  Wind,
} from 'lucide-react';
import {
  DEFAULT_PROGRESS,
  REWARD_MILESTONES,
  TOTAL_STAGES,
  loadProgress,
  saveProgress,
} from './data/catalog';
import { getLevelConfig } from './data/levels';
import { ActiveModal, PlayerProgress, ScreenState, SimPhase } from './types/game';
import { LoadingScreen } from './components/LoadingScreen';
import { MainMenu } from './components/MainMenu';
import { LevelSelectMap } from './components/LevelSelectMap';
import { PhysicsCanvas } from './components/PhysicsCanvas';
import { GameModals } from './components/GameModals';
import { sfx } from './utils/sound';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('LOADING');
  const [modal, setModal] = useState<ActiveModal>('NONE');
  const [progress, setProgress] = useState<PlayerProgress>(() => loadProgress());

  const [currentLevelNum, setCurrentLevelNum] = useState<number>(() =>
    Math.min(TOTAL_STAGES, loadProgress().unlockedLevel)
  );
  const [attemptId, setAttemptId] = useState<number>(1);
  const [simPhase, setSimPhase] = useState<SimPhase>('DRAWING');
  const [remainingSec, setRemainingSec] = useState<number>(6);
  const [inkUsed, setInkUsed] = useState<number>(0);
  const [maxInk, setMaxInk] = useState<number>(720);
  const [hintToast, setHintToast] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  const [lastEarnedStars, setLastEarnedStars] = useState<number>(0);
  const [lastCoinsEarned, setLastCoinsEarned] = useState<number>(0);
  const [winCoinsClaimed, setWinCoinsClaimed] = useState<boolean>(false);
  const [defeatReason, setDefeatReason] = useState<string>('');

  const levelConfig = useMemo(() => getLevelConfig(currentLevelNum), [currentLevelNum]);

  useEffect(() => {
    sfx.setEnabled(progress.soundEnabled);
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (!hintToast) return;
    const t = setTimeout(() => setHintToast(null), 2200);
    return () => clearTimeout(t);
  }, [hintToast]);

  const totalStars = useMemo(
    () => Object.values(progress.starsByLevel).reduce((a, b) => a + b, 0),
    [progress.starsByLevel]
  );

  const hasUnclaimedReward = useMemo(
    () =>
      REWARD_MILESTONES.some(
        (rw) => totalStars >= rw.requiredStars && !progress.claimedRewards.includes(rw.id)
      ),
    [totalStars, progress.claimedRewards]
  );

  const startStage = useCallback((lv: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_STAGES, lv));
    setCurrentLevelNum(clamped);
    setAttemptId((prev) => prev + 1);
    setModal('NONE');
    setScreen('PLAYING');
    setSimPhase('DRAWING');
    setShowSolution(false);
    setWinCoinsClaimed(false);
  }, []);

  const handleSimulationEnd = useCallback(
    (won: boolean, reason: string, earnedStars: number) => {
      if (won) {
        const prevStars = progress.starsByLevel[currentLevelNum] ?? 0;
        const petBonusCoins = progress.equippedPet === 'aqua_turtle' ? 10 : 0;
        const bossBonus = currentLevelNum % 10 === 0 ? 35 : 0;
        const coinsEarned = 30 + earnedStars * 15 + petBonusCoins + bossBonus;
        setLastEarnedStars(earnedStars);
        setLastCoinsEarned(coinsEarned);
        setWinCoinsClaimed(false);
        setProgress((prev) => ({
          ...prev,
          unlockedLevel: Math.min(
            TOTAL_STAGES,
            Math.max(prev.unlockedLevel, currentLevelNum + 1)
          ),
          starsByLevel: {
            ...prev.starsByLevel,
            [currentLevelNum]: Math.max(prevStars, earnedStars),
          },
        }));
        setModal('VICTORY');
      } else {
        setDefeatReason(reason);
        setModal('DEFEAT');
      }
    },
    [currentLevelNum, progress.equippedPet, progress.starsByLevel]
  );

  const handleClaimWinCoins = useCallback(() => {
    if (winCoinsClaimed) return;
    setWinCoinsClaimed(true);
    setProgress((prev) => ({
      ...prev,
      coins: prev.coins + lastCoinsEarned,
    }));
  }, [winCoinsClaimed, lastCoinsEarned]);

  const liveProjectedStars = useMemo(() => {
    if (inkUsed <= levelConfig.star3Ink) return 3;
    if (inkUsed <= levelConfig.star2Ink) return 2;
    return 1;
  }, [inkUsed, levelConfig.star3Ink, levelConfig.star2Ink]);

  const inkRemainingPct = Math.max(0, Math.round(((maxInk - inkUsed) / Math.max(1, maxInk)) * 100));

  return (
    <main className="w-screen h-[100dvh] overflow-hidden bg-gradient-to-b from-sky-950 via-slate-950 to-purple-950 flex items-center justify-center">
      {/* Full-Screen 9:16 Mobile Portrait Viewport Shell */}
      <div className="relative w-full h-full sm:w-auto sm:h-[100dvh] sm:aspect-[9/16] max-w-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.65)] bg-sky-400">
        {screen === 'LOADING' && <LoadingScreen onComplete={() => setScreen('MENU')} />}

        {screen === 'MENU' && (
          <MainMenu
            progress={progress}
            hasUnclaimedReward={hasUnclaimedReward}
            onPlayCurrent={() => startStage(progress.unlockedLevel)}
            onOpenLevels={() => setScreen('LEVELS')}
            onOpenModal={(m) => setModal(m)}
          />
        )}

        {screen === 'LEVELS' && (
          <LevelSelectMap
            progress={progress}
            onBack={() => setScreen('MENU')}
            onSelectLevel={(lv) => startStage(lv)}
            onOpenComingSoon={() => setModal('COMING_SOON')}
          />
        )}

        {screen === 'PLAYING' && (
          <div className="relative w-full h-full flex items-center justify-center bg-sky-400">
            {/* Compact Mobile-Friendly 9:16 Top HUD */}
            <header className="absolute top-0 left-0 right-0 z-20 px-3 pt-3 flex flex-col gap-2 pointer-events-none">
              <div className="flex items-center justify-between gap-1.5">
                {/* Left: Pause, Restart, Earth Count */}
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      setModal('PAUSE');
                    }}
                    aria-label="Pause Game"
                    className="w-10 h-10 rounded-full bg-gradient-to-b from-sky-400 to-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
                  >
                    <Pause className="w-4 h-4 fill-white" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      setAttemptId((a) => a + 1);
                    }}
                    aria-label="Restart Stage"
                    className="w-10 h-10 rounded-full bg-gradient-to-b from-amber-400 to-orange-600 border-2 border-white shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1 bg-slate-900/75 border-2 border-sky-300/70 rounded-full px-2 py-1 shadow-md">
                    <span className="w-4 h-4 rounded-full bg-sky-500 border border-white inline-flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-lime-400" />
                    </span>
                    <span className="font-display font-bold text-white text-xs font-mono-num">
                      {levelConfig.earths.length}/{levelConfig.earths.length}
                    </span>
                  </div>
                </div>

                {/* Center Level Badge */}
                <div className="flex items-center gap-1 bg-slate-900/80 border-2 border-white/60 rounded-full px-3 py-1 shadow-lg">
                  {levelConfig.isBossStage && (
                    <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  )}
                  <span className="font-display font-bold text-white text-sm whitespace-nowrap">
                    Lv.{levelConfig.level}
                  </span>
                  {levelConfig.windX !== 0 && <Wind className="w-3.5 h-3.5 text-cyan-300" />}
                </div>

                {/* Right: Stars + Corner Solve (Watch Ad) Button */}
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  <div className="flex items-center gap-1 bg-slate-900/75 border-2 border-yellow-300/75 rounded-full px-2 py-1 shadow-md">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="font-display font-bold text-white text-xs font-mono-num">
                      {liveProjectedStars}/3
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      if (showSolution) {
                        setHintToast('Trace the glowing dotted guide!');
                      } else {
                        setModal('SOLVE_AD');
                      }
                    }}
                    aria-label="Solve Stage with Ad"
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-2xl border-2 border-white shadow-lg font-display font-bold text-xs text-white active:scale-95 transition-transform cursor-pointer ${
                      showSolution
                        ? 'bg-gradient-to-b from-emerald-400 to-green-600'
                        : 'bg-gradient-to-b from-sky-400 to-indigo-600'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-200" />
                    <span>{showSolution ? 'On' : 'Solve'}</span>
                    {!showSolution && (
                      <span className="inline-flex items-center justify-center bg-amber-400 text-slate-950 rounded px-1 py-0.5 leading-none">
                        <Tv className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Second Row: Live Phase Banner (Gravity Pulling / Bees Attacking) */}
              {(simPhase === 'GRAVITY' || simPhase === 'ATTACKING') && (
                <div className="flex justify-center">
                  {simPhase === 'ATTACKING' ? (
                    <div className="flex items-center gap-2 bg-gradient-to-b from-red-500 to-red-700 border-2 border-white rounded-full px-4 py-1 shadow-xl">
                      <AlertTriangle className="w-4 h-4 text-yellow-200 shrink-0" />
                      <span className="font-display font-bold text-white text-sm whitespace-nowrap">
                        {levelConfig.isBossStage ? 'Giant Bee Boss!' : 'Bees Are Attacking!'}
                      </span>
                      <span className="font-mono-num font-bold text-yellow-200 text-sm pl-1 border-l border-white/40">
                        {remainingSec.toFixed(1)}s
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-gradient-to-b from-sky-600 to-blue-800 border-2 border-white rounded-full px-4 py-1 shadow-xl">
                      <ArrowDown className="w-4 h-4 text-sky-200 animate-bounce shrink-0" />
                      <span className="font-display font-bold text-white text-sm whitespace-nowrap">
                        Gravity Pulling...
                      </span>
                      <span className="font-mono-num font-bold text-sky-200 text-sm pl-1 border-l border-white/40">
                        {remainingSec.toFixed(1)}s
                      </span>
                    </div>
                  )}
                </div>
              )}
            </header>

            {/* Full 9:16 540x960 Physics Arena */}
            <PhysicsCanvas
              level={levelConfig}
              attemptId={attemptId}
              paused={modal !== 'NONE'}
              showSolution={showSolution}
              equippedSkinId={progress.equippedSkin}
              equippedInkId={progress.equippedInk}
              equippedPetId={progress.equippedPet}
              onPhaseChange={setSimPhase}
              onTimerUpdate={setRemainingSec}
              onInkUpdate={(used, max) => {
                setInkUsed(used);
                setMaxInk(max);
              }}
              onEnd={handleSimulationEnd}
              onHintToast={setHintToast}
            />

            {/* Bottom Ink & Hint Bar during Drawing */}
            {simPhase === 'DRAWING' && (
              <div className="absolute bottom-2.5 left-3 right-3 z-20 flex flex-col items-center gap-1.5 pointer-events-none">
                {hintToast && (
                  <div className="px-3.5 py-1 rounded-full bg-amber-500 border-2 border-white text-white font-display font-bold text-xs shadow-lg">
                    {hintToast}
                  </div>
                )}
                <div className="w-full bg-slate-950/80 border border-white/25 rounded-2xl px-3.5 py-2 backdrop-blur-xs shadow-lg">
                  <div className="flex items-center justify-between text-[11px] font-bold text-sky-100 mb-1">
                    <span className="truncate pr-2">
                      {showSolution
                        ? 'Trace the glowing dotted blueprint to solve!'
                        : levelConfig.mechanicHint}
                    </span>
                    <span className="font-mono-num text-lime-300 shrink-0">
                      Ink {inkRemainingPct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${
                        inkRemainingPct > 40
                          ? 'bg-lime-400'
                          : inkRemainingPct > 15
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${inkRemainingPct}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <GameModals
          modal={modal}
          progress={progress}
          currentLevel={currentLevelNum}
          lastEarnedStars={lastEarnedStars}
          lastCoinsEarned={lastCoinsEarned}
          winCoinsClaimed={winCoinsClaimed}
          defeatReason={defeatReason}
          onClose={() => setModal('NONE')}
          onToggleSound={() =>
            setProgress((p) => ({ ...p, soundEnabled: !p.soundEnabled }))
          }
          onToggleSandbox={() =>
            setProgress((p) => ({ ...p, sandboxUnlockAll: !p.sandboxUnlockAll }))
          }
          onResetProgress={() => {
            setProgress({ ...DEFAULT_PROGRESS });
            setCurrentLevelNum(1);
            setModal('NONE');
          }}
          onClaimWinCoins={handleClaimWinCoins}
          onClaimReward={(rewardId, coins) =>
            setProgress((p) => ({
              ...p,
              coins: p.coins + coins,
              claimedRewards: [...p.claimedRewards, rewardId],
            }))
          }
          onBuyOrEquipSkin={(skinId, price) =>
            setProgress((p) => {
              if (p.ownedSkins.includes(skinId)) {
                return { ...p, equippedSkin: skinId };
              }
              if (p.coins < price) return p;
              return {
                ...p,
                coins: p.coins - price,
                ownedSkins: [...p.ownedSkins, skinId],
                equippedSkin: skinId,
              };
            })
          }
          onBuyOrEquipInk={(inkId, price) =>
            setProgress((p) => {
              if (p.ownedInks.includes(inkId)) {
                return { ...p, equippedInk: inkId };
              }
              if (p.coins < price) return p;
              return {
                ...p,
                coins: p.coins - price,
                ownedInks: [...p.ownedInks, inkId],
                equippedInk: inkId,
              };
            })
          }
          onBuyOrEquipPet={(petId, price) =>
            setProgress((p) => {
              if (p.ownedPets.includes(petId)) {
                return { ...p, equippedPet: petId };
              }
              if (p.coins < price) return p;
              return {
                ...p,
                coins: p.coins - price,
                ownedPets: [...p.ownedPets, petId],
                equippedPet: petId,
              };
            })
          }
          onRetryLevel={() => {
            setModal('NONE');
            setAttemptId((a) => a + 1);
            setSimPhase('DRAWING');
          }}
          onNextLevel={() => startStage(currentLevelNum + 1)}
          onGoToLevels={() => {
            setModal('NONE');
            setScreen('LEVELS');
          }}
          onGoToMenu={() => {
            setModal('NONE');
            setScreen('MENU');
          }}
          onUnlockSolution={() => {
            setShowSolution(true);
            setModal('NONE');
            setHintToast('Solution path unlocked! Trace the glowing dotted line.');
          }}
        />
      </div>
    </main>
  );
}

import React, { useEffect, useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Unlock,
  RotateCcw,
  Coins,
  Star,
  Check,
  Play,
  MapPin,
  Rocket,
  Tv,
  Lightbulb,
  Lock,
} from 'lucide-react';
import {
  PET_CATALOG,
  REWARD_MILESTONES,
  SHOP_INKS,
  SHOP_SKINS,
  STUDIO_NAME,
  TOTAL_STAGES,
} from '../data/catalog';
import { ActiveModal, PlayerProgress } from '../types/game';
import { EarthMascot } from './EarthMascot';
import { sfx } from '../utils/sound';

declare global {
  interface Window {
    AndroidAdBridge?: {
      showRewardedAd?: (callbackName: string) => void;
    };
  }
}

interface GameModalsProps {
  modal: ActiveModal;
  progress: PlayerProgress;
  currentLevel: number;
  lastEarnedStars: number;
  lastCoinsEarned: number;
  winCoinsClaimed: boolean;
  defeatReason: string;
  onClose: () => void;
  onToggleSound: () => void;
  onToggleSandbox: () => void;
  onResetProgress: () => void;
  onClaimWinCoins: () => void;
  onClaimReward: (rewardId: string, coins: number) => void;
  onBuyOrEquipSkin: (skinId: string, price: number) => void;
  onBuyOrEquipInk: (inkId: string, price: number) => void;
  onBuyOrEquipPet: (petId: string, price: number) => void;
  onRetryLevel: () => void;
  onNextLevel: () => void;
  onGoToLevels: () => void;
  onGoToMenu: () => void;
  onUnlockSolution: () => void;
}

export const GameModals: React.FC<GameModalsProps> = ({
  modal,
  progress,
  currentLevel,
  lastEarnedStars,
  lastCoinsEarned,
  winCoinsClaimed,
  defeatReason,
  onClose,
  onToggleSound,
  onToggleSandbox,
  onResetProgress,
  onClaimWinCoins,
  onClaimReward,
  onBuyOrEquipSkin,
  onBuyOrEquipInk,
  onBuyOrEquipPet,
  onRetryLevel,
  onNextLevel,
  onGoToLevels,
  onGoToMenu,
  onUnlockSolution,
}) => {
  const [shopTab, setShopTab] = useState<'skins' | 'inks'>('skins');
  const [confirmReset, setConfirmReset] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(5);
  const [adFinished, setAdFinished] = useState(false);

  useEffect(() => {
    if (modal !== 'SOLVE_AD') return;
    setAdSecondsLeft(5);
    setAdFinished(false);

    if (typeof window !== 'undefined' && window.AndroidAdBridge?.showRewardedAd) {
      (window as unknown as Record<string, () => void>).__onSolveAdRewarded = () => {
        setAdSecondsLeft(0);
        setAdFinished(true);
      };
      window.AndroidAdBridge.showRewardedAd('__onSolveAdRewarded');
    }

    const interval = setInterval(() => {
      setAdSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [modal]);

  if (modal === 'NONE') return null;

  const totalStars = Object.values(progress.starsByLevel).reduce((a, b) => a + b, 0);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3.5">
      <div className="relative w-full max-w-[94%] bg-gradient-to-b from-sky-50 to-white border-4 border-sky-500 rounded-3xl shadow-2xl p-4 sm:p-5 text-slate-900 max-h-[84%] overflow-y-auto">
        {(modal === 'SETTINGS' ||
          modal === 'REWARD' ||
          modal === 'SHOP' ||
          modal === 'PETS' ||
          modal === 'COMING_SOON') && (
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            aria-label="Close modal"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 border-2 border-white text-white flex items-center justify-center shadow hover:bg-red-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* REWARDED AD FOR SOLVE HINT */}
        {modal === 'SOLVE_AD' && (
          <div className="text-center">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">
                <Tv className="w-3.5 h-3.5" />
                Rewarded Ad · {STUDIO_NAME}
              </span>
              {adFinished ? (
                <span className="text-xs font-bold text-emerald-700">Reward Ready!</span>
              ) : (
                <span className="text-xs font-bold text-slate-600 font-mono-num">
                  {adSecondsLeft}s
                </span>
              )}
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 via-sky-800 to-emerald-700 border-3 border-slate-900 p-5 text-white shadow-inner mb-4">
              <div className="flex flex-col items-center">
                <EarthMascot size={88} mood="cheer" skinId={progress.equippedSkin} />
                <h3 className="font-display font-bold text-lg mt-2">
                  Stage {currentLevel} Solve Guide
                </h3>
                <p className="text-xs text-sky-100 mt-1">
                  {adFinished
                    ? 'Ad complete! Tap Show Solve Path to reveal the solution.'
                    : 'Watch this short sponsored ad to unlock the exact solution path.'}
                </p>

                <div className="w-full h-2.5 bg-slate-950/60 rounded-full overflow-hidden mt-3.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-lime-400 transition-all duration-1000"
                    style={{ width: `${((5 - adSecondsLeft) / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-2xl bg-slate-200 font-display font-bold text-slate-700 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!adFinished}
                onClick={() => {
                  sfx.playVictory();
                  onUnlockSolution();
                }}
                className={`flex-1 py-2.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-1.5 ${
                  adFinished
                    ? 'bg-gradient-to-b from-lime-400 to-green-600 text-white border-2 border-green-700 shadow cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                {adFinished ? 'Show Solve Path' : `Wait ${adSecondsLeft}s`}
              </button>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {modal === 'SETTINGS' && (
          <div>
            <h2 className="font-display font-bold text-xl text-sky-900 mb-3">Settings</h2>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-100/80 border border-sky-200">
                <div className="flex items-center gap-2.5">
                  {progress.soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-sky-600" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-slate-400" />
                  )}
                  <div>
                    <p className="font-bold text-sm">Sound Effects</p>
                    <p className="text-[11px] text-slate-600">Draw & physics audio</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleSound}
                  className={`px-3.5 py-1.5 rounded-xl font-display font-bold text-xs text-white cursor-pointer ${
                    progress.soundEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                >
                  {progress.soundEnabled ? 'On' : 'Off'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2.5">
                  <Unlock className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-bold text-sm">Unlock All 1,000 Stages</p>
                    <p className="text-[11px] text-slate-600">Play any stage (1–1,000)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    onToggleSandbox();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-display font-bold text-xs text-white cursor-pointer ${
                    progress.sandboxUnlockAll ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                >
                  {progress.sandboxUnlockAll ? 'Unlocked' : 'Locked'}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-600 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Save Data
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-red-600">Reset?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmReset(false);
                        onResetProgress();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                )}
                <span className="text-[11px] font-bold text-slate-400">{STUDIO_NAME}</span>
              </div>
            </div>
          </div>
        )}

        {/* REWARD */}
        {modal === 'REWARD' && (
          <div>
            <div className="flex items-center justify-between pr-8 mb-3">
              <h2 className="font-display font-bold text-xl text-sky-900">Rewards</h2>
              <span className="font-display font-bold text-xs text-amber-700 flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                {totalStars} Stars
              </span>
            </div>
            <div className="space-y-2.5">
              {REWARD_MILESTONES.map((rw) => {
                const claimed = progress.claimedRewards.includes(rw.id);
                const ready = totalStars >= rw.requiredStars && !claimed;
                return (
                  <div
                    key={rw.id}
                    className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-sky-50 border-2 border-sky-200"
                  >
                    <div>
                      <p className="font-display font-bold text-sm text-slate-900">{rw.title}</p>
                      <p className="text-[11px] text-slate-600">{rw.description}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!ready}
                      onClick={() => {
                        sfx.playVictory();
                        onClaimReward(rw.id, rw.coins);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs whitespace-nowrap shrink-0 flex items-center gap-1 ${
                        claimed
                          ? 'bg-slate-200 text-slate-500 cursor-default'
                          : ready
                            ? 'bg-gradient-to-b from-lime-400 to-green-600 text-white border border-green-700 shadow cursor-pointer'
                            : 'bg-slate-300 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {claimed ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Claimed
                        </>
                      ) : (
                        <>
                          <Coins className="w-3.5 h-3.5 text-yellow-200" />
                          Claim +{rw.coins}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SHOP (Paid Characters unlocked via Won & Claimed Coins!) */}
        {modal === 'SHOP' && (
          <div>
            <div className="flex items-center justify-between pr-8 mb-3">
              <h2 className="font-display font-bold text-xl text-sky-900">Characters & Inks</h2>
              <div className="flex items-center gap-1 font-display font-bold text-xs text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 font-mono-num">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                {progress.coins}
              </div>
            </div>

            <div className="flex gap-1.5 p-1 bg-sky-100 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setShopTab('skins');
                }}
                className={`flex-1 py-1.5 rounded-lg font-display font-bold text-xs cursor-pointer ${
                  shopTab === 'skins' ? 'bg-white text-sky-900 shadow' : 'text-sky-700'
                }`}
              >
                Characters
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setShopTab('inks');
                }}
                className={`flex-1 py-1.5 rounded-lg font-display font-bold text-xs cursor-pointer ${
                  shopTab === 'inks' ? 'bg-white text-sky-900 shadow' : 'text-sky-700'
                }`}
              >
                Barrier Inks
              </button>
            </div>

            {shopTab === 'skins' ? (
              <div className="space-y-2">
                {SHOP_SKINS.map((sk) => {
                  const owned = progress.ownedSkins.includes(sk.id);
                  const equipped = progress.equippedSkin === sk.id;
                  const canAfford = progress.coins >= sk.price;
                  return (
                    <div
                      key={sk.id}
                      className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-white border-2 border-slate-200"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <EarthMascot
                          size={44}
                          skinId={sk.id}
                          oceanColor={sk.oceanColor}
                          landColor={sk.landColor}
                          showHands={false}
                        />
                        <div className="min-w-0">
                          <p className="font-display font-bold text-xs truncate">{sk.name}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2">{sk.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!owned && !canAfford}
                        onClick={() => {
                          sfx.playClick();
                          onBuyOrEquipSkin(sk.id, sk.price);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-display font-bold text-[11px] whitespace-nowrap shrink-0 flex items-center gap-1 ${
                          equipped
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : owned
                              ? 'bg-sky-600 text-white cursor-pointer'
                              : canAfford
                                ? 'bg-amber-500 text-white cursor-pointer'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {!owned && !canAfford && <Lock className="w-3 h-3" />}
                        {equipped ? 'Equipped' : owned ? 'Equip' : `${sk.price} Coins`}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {SHOP_INKS.map((ink) => {
                  const owned = progress.ownedInks.includes(ink.id);
                  const equipped = progress.equippedInk === ink.id;
                  const canAfford = progress.coins >= ink.price;
                  return (
                    <div
                      key={ink.id}
                      className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-white border-2 border-slate-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-3.5 rounded-full border-2 shrink-0"
                          style={{
                            backgroundColor: ink.strokeColor,
                            borderColor: ink.outlineColor,
                          }}
                        />
                        <div>
                          <p className="font-display font-bold text-xs">{ink.name}</p>
                          <p className="text-[11px] text-slate-500">{ink.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!owned && !canAfford}
                        onClick={() => {
                          sfx.playClick();
                          onBuyOrEquipInk(ink.id, ink.price);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-display font-bold text-[11px] whitespace-nowrap shrink-0 flex items-center gap-1 ${
                          equipped
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : owned
                              ? 'bg-sky-600 text-white cursor-pointer'
                              : canAfford
                                ? 'bg-amber-500 text-white cursor-pointer'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {!owned && !canAfford && <Lock className="w-3 h-3" />}
                        {equipped ? 'Equipped' : owned ? 'Equip' : `${ink.price} Coins`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PETS */}
        {modal === 'PETS' && (
          <div>
            <div className="flex items-center justify-between pr-8 mb-3">
              <h2 className="font-display font-bold text-xl text-sky-900">Guardian Pets</h2>
              <div className="flex items-center gap-1 font-display font-bold text-xs text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 font-mono-num">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                {progress.coins}
              </div>
            </div>
            <div className="space-y-2.5">
              {PET_CATALOG.map((pet) => {
                const owned = progress.ownedPets.includes(pet.id);
                const equipped = progress.equippedPet === pet.id;
                const canAfford = progress.coins >= pet.price;
                return (
                  <div
                    key={pet.id}
                    className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-white border-2 border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-full border-2 border-slate-900 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: pet.color }}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: pet.accent }}
                        />
                      </div>
                      <div>
                        <p className="font-display font-bold text-xs">
                          {pet.name} · <span className="text-sky-700">{pet.bonusLabel}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">{pet.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!owned && !canAfford}
                      onClick={() => {
                        sfx.playClick();
                        onBuyOrEquipPet(pet.id, pet.price);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-display font-bold text-[11px] whitespace-nowrap shrink-0 flex items-center gap-1 ${
                        equipped
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : owned
                            ? 'bg-sky-600 text-white cursor-pointer'
                            : canAfford
                              ? 'bg-amber-500 text-white cursor-pointer'
                              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {!owned && !canAfford && <Lock className="w-3 h-3" />}
                      {equipped ? 'Equipped' : owned ? 'Equip' : `${pet.price} Coins`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PAUSE */}
        {modal === 'PAUSE' && (
          <div className="text-center py-1">
            <h2 className="font-display font-bold text-2xl text-sky-900 mb-1.5">
              Stage {currentLevel} Paused
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              Take a breath and plan your shield drawing.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onClose();
                }}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-b from-lime-400 to-green-600 border-2 border-green-700 font-display font-bold text-white text-base shadow cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                Resume
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onRetryLevel();
                }}
                className="w-full py-2.5 rounded-2xl bg-sky-600 font-display font-bold text-white text-sm shadow cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restart Stage
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onGoToLevels();
                }}
                className="w-full py-2.5 rounded-2xl bg-amber-500 font-display font-bold text-white text-sm shadow cursor-pointer flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Stage Map (1,000)
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onGoToMenu();
                }}
                className="w-full py-2 rounded-2xl bg-slate-200 font-display font-bold text-slate-800 text-xs cursor-pointer"
              >
                Main Menu
              </button>
            </div>
          </div>
        )}

        {/* VICTORY WITH EXPLICIT COIN CLAIM */}
        {modal === 'VICTORY' && (
          <div className="text-center py-1">
            <div className="flex justify-center mb-1.5">
              <EarthMascot size={96} mood="cheer" skinId={progress.equippedSkin} />
            </div>
            <h2 className="font-display font-bold text-2xl text-emerald-700 mb-1">
              {currentLevel === TOTAL_STAGES
                ? 'All 1,000 Stages Saved!'
                : `Stage ${currentLevel} Clear!`}
            </h2>
            <p className="text-xs font-bold text-slate-600 mb-3">
              {currentLevel === TOTAL_STAGES
                ? 'Cosmic Chapter (1001+) Coming Soon!'
                : 'Claim your won coins to unlock paid characters in Shop!'}
            </p>

            <div className="flex items-center justify-center gap-1.5 mb-3">
              {[1, 2, 3].map((idx) => (
                <Star
                  key={idx}
                  className={`w-8 h-8 ${
                    lastEarnedStars >= idx
                      ? 'text-yellow-400 fill-yellow-400 drop-shadow'
                      : 'text-slate-300 fill-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Explicit Claim Coins Reward Box */}
            <div className="mb-4">
              {!winCoinsClaimed ? (
                <button
                  type="button"
                  onClick={() => {
                    sfx.playVictory();
                    onClaimWinCoins();
                  }}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-500 to-orange-600 border-2 border-amber-900 font-display font-bold text-white text-base shadow-lg flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <Coins className="w-5 h-5 text-yellow-100" />
                  Claim +{lastCoinsEarned} Coins
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-emerald-100 border border-emerald-300 rounded-full px-4 py-1.5 font-display font-bold text-emerald-800 text-sm font-mono-num">
                  <Check className="w-4 h-4" />+{lastCoinsEarned} Coins Claimed!
                </div>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onRetryLevel();
                }}
                className="flex-1 py-2.5 rounded-2xl bg-slate-200 font-display font-bold text-slate-800 text-sm cursor-pointer"
              >
                Replay
              </button>
              {currentLevel < TOTAL_STAGES ? (
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    if (!winCoinsClaimed) onClaimWinCoins();
                    onNextLevel();
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-b from-lime-400 to-green-600 border-2 border-green-700 font-display font-bold text-white text-base shadow cursor-pointer"
                >
                  Next ({currentLevel + 1})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    if (!winCoinsClaimed) onClaimWinCoins();
                    onGoToLevels();
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-b from-fuchsia-500 to-purple-700 border-2 border-purple-900 font-display font-bold text-white text-sm shadow cursor-pointer"
                >
                  Coming Soon
                </button>
              )}
            </div>
          </div>
        )}

        {/* DEFEAT */}
        {modal === 'DEFEAT' && (
          <div className="text-center py-1">
            <div className="flex justify-center mb-1.5">
              <EarthMascot size={96} mood="stung" skinId={progress.equippedSkin} />
            </div>
            <h2 className="font-display font-bold text-2xl text-red-600 mb-1">Oh No!</h2>
            <p className="text-xs font-bold text-slate-700 mb-4">{defeatReason}</p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onGoToLevels();
                }}
                className="flex-1 py-2.5 rounded-2xl bg-slate-200 font-display font-bold text-slate-800 text-sm cursor-pointer"
              >
                Stage Map
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onRetryLevel();
                }}
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-600 border-2 border-orange-700 font-display font-bold text-white text-base shadow cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* COMING SOON */}
        {modal === 'COMING_SOON' && (
          <div className="text-center py-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 flex items-center justify-center text-white mb-3 shadow-lg">
              <Rocket className="w-7 h-7" />
            </div>
            <h2 className="font-display font-bold text-xl text-purple-900 mb-2">
              Stages 1001+ Coming Soon!
            </h2>
            <p className="text-xs text-slate-700 mb-4">
              {STUDIO_NAME} is building Chapter 11: Cosmic Frontiers — featuring low-gravity nebula
              islands, magnetic anchor rings, and solar bee queens!
            </p>
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                onClose();
              }}
              className="px-7 py-2.5 rounded-2xl bg-gradient-to-b from-fuchsia-500 to-purple-700 font-display font-bold text-white text-sm shadow cursor-pointer"
            >
              Got It!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

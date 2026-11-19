import React from 'react';
import { Settings, Gift, ShoppingBag, MapPin, PawPrint, Play, Star, Coins, Gamepad2 } from 'lucide-react';
import { GameLogo } from './GameLogo';
import { EarthMascot } from './EarthMascot';
import { PET_CATALOG, SHOP_SKINS, STUDIO_NAME, TOTAL_STAGES } from '../data/catalog';
import { ActiveModal, PlayerProgress } from '../types/game';
import { sfx } from '../utils/sound';
import { USER_BG_IMG } from '../utils/spriteLoader';

interface MainMenuProps {
  progress: PlayerProgress;
  hasUnclaimedReward: boolean;
  onPlayCurrent: () => void;
  onOpenLevels: () => void;
  onOpenModal: (modal: ActiveModal) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  progress,
  hasUnclaimedReward,
  onPlayCurrent,
  onOpenLevels,
  onOpenModal,
}) => {
  const totalStars = Object.values(progress.starsByLevel).reduce((a, b) => a + b, 0);
  const activeSkin = SHOP_SKINS.find((s) => s.id === progress.equippedSkin) ?? SHOP_SKINS[0];
  const activePet = PET_CATALOG.find((p) => p.id === progress.equippedPet) ?? PET_CATALOG[0];

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col justify-between p-4 bg-sky-400">
      <img
        src={USER_BG_IMG}
        alt="Save The Earth scenic background"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-purple-950/35 via-transparent to-sky-950/20" />

      {/* Top Bar */}
      <header className="relative z-10 w-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onOpenModal('SETTINGS');
            }}
            aria-label="Open Settings"
            className="w-11 h-11 rounded-full bg-gradient-to-b from-sky-400 to-blue-600 border-3 border-white shadow-lg flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1 bg-slate-950/75 border border-white/30 rounded-full px-2.5 py-1 shadow">
            <Gamepad2 className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-display font-bold text-[11px] text-white">{STUDIO_NAME}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/80 border-2 border-amber-400/70 rounded-full px-2.5 py-1 shadow-md">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-display font-bold text-white text-sm font-mono-num">
              {progress.coins}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/80 border-2 border-yellow-300/70 rounded-full px-2.5 py-1 shadow-md">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-display font-bold text-white text-sm font-mono-num">
              {totalStars}
            </span>
          </div>
        </div>
      </header>

      {/* Center Logo & User's Earth Character */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto">
        <div className="scale-90">
          <GameLogo />
        </div>
        <div className="relative animate-float-slow -mt-2">
          <EarthMascot
            size={188}
            mood="happy"
            skinId={activeSkin.id}
            oceanColor={activeSkin.oceanColor}
            landColor={activeSkin.landColor}
          />
          {activePet.id !== 'none' && (
            <div
              title={activePet.name}
              className="absolute -right-2 bottom-2 px-2 py-0.5 rounded-full bg-white/95 border-2 border-slate-900 shadow-md flex items-center gap-1"
            >
              <span
                className="w-3 h-3 rounded-full border border-slate-900"
                style={{ backgroundColor: activePet.color }}
              />
              <span className="font-display text-[11px] font-bold text-slate-900 whitespace-nowrap">
                {activePet.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-Friendly Bottom Controls Cluster (9:16 Thumb Reach!) */}
      <div className="relative z-10 w-full flex flex-col items-center gap-3 pb-3">
        <div className="grid grid-cols-4 gap-2.5 w-full">
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onOpenModal('REWARD');
            }}
            className="relative py-2.5 rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 border-2 border-white shadow-lg flex flex-col items-center justify-center gap-1 text-white active:scale-95 transition-transform cursor-pointer"
          >
            {hasUnclaimedReward && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 border-2 border-white text-[10px] font-black flex items-center justify-center shadow">
                !
              </span>
            )}
            <Gift className="w-6 h-6 text-amber-200" />
            <span className="font-display font-bold text-xs text-outline-sm">Reward</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onOpenModal('SHOP');
            }}
            className="py-2.5 rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 border-2 border-white shadow-lg flex flex-col items-center justify-center gap-1 text-white active:scale-95 transition-transform cursor-pointer"
          >
            <ShoppingBag className="w-6 h-6 text-rose-200" />
            <span className="font-display font-bold text-xs text-outline-sm">Shop</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onOpenLevels();
            }}
            className="py-2.5 rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 border-2 border-white shadow-lg flex flex-col items-center justify-center gap-1 text-white active:scale-95 transition-transform cursor-pointer"
          >
            <MapPin className="w-6 h-6 text-amber-200" />
            <span className="font-display font-bold text-xs text-outline-sm">Levels</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onOpenModal('PETS');
            }}
            className="py-2.5 rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 border-2 border-white shadow-lg flex flex-col items-center justify-center gap-1 text-white active:scale-95 transition-transform cursor-pointer"
          >
            <PawPrint className="w-6 h-6 text-sky-100" />
            <span className="font-display font-bold text-xs text-outline-sm">Pets</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            onPlayCurrent();
          }}
          className="animate-pulse-soft w-full max-w-xs flex items-center justify-center gap-3 py-3.5 rounded-full bg-gradient-to-b from-lime-400 via-green-500 to-emerald-700 border-4 border-white shadow-[0_7px_0_#14532d,0_12px_20px_rgba(0,0,0,0.35)] hover:brightness-105 active:translate-y-1 transition-all cursor-pointer"
        >
          <Play className="w-7 h-7 text-white fill-white drop-shadow" />
          <span className="font-display font-bold text-3xl text-white text-outline-dark whitespace-nowrap">
            Start
          </span>
        </button>

        <p className="font-display text-xs font-semibold text-white text-outline-sm">
          Stage {Math.min(TOTAL_STAGES, progress.unlockedLevel)} / {TOTAL_STAGES} · Next Coming Soon
        </p>
      </div>
    </div>
  );
};

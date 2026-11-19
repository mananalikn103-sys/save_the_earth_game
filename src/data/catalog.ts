import { ChapterInfo, PlayerProgress } from '../types/game';

export const TOTAL_STAGES = 1000;
export const MAX_STARS = TOTAL_STAGES * 3; // 3000 stars
export const STUDIO_NAME = 'MananGameWorld';

export const CHAPTERS: ChapterInfo[] = [
  {
    id: 1,
    title: 'Emerald Valley',
    subtitle: 'Stages 1–100 · Bridges, Pits & Giant Bees',
    startLevel: 1,
    endLevel: 100,
    accentColor: '#22c55e',
    badgeBg: 'from-emerald-500 to-green-600',
  },
  {
    id: 2,
    title: 'Seesaw Meadows',
    subtitle: 'Stages 101–200 · Balance & Pivot Physics',
    startLevel: 101,
    endLevel: 200,
    accentColor: '#84cc16',
    badgeBg: 'from-lime-500 to-emerald-600',
  },
  {
    id: 3,
    title: 'Tilting Slopes',
    subtitle: 'Stages 201–300 · Heavy Gravity Slides',
    startLevel: 201,
    endLevel: 300,
    accentColor: '#3b82f6',
    badgeBg: 'from-sky-500 to-blue-600',
  },
  {
    id: 4,
    title: 'Twin-Hive Peaks',
    subtitle: 'Stages 301–400 · Multi-Swarm Defense',
    startLevel: 301,
    endLevel: 400,
    accentColor: '#f59e0b',
    badgeBg: 'from-amber-500 to-orange-600',
  },
  {
    id: 5,
    title: 'Cliff & Pit Canyons',
    subtitle: 'Stages 401–500 · Deep Canyon Hooks',
    startLevel: 401,
    endLevel: 500,
    accentColor: '#eab308',
    badgeBg: 'from-yellow-500 to-amber-600',
  },
  {
    id: 6,
    title: 'Sky Pin Cradles',
    subtitle: 'Stages 501–600 · Anchor Ring Suspension',
    startLevel: 501,
    endLevel: 600,
    accentColor: '#a855f7',
    badgeBg: 'from-purple-500 to-violet-600',
  },
  {
    id: 7,
    title: 'Boulder Highlands',
    subtitle: 'Stages 601–700 · Falling Rocks & Crates',
    startLevel: 601,
    endLevel: 700,
    accentColor: '#64748b',
    badgeBg: 'from-slate-500 to-slate-700',
  },
  {
    id: 8,
    title: 'Spike Gauntlets',
    subtitle: 'Stages 701–800 · Precision Safe Zones',
    startLevel: 701,
    endLevel: 800,
    accentColor: '#ef4444',
    badgeBg: 'from-rose-500 to-red-600',
  },
  {
    id: 9,
    title: 'Windstorm Ridges',
    subtitle: 'Stages 801–900 · Crosswind Gravity Trials',
    startLevel: 801,
    endLevel: 900,
    accentColor: '#06b6d4',
    badgeBg: 'from-cyan-500 to-sky-700',
  },
  {
    id: 10,
    title: 'Grand Earth Citadel',
    subtitle: 'Stages 901–1000 · Master Boss Swarm Finale',
    startLevel: 901,
    endLevel: 1000,
    accentColor: '#14b8a6',
    badgeBg: 'from-teal-500 to-emerald-700',
  },
];

export interface SkinItem {
  id: string;
  name: string;
  price: number;
  oceanColor: string;
  landColor: string;
  glowColor: string;
  description: string;
}

export interface InkItem {
  id: string;
  name: string;
  price: number;
  strokeColor: string;
  outlineColor: string;
  description: string;
}

export interface PetItem {
  id: string;
  name: string;
  price: number;
  color: string;
  accent: string;
  bonusLabel: string;
  description: string;
}

export interface RewardMilestone {
  id: string;
  title: string;
  description: string;
  coins: number;
  requiredStars: number;
}

export const SHOP_SKINS: SkinItem[] = [
  {
    id: 'classic',
    name: 'Earth Hero (Default)',
    price: 0,
    oceanColor: '#2596f5',
    landColor: '#4ade38',
    glowColor: '#7dd3fc',
    description: 'Signature smiling Earth character with sneakers & thumbs up.',
  },
  {
    id: 'emerald',
    name: 'Forest Guardian (Paid)',
    price: 150,
    oceanColor: '#0ea5e9',
    landColor: '#16a34a',
    glowColor: '#86efac',
    description: 'Unlock with coins won from stages & claimed rewards.',
  },
  {
    id: 'golden',
    name: 'Golden Planet (Paid)',
    price: 300,
    oceanColor: '#f59e0b',
    landColor: '#fef08a',
    glowColor: '#fde047',
    description: 'Radiant golden character unlocked via claimed coins.',
  },
  {
    id: 'aurora',
    name: 'Aurora Spirit (Paid)',
    price: 500,
    oceanColor: '#1d4ed8',
    landColor: '#2dd4bf',
    glowColor: '#67e8f9',
    description: 'Northern lights planet unlocked with won coins.',
  },
  {
    id: 'blossom',
    name: 'Sakura Earth (Paid)',
    price: 750,
    oceanColor: '#38bdf8',
    landColor: '#f472b6',
    glowColor: '#fbcfe8',
    description: 'Cherry-blossom character unlocked with claimed coins.',
  },
];

export const SHOP_INKS: InkItem[] = [
  {
    id: 'charcoal',
    name: 'Titan Ink',
    price: 0,
    strokeColor: '#141923',
    outlineColor: '#05070b',
    description: 'Heavy-duty solid dark protective line.',
  },
  {
    id: 'wood',
    name: 'Oak Timber (Paid)',
    price: 120,
    strokeColor: '#92400e',
    outlineColor: '#451a03',
    description: 'Unlock with coins won & claimed in game.',
  },
  {
    id: 'emerald_vine',
    name: 'Living Vine (Paid)',
    price: 250,
    strokeColor: '#15803d',
    outlineColor: '#052e16',
    description: 'Dense braided forest barrier.',
  },
  {
    id: 'cobalt',
    name: 'Cobalt Steel (Paid)',
    price: 400,
    strokeColor: '#1d4ed8',
    outlineColor: '#172554',
    description: 'Reinforced sapphire alloy line.',
  },
  {
    id: 'gold_ink',
    name: 'Royal Gold (Paid)',
    price: 650,
    strokeColor: '#eab308',
    outlineColor: '#713f12',
    description: 'Gleaming gilded shield stroke.',
  },
];

export const PET_CATALOG: PetItem[] = [
  {
    id: 'none',
    name: 'Solo Earth',
    price: 0,
    color: '#94a3b8',
    accent: '#cbd5e1',
    bonusLabel: 'Standard Mode',
    description: 'Play with your default Earth character.',
  },
  {
    id: 'sprout_fox',
    name: 'Sprout Buddy (Paid)',
    price: 200,
    color: '#fb923c',
    accent: '#4ade80',
    bonusLabel: '+15% Ink Reserve',
    description: 'Unlock with won & claimed coins.',
  },
  {
    id: 'cloud_owl',
    name: 'Cloud Chick (Paid)',
    price: 380,
    color: '#f8fafc',
    accent: '#38bdf8',
    bonusLabel: '+20% Ink Reserve',
    description: 'Unlock with won & claimed coins.',
  },
  {
    id: 'aqua_turtle',
    name: 'Reef Turtle (Paid)',
    price: 550,
    color: '#14b8a6',
    accent: '#fde047',
    bonusLabel: '+25% Ink & +10 Coins/Win',
    description: 'Unlock with won & claimed coins.',
  },
];

export const REWARD_MILESTONES: RewardMilestone[] = [
  {
    id: 'first_win_gift',
    title: 'First Victory Bonus',
    description: 'Win 3 Stars to claim your starter coin pouch!',
    coins: 150,
    requiredStars: 3,
  },
  {
    id: 'stars_30',
    title: 'Valley Protector',
    description: 'Collect 30 Stars across the first stages.',
    coins: 300,
    requiredStars: 30,
  },
  {
    id: 'stars_150',
    title: 'Giant Bee Challenger',
    description: 'Collect 150 Stars and defeat Giant Boss Bees.',
    coins: 600,
    requiredStars: 150,
  },
  {
    id: 'stars_600',
    title: 'Gravity Physics Master',
    description: 'Collect 600 Stars on your 1,000-Stage journey.',
    coins: 1200,
    requiredStars: 600,
  },
  {
    id: 'stars_1500',
    title: 'Grand Planetary Legend',
    description: 'Collect 1,500 Stars across the 1,000 Stages.',
    coins: 3000,
    requiredStars: 1500,
  },
];

export const DEFAULT_PROGRESS: PlayerProgress = {
  unlockedLevel: 1,
  starsByLevel: {},
  coins: 0,
  claimedRewards: [],
  ownedSkins: ['classic'],
  ownedInks: ['charcoal'],
  ownedPets: ['none'],
  equippedSkin: 'classic',
  equippedInk: 'charcoal',
  equippedPet: 'none',
  soundEnabled: true,
  sandboxUnlockAll: false,
};

const STORAGE_KEY = 'save_the_earth_progress_v3';

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      starsByLevel: parsed.starsByLevel ?? {},
      claimedRewards: parsed.claimedRewards ?? [],
      ownedSkins: parsed.ownedSkins ?? ['classic'],
      ownedInks: parsed.ownedInks ?? ['charcoal'],
      ownedPets: parsed.ownedPets ?? ['none'],
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors
  }
}

export type ScreenState = 'LOADING' | 'MENU' | 'LEVELS' | 'PLAYING';

export type ActiveModal =
  | 'NONE'
  | 'SETTINGS'
  | 'REWARD'
  | 'SHOP'
  | 'PETS'
  | 'PAUSE'
  | 'VICTORY'
  | 'DEFEAT'
  | 'COMING_SOON'
  | 'SOLVE_AD';

export type SimPhase = 'DRAWING' | 'GRAVITY' | 'ATTACKING' | 'WON' | 'LOST';

export interface Vec2 {
  x: number;
  y: number;
}

export interface TerrainBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  angle?: number;
  style: 'grass' | 'rock' | 'wood' | 'moss' | 'citadel';
}

export interface TrianglePeak {
  x: number;
  y: number; // center-base or centroid Y
  w: number;
  h: number;
}

export interface AnchorPin {
  x: number;
  y: number;
  radius: number;
}

export interface SeesawDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DynamicPropDef {
  x: number;
  y: number;
  size: number;
  shape: 'boulder' | 'crate';
}

export interface SpikeZone {
  x: number;
  y: number;
  w: number;
  h: number;
  direction: 'up' | 'down';
}

export interface HiveDef {
  x: number;
  y: number;
  beeCount: number;
  beeSpeed: number;
  beeForce: number;
  branchSide: 'left' | 'right' | 'top';
  hasGiantBoss?: boolean;
}

export interface EarthSpawn {
  x: number;
  y: number;
  radius: number;
}

export interface LevelConfig {
  level: number;
  chapter: number;
  name: string;
  mechanicHint: string;
  isBossStage: boolean;
  earths: EarthSpawn[];
  hives: HiveDef[];
  terrains: TerrainBlock[];
  triangles: TrianglePeak[];
  pins: AnchorPin[];
  seesaws: SeesawDef[];
  boulders: DynamicPropDef[];
  spikes: SpikeZone[];
  solutionPath: Vec2[];
  waterY: number;
  gravityY: number;
  windX: number;
  surviveSeconds: number;
  maxInk: number;
  star3Ink: number;
  star2Ink: number;
}

export interface ChapterInfo {
  id: number;
  title: string;
  subtitle: string;
  startLevel: number;
  endLevel: number;
  accentColor: string;
  badgeBg: string;
}

export interface PlayerProgress {
  unlockedLevel: number;
  starsByLevel: Record<number, number>;
  coins: number;
  claimedRewards: string[];
  ownedSkins: string[];
  ownedInks: string[];
  ownedPets: string[];
  equippedSkin: string;
  equippedInk: string;
  equippedPet: string;
  soundEnabled: boolean;
  sandboxUnlockAll: boolean;
}

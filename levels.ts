import {
  AnchorPin,
  DynamicPropDef,
  EarthSpawn,
  HiveDef,
  LevelConfig,
  SeesawDef,
  SpikeZone,
  TerrainBlock,
  TrianglePeak,
  Vec2,
} from '../types/game';
import { CHAPTERS, TOTAL_STAGES } from './catalog';

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function placeOnBlock(block: TerrainBlock, localX: number, radius: number): EarthSpawn {
  const angle = block.angle ?? 0;
  const ly = -(block.h / 2) - radius - 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: Math.round(block.x + localX * cos - ly * sin),
    y: Math.round(block.y + localX * sin + ly * cos),
    radius,
  };
}

const ARCHETYPE_NAMES = [
  'Valley Bridge',
  'Seesaw Triangle',
  'Pit Canyon Hook',
  'Rocky Slope',
  'Twin Cliffs',
  'Hive Pincer',
  'Sky Pin Cradle',
  'Boulder Watch',
  'Spike Ridge',
  'Triple Rescue',
  'Citadel Trial',
];

export function getChapterForLevel(level: number) {
  return (
    CHAPTERS.find((c) => level >= c.startLevel && level <= c.endLevel) ??
    CHAPTERS[CHAPTERS.length - 1]
  );
}

/**
 * Generates all 1,000 playable stages tailored to the 540x960 (9:16 mobile portrait) arena.
 */
export function getLevelConfig(levelInput: number): LevelConfig {
  const level = Math.max(1, Math.min(TOTAL_STAGES, Math.floor(levelInput)));
  const chapter = getChapterForLevel(level);
  const rand = seededRandom(level * 9973 + 1337);
  const isBossStage = level % 10 === 0;

  const progress = (level - 1) / (TOTAL_STAGES - 1);
  const waterY = 852;
  const gravityY = Number((1.18 + progress * 0.44 + (isBossStage ? 0.08 : 0)).toFixed(2));
  const surviveSeconds = level <= 15 ? 5.5 : level <= 250 ? 6.0 : 6.5;

  let archetypeIdx = (level - 1) % 11;
  if (level === 1) archetypeIdx = 0; // Classic Valley Bridge
  if (level === 2) archetypeIdx = 1; // Seesaw Triangle Peak
  if (level === 3) archetypeIdx = 2; // Pit Canyon Hook
  if (level === 4) archetypeIdx = 3; // Steep Gravity Slope
  if (level === 5) archetypeIdx = 0; // Twin Earths Valley Bridge
  if (chapter.id === 2 && rand() < 0.6) archetypeIdx = 1;
  if (chapter.id === 3 && rand() < 0.6) archetypeIdx = 3;
  if (chapter.id === 4 && rand() < 0.6) archetypeIdx = 5;
  if (chapter.id === 5 && rand() < 0.6) archetypeIdx = 2;
  if (chapter.id === 6 && rand() < 0.6) archetypeIdx = 6;
  if (chapter.id === 7 && rand() < 0.6) archetypeIdx = 7;
  if (chapter.id === 8 && rand() < 0.6) archetypeIdx = 8;
  if (chapter.id === 10 && rand() < 0.55) archetypeIdx = 10;

  const baseBees = Math.min(18, 4 + Math.floor(level / 60) + (isBossStage ? 2 : 0));
  const beeSpeed = Number((2.6 + progress * 2.0 + (rand() * 0.35 - 0.17)).toFixed(2));
  const beeForce = Number((0.0014 + progress * 0.0015).toFixed(5));
  const windX =
    chapter.id === 9 || (chapter.id >= 6 && level % 5 === 0)
      ? Number(((rand() < 0.5 ? -1 : 1) * (0.14 + progress * 0.16)).toFixed(2))
      : 0;

  const style: TerrainBlock['style'] =
    chapter.id <= 2
      ? 'grass'
      : chapter.id === 3 || chapter.id === 7
        ? 'rock'
        : chapter.id === 4
          ? 'moss'
          : chapter.id === 5 || chapter.id === 6
            ? 'wood'
            : 'citadel';

  let terrains: TerrainBlock[] = [];
  let triangles: TrianglePeak[] = [];
  let earths: EarthSpawn[] = [];
  let hives: HiveDef[] = [];
  let pins: AnchorPin[] = [];
  let seesaws: SeesawDef[] = [];
  let boulders: DynamicPropDef[] = [];
  let spikes: SpikeZone[] = [];
  let solutionPath: Vec2[] = [];
  let mechanicHint = 'Draw a smooth shield line to protect Earth!';
  let maxInk = 720;

  const jitter = (amt: number) => Math.round((rand() - 0.5) * amt);

  switch (archetypeIdx) {
    case 0: {
      // Twin Cliffs + Center Valley Cradle (540x960)
      const isTwin = level === 5 || level > 8;
      const cx = 270 + jitter(16);
      const cy = 738 + jitter(16);
      const centerBlock: TerrainBlock = {
        x: cx,
        y: cy,
        w: isTwin ? 196 : 164,
        h: 118,
        style,
      };
      const leftCliff: TerrainBlock = {
        x: 78 + jitter(12),
        y: 726 + jitter(14),
        w: 118,
        h: 165,
        style,
      };
      const rightCliff: TerrainBlock = {
        x: 462 + jitter(12),
        y: 726 + jitter(14),
        w: 118,
        h: 165,
        style,
      };
      terrains = [leftCliff, centerBlock, rightCliff];
      earths = isTwin
        ? [placeOnBlock(centerBlock, -34, 28), placeOnBlock(centerBlock, 34, 28)]
        : [placeOnBlock(centerBlock, 0, 32)];
      hives = [
        {
          x: 438,
          y: 235 + jitter(24),
          beeCount: level === 1 ? 4 : baseBees,
          beeSpeed,
          beeForce,
          branchSide: 'right',
          hasGiantBoss: isBossStage,
        },
      ];
      if (level > 180) {
        hives.push({
          x: 102,
          y: 245 + jitter(24),
          beeCount: Math.max(3, Math.floor(baseBees * 0.6)),
          beeSpeed,
          beeForce,
          branchSide: 'left',
        });
      }
      const leftTop = leftCliff.y - leftCliff.h / 2 - 4;
      const rightTop = rightCliff.y - rightCliff.h / 2 - 4;
      solutionPath = [
        { x: leftCliff.x + 15, y: leftTop },
        { x: cx - 105, y: 565 },
        { x: cx, y: 535 },
        { x: cx + 105, y: 565 },
        { x: rightCliff.x - 15, y: rightTop },
      ];
      mechanicHint = 'Bridge across the cliffs above Earth to block the bees!';
      maxInk = 720;
      break;
    }

    case 1: {
      // Seesaw Plank balanced on Triangular Peak (9:16 mobile portrait!)
      const px = 270 + jitter(14);
      const py = 724;
      const peak: TrianglePeak = { x: px, y: py, w: 156, h: 105 };
      const plankY = py - peak.h / 2 - 14;
      const seesaw: SeesawDef = { x: px, y: plankY, w: 266, h: 18 };
      triangles = [peak];
      seesaws = [seesaw];
      const twoEarths = level > 3 || rand() < 0.75;
      earths = twoEarths
        ? [
            { x: px - 74, y: plankY - 38, radius: 27 },
            { x: px + 74, y: plankY - 38, radius: 27 },
          ]
        : [{ x: px - 60, y: plankY - 40, radius: 30 }];
      hives = [
        {
          x: 120,
          y: 235 + jitter(20),
          beeCount: Math.max(4, Math.ceil(baseBees * 0.55)),
          beeSpeed,
          beeForce,
          branchSide: 'left',
          hasGiantBoss: isBossStage,
        },
        {
          x: 420,
          y: 235 + jitter(20),
          beeCount: Math.max(4, Math.ceil(baseBees * 0.55)),
          beeSpeed,
          beeForce,
          branchSide: 'right',
        },
      ];
      solutionPath = [
        { x: px - 66, y: py + 14 },
        { x: px - 158, y: plankY + 24 },
        { x: px - 148, y: plankY - 76 },
        { x: px, y: plankY - 108 },
        { x: px + 148, y: plankY - 76 },
        { x: px + 158, y: plankY + 24 },
        { x: px + 66, y: py + 14 },
      ];
      mechanicHint = 'Draw an oval cradle around the seesaw & hook under the triangle!';
      maxInk = 840;
      break;
    }

    case 2: {
      // Pit Canyon Hook (9:16 portrait!)
      const leftCliff: TerrainBlock = { x: 85, y: 650, w: 145, h: 330, style };
      const pitFloor: TerrainBlock = { x: 270, y: 782, w: 280, h: 90, style };
      const rightCliff: TerrainBlock = { x: 455, y: 682, w: 145, h: 275, style };
      terrains = [leftCliff, pitFloor, rightCliff];
      earths =
        level > 30 && rand() < 0.5
          ? [placeOnBlock(pitFloor, -34, 27), placeOnBlock(pitFloor, 34, 27)]
          : [placeOnBlock(pitFloor, 0, 31)];
      hives = [
        {
          x: 112,
          y: 235,
          beeCount: baseBees,
          beeSpeed,
          beeForce,
          branchSide: 'left',
          hasGiantBoss: isBossStage,
        },
      ];
      if (level > 350) {
        hives.push({
          x: 428,
          y: 245,
          beeCount: Math.max(4, Math.floor(baseBees * 0.6)),
          beeSpeed,
          beeForce,
          branchSide: 'right',
        });
      }
      solutionPath = [
        { x: 112, y: 478 },
        { x: 162, y: 478 },
        { x: 162, y: 730 },
        { x: 210, y: 730 },
        { x: 270, y: 580 },
        { x: 378, y: 538 },
        { x: 425, y: 538 },
      ];
      mechanicHint = 'Hook onto the cliff rim & seal the canyon pit above Earth!';
      maxInk = 780;
      break;
    }

    case 3: {
      // Steep Gravity Slope + Anchor Pin (9:16)
      const slopeDir = rand() < 0.65 ? 1 : -1;
      const slopeAngle = slopeDir * (0.3 + Math.min(0.18, progress * 0.14 + rand() * 0.06));
      const slopeBlock: TerrainBlock = {
        x: 270 + slopeDir * -20,
        y: 635,
        w: 310,
        h: 82,
        angle: slopeAngle,
        style: 'rock',
      };
      const upperShelf: TerrainBlock = {
        x: slopeDir === 1 ? 65 : 475,
        y: 575,
        w: 115,
        h: 220,
        style,
      };
      terrains = [upperShelf, slopeBlock];
      const count = level > 40 && rand() < 0.55 ? 2 : 1;
      earths =
        count === 2
          ? [placeOnBlock(slopeBlock, -38 * slopeDir, 27), placeOnBlock(slopeBlock, 26 * slopeDir, 27)]
          : [placeOnBlock(slopeBlock, -10 * slopeDir, 31)];
      const pinX = 270 - slopeDir * 95;
      const pinY = 415;
      pins = [{ x: pinX, y: pinY, radius: 13 }];
      hives = [
        {
          x: slopeDir === 1 ? 430 : 110,
          y: 235,
          beeCount: baseBees,
          beeSpeed,
          beeForce,
          branchSide: slopeDir === 1 ? 'right' : 'left',
          hasGiantBoss: isBossStage,
        },
      ];
      const e0 = earths[0];
      solutionPath = [
        { x: pinX - 22, y: pinY + 12 },
        { x: pinX, y: pinY - 26 },
        { x: pinX + 24, y: pinY + 10 },
        { x: e0.x + 68 * slopeDir, y: e0.y - 60 },
        { x: e0.x + 76 * slopeDir, y: e0.y + 34 },
        { x: e0.x - 45 * slopeDir, y: e0.y + 46 },
      ];
      mechanicHint = 'Gravity pulls down the slope! Hook over the pin to anchor Earth!';
      maxInk = 760;
      break;
    }

    case 4: {
      // Twin Cliffs Gap (9:16)
      const leftSide = rand() < 0.5;
      const earthCliff: TerrainBlock = {
        x: leftSide ? 165 + jitter(16) : 375 + jitter(16),
        y: 726 + jitter(16),
        w: 175,
        h: 165,
        style,
      };
      const farCliff: TerrainBlock = {
        x: leftSide ? 420 + jitter(12) : 120 + jitter(12),
        y: 722 + jitter(16),
        w: 130,
        h: 170,
        style,
      };
      terrains = [earthCliff, farCliff];
      earths =
        level > 25 && rand() < 0.5
          ? [placeOnBlock(earthCliff, -34, 27), placeOnBlock(earthCliff, 34, 27)]
          : [placeOnBlock(earthCliff, 0, 31)];
      hives = [
        {
          x: leftSide ? 432 : 108,
          y: 235,
          beeCount: baseBees,
          beeSpeed,
          beeForce,
          branchSide: leftSide ? 'right' : 'left',
          hasGiantBoss: isBossStage,
        },
      ];
      const topY = earthCliff.y - earthCliff.h / 2 - 4;
      solutionPath = [
        { x: earthCliff.x - 76, y: topY },
        { x: earthCliff.x - 68, y: topY - 88 },
        { x: earthCliff.x, y: topY - 115 },
        { x: earthCliff.x + 68, y: topY - 88 },
        { x: earthCliff.x + 76, y: topY },
      ];
      mechanicHint = 'Build a dome resting firmly on both edges of Earth’s cliff!';
      maxInk = 700;
      break;
    }

    case 5: {
      // Twin Hive Pincer (9:16)
      const centerIsland: TerrainBlock = {
        x: 270 + jitter(14),
        y: 730 + jitter(14),
        w: 210,
        h: 160,
        style,
      };
      const leftWall: TerrainBlock = { x: 65, y: 745, w: 90, h: 145, style };
      const rightWall: TerrainBlock = { x: 475, y: 745, w: 90, h: 145, style };
      terrains = [leftWall, centerIsland, rightWall];
      earths =
        rand() < 0.55
          ? [placeOnBlock(centerIsland, -34, 27), placeOnBlock(centerIsland, 34, 27)]
          : [placeOnBlock(centerIsland, 0, 31)];
      const splitBees = Math.max(4, Math.ceil(baseBees * 0.65));
      hives = [
        {
          x: 102,
          y: 235,
          beeCount: splitBees,
          beeSpeed,
          beeForce,
          branchSide: 'left',
          hasGiantBoss: isBossStage,
        },
        { x: 438, y: 235, beeCount: splitBees, beeSpeed, beeForce, branchSide: 'right' },
      ];
      const topY = centerIsland.y - centerIsland.h / 2 - 4;
      solutionPath = [
        { x: centerIsland.x - 92, y: topY },
        { x: centerIsland.x - 84, y: topY - 95 },
        { x: centerIsland.x, y: topY - 120 },
        { x: centerIsland.x + 84, y: topY - 95 },
        { x: centerIsland.x + 92, y: topY },
      ];
      mechanicHint = 'Two hives! Seal a dome touching the ground on both sides.';
      maxInk = 740;
      break;
    }

    case 6: {
      // Sky Pin Cradle (9:16)
      const sx = 270 + jitter(16);
      const sy = 685 + jitter(16);
      const skyPlatform: TerrainBlock = { x: sx, y: sy, w: 150, h: 42, style };
      terrains = [skyPlatform];
      earths =
        level > 50 && rand() < 0.5
          ? [placeOnBlock(skyPlatform, -30, 25), placeOnBlock(skyPlatform, 30, 25)]
          : [placeOnBlock(skyPlatform, 0, 30)];
      const pinL = { x: sx - 108, y: 455, radius: 13 };
      const pinR = { x: sx + 108, y: 455, radius: 13 };
      pins = [pinL, pinR];
      hives = [
        {
          x: 435,
          y: 230,
          beeCount: baseBees,
          beeSpeed,
          beeForce,
          branchSide: 'right',
          hasGiantBoss: isBossStage,
        },
      ];
      if (level > 120) {
        hives.push({
          x: 105,
          y: 250,
          beeCount: Math.max(3, Math.floor(baseBees * 0.5)),
          beeSpeed,
          beeForce,
          branchSide: 'left',
        });
      }
      solutionPath = [
        { x: pinL.x - 22, y: pinL.y + 10 },
        { x: pinL.x, y: pinL.y - 24 },
        { x: sx, y: 495 },
        { x: pinR.x, y: pinR.y - 24 },
        { x: pinR.x + 22, y: pinR.y + 10 },
        { x: sx + 82, y: sy - 20 },
        { x: sx - 82, y: sy - 20 },
        { x: pinL.x - 22, y: pinL.y + 10 },
      ];
      mechanicHint = 'Loop around both anchor pins so gravity cannot drop your shield!';
      maxInk = 820;
      break;
    }

    case 7: {
      // Rolling Boulder Watch (9:16)
      const ramp: TerrainBlock = {
        x: 165,
        y: 445,
        w: 220,
        h: 32,
        angle: 0.28,
        style: 'rock',
      };
      const baseCliff: TerrainBlock = {
        x: 340,
        y: 726,
        w: 225,
        h: 165,
        style,
      };
      terrains = [ramp, baseCliff];
      boulders = [{ x: 105, y: 365, size: 25, shape: 'boulder' }];
      earths = [placeOnBlock(baseCliff, 12, 30)];
      hives = [
        {
          x: 435,
          y: 235,
          beeCount: baseBees,
          beeSpeed,
          beeForce,
          branchSide: 'right',
          hasGiantBoss: isBossStage,
        },
      ];
      const topY = baseCliff.y - baseCliff.h / 2 - 4;
      solutionPath = [
        { x: 245, y: topY },
        { x: 255, y: 525 },
        { x: 360, y: 505 },
        { x: 435, y: topY },
      ];
      mechanicHint = 'Deflect the rolling boulder AND shield Earth from the bees!';
      maxInk = 760;
      break;
    }

    case 8: {
      // Spike Canyon Ridges (9:16)
      const mainFloor: TerrainBlock = {
        x: 270,
        y: 742,
        w: 440,
        h: 130,
        style: 'rock',
      };
      terrains = [mainFloor];
      spikes = [
        { x: 112, y: 665, w: 80, h: 22, direction: 'up' },
        { x: 428, y: 665, w: 80, h: 22, direction: 'up' },
      ];
      earths =
        rand() < 0.5
          ? [placeOnBlock(mainFloor, -34, 27), placeOnBlock(mainFloor, 34, 27)]
          : [placeOnBlock(mainFloor, 0, 30)];
      pins = [{ x: 270, y: 445, radius: 13 }];
      hives = [
        {
          x: 105,
          y: 235,
          beeCount: Math.ceil(baseBees * 0.6),
          beeSpeed,
          beeForce,
          branchSide: 'left',
          hasGiantBoss: isBossStage,
        },
        { x: 435, y: 235, beeCount: Math.ceil(baseBees * 0.6), beeSpeed, beeForce, branchSide: 'right' },
      ];
      solutionPath = [
        { x: 175, y: 672 },
        { x: 192, y: 545 },
        { x: 270, y: 505 },
        { x: 348, y: 545 },
        { x: 365, y: 672 },
      ];
      mechanicHint = 'Keep Earth safely inside the spike-free center zone!';
      maxInk = 740;
      break;
    }

    case 9: {
      // Triple Earth Rescue (3/3 in 9:16!)
      const leftIsle: TerrainBlock = { x: 160, y: 726, w: 165, h: 160, style };
      const rightIsle: TerrainBlock = { x: 380, y: 726, w: 165, h: 160, style };
      terrains = [leftIsle, rightIsle];
      earths = [
        placeOnBlock(leftIsle, -32, 24),
        placeOnBlock(leftIsle, 32, 24),
        placeOnBlock(rightIsle, 0, 24),
      ];
      pins = [{ x: 270, y: 475, radius: 13 }];
      hives = [
        {
          x: 438,
          y: 225,
          beeCount: baseBees,
          beeSpeed,
          beeForce,
          branchSide: 'right',
          hasGiantBoss: isBossStage,
        },
        {
          x: 102,
          y: 245,
          beeCount: Math.max(4, Math.floor(baseBees * 0.6)),
          beeSpeed,
          beeForce,
          branchSide: 'left',
        },
      ];
      solutionPath = [
        { x: 92, y: 642 },
        { x: 112, y: 510 },
        { x: 270, y: 445 },
        { x: 428, y: 510 },
        { x: 448, y: 642 },
      ];
      mechanicHint = 'Span across both islands using the center pin to save all 3 Earths!';
      maxInk = 840;
      break;
    }

    default: {
      // Citadel Trial — Heavy Gravity + Dual Slopes + Triple Hives (9:16)
      const leftSlope: TerrainBlock = {
        x: 145,
        y: 688,
        w: 155,
        h: 64,
        angle: -0.2,
        style: 'citadel',
      };
      const rightSlope: TerrainBlock = {
        x: 395,
        y: 688,
        w: 155,
        h: 64,
        angle: 0.2,
        style: 'citadel',
      };
      const centerHub: TerrainBlock = {
        x: 270,
        y: 736,
        w: 150,
        h: 135,
        style: 'citadel',
      };
      terrains = [leftSlope, rightSlope, centerHub];
      earths = [placeOnBlock(centerHub, -32, 25), placeOnBlock(centerHub, 32, 25)];
      pins = [
        { x: 155, y: 465, radius: 13 },
        { x: 385, y: 465, radius: 13 },
      ];
      spikes = [
        { x: 88, y: 632, w: 54, h: 18, direction: 'up' },
        { x: 452, y: 632, w: 54, h: 18, direction: 'up' },
      ];
      hives = [
        {
          x: 98,
          y: 225,
          beeCount: Math.ceil(baseBees * 0.6),
          beeSpeed,
          beeForce,
          branchSide: 'left',
          hasGiantBoss: isBossStage,
        },
        { x: 270, y: 195, beeCount: Math.ceil(baseBees * 0.5), beeSpeed, beeForce, branchSide: 'top' },
        { x: 442, y: 225, beeCount: Math.ceil(baseBees * 0.6), beeSpeed, beeForce, branchSide: 'right' },
      ];
      solutionPath = [
        { x: 135, y: 475 },
        { x: 155, y: 438 },
        { x: 270, y: 465 },
        { x: 385, y: 438 },
        { x: 405, y: 475 },
        { x: 350, y: 664 },
        { x: 190, y: 664 },
        { x: 135, y: 475 },
      ];
      mechanicHint = 'Citadel Trial: Hook both pins against heavy gravity & triple hives!';
      maxInk = 860;
      break;
    }
  }

  if (isBossStage) {
    mechanicHint = `BOSS STAGE ${level}: A Giant Bee attacks! Build a thick anchored shield!`;
  }

  return {
    level,
    chapter: chapter.id,
    name: `${ARCHETYPE_NAMES[archetypeIdx]} ${level}`,
    mechanicHint,
    isBossStage,
    earths,
    hives,
    terrains,
    triangles,
    pins,
    seesaws,
    boulders,
    spikes,
    solutionPath,
    waterY,
    gravityY,
    windX,
    surviveSeconds,
    maxInk,
    star3Ink: Math.round(maxInk * 0.45),
    star2Ink: Math.round(maxInk * 0.72),
  };
}

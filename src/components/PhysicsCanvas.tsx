import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { LevelConfig, SimPhase, Vec2 } from '../types/game';
import { PET_CATALOG, SHOP_INKS, SHOP_SKINS } from '../data/catalog';
import { sfx } from '../utils/sound';
import {
  USER_BEE_IMG,
  USER_BG_IMG,
  USER_EARTH_IMG,
  loadTransparentSprite,
} from '../utils/spriteLoader';

const WORLD_W = 540;
const WORLD_H = 960;

const CAT_TERRAIN = 0x0001;
const CAT_EARTH = 0x0002;
const CAT_BARRIER = 0x0004;
const CAT_BEE = 0x0008;
const CAT_PROP = 0x0010;
const CAT_PIN = 0x0020;

interface PhysicsCanvasProps {
  level: LevelConfig;
  attemptId: number;
  paused: boolean;
  showSolution: boolean;
  equippedSkinId: string;
  equippedInkId: string;
  equippedPetId: string;
  onPhaseChange: (phase: SimPhase) => void;
  onTimerUpdate: (remainingSeconds: number) => void;
  onInkUpdate: (usedLength: number, maxInk: number) => void;
  onEnd: (won: boolean, reason: string, earnedStars: number) => void;
  onHintToast: (msg: string) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
}

interface BeeAgent {
  body: Matter.Body;
  speed: number;
  force: number;
  seed: number;
  recoilUntil: number;
  isBoss: boolean;
}

export const PhysicsCanvas: React.FC<PhysicsCanvasProps> = ({
  level,
  attemptId,
  paused,
  showSolution,
  equippedSkinId,
  equippedInkId,
  equippedPetId,
  onPhaseChange,
  onTimerUpdate,
  onInkUpdate,
  onEnd,
  onHintToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const showSolutionRef = useRef(showSolution);
  showSolutionRef.current = showSolution;

  const callbacksRef = useRef({
    onPhaseChange,
    onTimerUpdate,
    onInkUpdate,
    onEnd,
    onHintToast,
  });
  callbacksRef.current = {
    onPhaseChange,
    onTimerUpdate,
    onInkUpdate,
    onEnd,
    onHintToast,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const skin = SHOP_SKINS.find((s) => s.id === equippedSkinId) ?? SHOP_SKINS[0];
    const inkStyle = SHOP_INKS.find((i) => i.id === equippedInkId) ?? SHOP_INKS[0];
    const pet = PET_CATALOG.find((p) => p.id === equippedPetId) ?? PET_CATALOG[0];

    const inkBonusMultiplier =
      pet.id === 'sprout_fox'
        ? 1.15
        : pet.id === 'cloud_owl'
          ? 1.2
          : pet.id === 'aqua_turtle'
            ? 1.25
            : 1.0;
    const effectiveMaxInk = Math.round(level.maxInk * inkBonusMultiplier);

    const bgImage = new Image();
    let bgLoaded = false;
    bgImage.onload = () => {
      bgLoaded = true;
    };
    bgImage.src = USER_BG_IMG;

    let earthSpriteCanvas: HTMLCanvasElement | null = null;
    let beeSpriteCanvas: HTMLCanvasElement | null = null;
    loadTransparentSprite(USER_EARTH_IMG).then((s) => {
      earthSpriteCanvas = s.canvas;
    });
    loadTransparentSprite(USER_BEE_IMG).then((s) => {
      beeSpriteCanvas = s.canvas;
    });

    const engine = Matter.Engine.create({
      gravity: { x: level.windX * 0.08, y: level.gravityY, scale: 0.00115 },
      positionIterations: 10,
      velocityIterations: 8,
    });

    const world = engine.world;
    const earthBodies: { body: Matter.Body; radius: number; stung: boolean }[] = [];
    const terrainBodies: { body: Matter.Body; def: (typeof level.terrains)[number] }[] = [];
    const triangleBodies: { body: Matter.Body; def: (typeof level.triangles)[number] }[] = [];
    const pinBodies: { body: Matter.Body; def: (typeof level.pins)[number] }[] = [];
    const seesawBodies: { body: Matter.Body; def: (typeof level.seesaws)[number] }[] = [];
    const propBodies: { body: Matter.Body; def: (typeof level.boulders)[number] }[] = [];
    const beeAgents: BeeAgent[] = [];
    let barrierBody: Matter.Body | null = null;

    const wallLeft = Matter.Bodies.rectangle(-25, WORLD_H / 2, 50, WORLD_H * 2, {
      isStatic: true,
      collisionFilter: { category: CAT_TERRAIN },
    });
    const wallRight = Matter.Bodies.rectangle(WORLD_W + 25, WORLD_H / 2, 50, WORLD_H * 2, {
      isStatic: true,
      collisionFilter: { category: CAT_TERRAIN },
    });
    const ceiling = Matter.Bodies.rectangle(WORLD_W / 2, -30, WORLD_W + 100, 60, {
      isStatic: true,
      collisionFilter: { category: CAT_TERRAIN },
    });
    Matter.Composite.add(world, [wallLeft, wallRight, ceiling]);

    for (const t of level.terrains) {
      const body = Matter.Bodies.rectangle(t.x, t.y, t.w, t.h, {
        isStatic: true,
        angle: t.angle ?? 0,
        friction: 0.72,
        restitution: 0.08,
        label: 'terrain',
        collisionFilter: { category: CAT_TERRAIN },
      });
      terrainBodies.push({ body, def: t });
      Matter.Composite.add(world, body);
    }

    for (const tri of level.triangles) {
      const verts = [
        { x: 0, y: -tri.h * 0.62 },
        { x: tri.w * 0.5, y: tri.h * 0.38 },
        { x: -tri.w * 0.5, y: tri.h * 0.38 },
      ];
      const body = Matter.Bodies.fromVertices(tri.x, tri.y, [verts], {
        isStatic: true,
        friction: 0.8,
        restitution: 0.05,
        label: 'terrain',
        collisionFilter: { category: CAT_TERRAIN },
      });
      triangleBodies.push({ body, def: tri });
      Matter.Composite.add(world, body);
    }

    for (const pin of level.pins) {
      const body = Matter.Bodies.circle(pin.x, pin.y, pin.radius, {
        isStatic: true,
        friction: 0.9,
        restitution: 0.08,
        label: 'pin',
        collisionFilter: {
          category: CAT_PIN,
          mask: CAT_BARRIER | CAT_EARTH | CAT_PROP,
        },
      });
      pinBodies.push({ body, def: pin });
      Matter.Composite.add(world, body);
    }

    for (const sw of level.seesaws) {
      const plank = Matter.Bodies.rectangle(sw.x, sw.y, sw.w, sw.h, {
        friction: 0.85,
        frictionStatic: 0.9,
        restitution: 0.08,
        density: 0.005,
        label: 'seesaw',
        collisionFilter: { category: CAT_TERRAIN },
      });
      const pivot = Matter.Constraint.create({
        pointA: { x: sw.x, y: sw.y },
        bodyB: plank,
        pointB: { x: 0, y: 0 },
        stiffness: 1,
        length: 0,
      });
      seesawBodies.push({ body: plank, def: sw });
      Matter.Composite.add(world, [plank, pivot]);
    }

    for (const prop of level.boulders) {
      const body =
        prop.shape === 'boulder'
          ? Matter.Bodies.circle(prop.x, prop.y, prop.size, {
              friction: 0.35,
              restitution: 0.25,
              density: 0.007,
              label: 'prop',
              collisionFilter: { category: CAT_PROP },
            })
          : Matter.Bodies.rectangle(prop.x, prop.y, prop.size * 1.9, prop.size * 1.9, {
              friction: 0.7,
              restitution: 0.12,
              density: 0.0045,
              label: 'prop',
              collisionFilter: { category: CAT_PROP },
            });
      propBodies.push({ body, def: prop });
      Matter.Composite.add(world, body);
    }

    for (const e of level.earths) {
      const body = Matter.Bodies.circle(e.x, e.y, e.radius, {
        friction: 0.52,
        frictionStatic: 0.7,
        restitution: 0.22,
        density: 0.0036,
        frictionAir: 0.006,
        label: 'earth',
        collisionFilter: { category: CAT_EARTH },
      });
      earthBodies.push({ body, radius: e.radius, stung: false });
      Matter.Composite.add(world, body);
    }

    let phase: SimPhase = 'DRAWING';
    let isDrawing = false;
    let pointerPos: Vec2 | null = null;
    let strokePoints: Vec2[] = [];
    let strokeLength = 0;
    let simElapsed = 0;
    let beesSpawned = false;
    let endScheduled = false;
    let endTimer = 0;
    let endResult: { won: boolean; reason: string } | null = null;
    const particles: Particle[] = [];

    const bubbles: Bubble[] = Array.from({ length: 18 }, (_, i) => ({
      x: 18 + ((i * 31) % (WORLD_W - 36)),
      y: level.waterY + 18 + (i % 4) * 14,
      r: 4 + (i % 4) * 2.5,
      speed: 14 + (i % 4) * 7,
      phase: i * 0.7,
    }));

    callbacksRef.current.onPhaseChange('DRAWING');
    callbacksRef.current.onTimerUpdate(level.surviveSeconds);
    callbacksRef.current.onInkUpdate(0, effectiveMaxInk);

    const spawnParticles = (x: number, y: number, color: string, count: number, speed = 130) => {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = (0.3 + Math.random() * 0.7) * speed;
        particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 35,
          life: 0,
          maxLife: 0.35 + Math.random() * 0.35,
          radius: 2.5 + Math.random() * 4,
          color,
        });
      }
    };

    const triggerEnd = (won: boolean, reason: string) => {
      if (endScheduled) return;
      endScheduled = true;
      endResult = { won, reason };
      endTimer = won ? 0.85 : 1.05;
      phase = won ? 'WON' : 'LOST';
      callbacksRef.current.onPhaseChange(phase);
      if (won) {
        sfx.playVictory();
        for (const eb of earthBodies) {
          spawnParticles(eb.body.position.x, eb.body.position.y - 20, '#facc15', 18, 170);
          spawnParticles(eb.body.position.x, eb.body.position.y - 20, '#4ade80', 14, 150);
        }
      } else {
        sfx.playDefeat();
      }
    };

    Matter.Events.on(engine, 'collisionStart', (event) => {
      if (phase === 'WON' || phase === 'LOST') return;
      for (const pair of event.pairs) {
        const a = pair.bodyA;
        const b = pair.bodyB;
        const labels = [a.label, b.label];

        if (labels.includes('bee') && labels.includes('earth')) {
          const earthBody = a.label === 'earth' ? a : b;
          const eb = earthBodies.find((item) => item.body === earthBody);
          if (eb) eb.stung = true;
          spawnParticles(earthBody.position.x, earthBody.position.y, '#facc15', 18, 160);
          spawnParticles(earthBody.position.x, earthBody.position.y, '#ef4444', 14, 140);
          triggerEnd(false, 'The angry bees stung Earth!');
          return;
        }

        if (labels.includes('bee') && (labels.includes('barrier') || labels.includes('terrain'))) {
          const beeBody = a.label === 'bee' ? a : b;
          const agent = beeAgents.find((ag) => ag.body === beeBody);
          if (agent) {
            agent.recoilUntil = simElapsed + (agent.isBoss ? 0.1 : 0.14);
            sfx.playBonk();
            spawnParticles(
              beeBody.position.x,
              beeBody.position.y,
              agent.isBoss ? '#fb923c' : '#fef08a',
              agent.isBoss ? 8 : 4,
              agent.isBoss ? 120 : 80
            );
          }
        }
      }
    });

    const toWorldCoords = (clientX: number, clientY: number): Vec2 => {
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * WORLD_W;
      const y = ((clientY - rect.top) / rect.height) * WORLD_H;
      return {
        x: Math.max(10, Math.min(WORLD_W - 10, x)),
        y: Math.max(10, Math.min(level.waterY - 6, y)),
      };
    };

    const projectPointCleanly = (pt: Vec2): Vec2 => {
      let { x, y } = pt;

      for (const eb of earthBodies) {
        const dx = x - eb.body.position.x;
        const dy = y - eb.body.position.y;
        const dist = Math.hypot(dx, dy);
        const minDist = eb.radius + 9;
        if (dist < minDist) {
          const ang = dist > 0.001 ? Math.atan2(dy, dx) : -Math.PI / 2;
          x = eb.body.position.x + Math.cos(ang) * minDist;
          y = eb.body.position.y + Math.sin(ang) * minDist;
        }
      }

      for (const hive of level.hives) {
        const dx = x - hive.x;
        const dy = y - hive.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 26) {
          const ang = dist > 0.001 ? Math.atan2(dy, dx) : Math.PI / 2;
          x = hive.x + Math.cos(ang) * 26;
          y = hive.y + Math.sin(ang) * 26;
        }
      }

      for (const tb of terrainBodies) {
        const angle = tb.body.angle;
        const dx = x - tb.body.position.x;
        const dy = y - tb.body.position.y;
        const cos = Math.cos(-angle);
        const sin = Math.sin(-angle);
        const lx = dx * cos - dy * sin;
        const ly = dx * sin + dy * cos;
        const hw = tb.def.w / 2 + 5;
        const hh = tb.def.h / 2 + 5;
        if (Math.abs(lx) < hw && Math.abs(ly) < hh) {
          const penX = hw - Math.abs(lx);
          const penY = hh - Math.abs(ly);
          let nlx = lx;
          let nly = ly;
          if (penX < penY) {
            nlx = lx >= 0 ? hw : -hw;
          } else {
            nly = ly >= 0 ? hh : -hh;
          }
          const rCos = Math.cos(angle);
          const rSin = Math.sin(angle);
          x = tb.body.position.x + nlx * rCos - nly * rSin;
          y = tb.body.position.y + nlx * rSin + nly * rCos;
        }
      }

      return { x, y };
    };

    const appendSmoothPoint = (target: Vec2) => {
      if (strokePoints.length === 0) {
        strokePoints.push(target);
        return;
      }
      const last = strokePoints[strokePoints.length - 1];
      const dx = target.x - last.x;
      const dy = target.y - last.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4.5) return;

      const steps = Math.max(1, Math.ceil(dist / 10));
      for (let s = 1; s <= steps; s++) {
        const interp = projectPointCleanly({
          x: last.x + (dx * s) / steps,
          y: last.y + (dy * s) / steps,
        });
        const prev = strokePoints[strokePoints.length - 1];
        const segD = Math.hypot(interp.x - prev.x, interp.y - prev.y);
        if (segD < 3) continue;

        if (strokeLength + segD > effectiveMaxInk) {
          const remain = effectiveMaxInk - strokeLength;
          if (remain > 3) {
            const r = remain / segD;
            strokePoints.push({
              x: prev.x + (interp.x - prev.x) * r,
              y: prev.y + (interp.y - prev.y) * r,
            });
            strokeLength = effectiveMaxInk;
            callbacksRef.current.onInkUpdate(strokeLength, effectiveMaxInk);
          }
          return;
        }

        strokePoints.push(interp);
        strokeLength += segD;
      }
      callbacksRef.current.onInkUpdate(strokeLength, effectiveMaxInk);
      sfx.playDrawTick();
    };

    const startSimulation = () => {
      if (strokePoints.length < 2 || strokeLength < 22) {
        strokePoints = [];
        strokeLength = 0;
        callbacksRef.current.onInkUpdate(0, effectiveMaxInk);
        callbacksRef.current.onHintToast('Draw a longer barrier line to protect Earth!');
        return;
      }

      const simplified: Vec2[] = [strokePoints[0]];
      for (let i = 1; i < strokePoints.length - 1; i++) {
        const prev = simplified[simplified.length - 1];
        if (Math.hypot(strokePoints[i].x - prev.x, strokePoints[i].y - prev.y) >= 10) {
          simplified.push(strokePoints[i]);
        }
      }
      simplified.push(strokePoints[strokePoints.length - 1]);

      const parts: Matter.Body[] = [];
      for (let i = 0; i < simplified.length - 1; i++) {
        const p1 = simplified[i];
        const p2 = simplified[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const segLen = Math.hypot(dx, dy);
        if (segLen < 2) continue;
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const ang = Math.atan2(dy, dx);
        parts.push(
          Matter.Bodies.rectangle(mx, my, segLen + 8, 12, {
            angle: ang,
            friction: 0.78,
            restitution: 0.08,
            density: 0.0055,
            label: 'barrier',
          })
        );
      }

      if (parts.length > 0) {
        barrierBody = Matter.Body.create({
          parts,
          friction: 0.78,
          frictionStatic: 0.9,
          restitution: 0.08,
          frictionAir: 0.012,
          label: 'barrier',
          collisionFilter: {
            category: CAT_BARRIER,
            mask: CAT_TERRAIN | CAT_EARTH | CAT_BEE | CAT_PROP | CAT_PIN,
          },
        });
        Matter.Composite.add(world, barrierBody);
      }

      phase = 'GRAVITY';
      simElapsed = 0;
      callbacksRef.current.onPhaseChange('GRAVITY');
      sfx.playGravityDrop();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (phase !== 'DRAWING' || pausedRef.current) return;
      canvas.setPointerCapture(e.pointerId);
      const raw = toWorldCoords(e.clientX, e.clientY);
      const clean = projectPointCleanly(raw);
      isDrawing = true;
      pointerPos = clean;
      strokePoints = [clean];
      strokeLength = 0;
      callbacksRef.current.onInkUpdate(0, effectiveMaxInk);
    };

    const onPointerMove = (e: PointerEvent) => {
      const raw = toWorldCoords(e.clientX, e.clientY);
      pointerPos = raw;
      if (!isDrawing || phase !== 'DRAWING' || pausedRef.current) return;
      const clean = projectPointCleanly(raw);
      pointerPos = clean;
      appendSmoothPoint(clean);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDrawing || phase !== 'DRAWING') return;
      isDrawing = false;
      pointerPos = null;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      startSimulation();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    const spawnBees = () => {
      if (beesSpawned) return;
      beesSpawned = true;
      phase = 'ATTACKING';
      callbacksRef.current.onPhaseChange('ATTACKING');
      sfx.playBeeAlert();

      for (const hive of level.hives) {
        for (let i = 0; i < hive.beeCount; i++) {
          const ang = (i / Math.max(1, hive.beeCount)) * Math.PI * 2;
          const bx = hive.x + Math.cos(ang) * 7;
          const by = hive.y + 4 + Math.sin(ang) * 7;
          const beeBody = Matter.Bodies.circle(bx, by, 10, {
            restitution: 0.48,
            friction: 0.02,
            frictionAir: 0.04,
            density: 0.0026,
            label: 'bee',
            collisionFilter: {
              category: CAT_BEE,
              mask: CAT_TERRAIN | CAT_BARRIER | CAT_EARTH | CAT_PROP | CAT_BEE,
            },
          });
          Matter.Body.setVelocity(beeBody, {
            x: Math.cos(ang) * 1.7,
            y: Math.sin(ang) * 1.7 + 0.8,
          });
          beeAgents.push({
            body: beeBody,
            speed: hive.beeSpeed,
            force: hive.beeForce,
            seed: i * 1.37 + hive.x * 0.01,
            recoilUntil: 0,
            isBoss: false,
          });
          Matter.Composite.add(world, beeBody);
        }

        if (hive.hasGiantBoss) {
          const bossBody = Matter.Bodies.circle(hive.x, hive.y + 8, 24, {
            restitution: 0.42,
            friction: 0.02,
            frictionAir: 0.032,
            density: 0.012,
            label: 'bee',
            collisionFilter: {
              category: CAT_BEE,
              mask: CAT_TERRAIN | CAT_BARRIER | CAT_EARTH | CAT_PROP | CAT_BEE,
            },
          });
          Matter.Body.setVelocity(bossBody, { x: 0, y: 2.2 });
          beeAgents.push({
            body: bossBody,
            speed: hive.beeSpeed * 1.15,
            force: hive.beeForce * 3.8,
            seed: 9.9,
            recoilUntil: 0,
            isBoss: true,
          });
          Matter.Composite.add(world, bossBody);
        }
      }
    };

    const drawTerrainBlock = (def: (typeof level.terrains)[number], body: Matter.Body) => {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);

      const hw = def.w / 2;
      const hh = def.h / 2;
      const r = Math.min(14, hw * 0.3, hh * 0.3);

      const fillGrad = ctx.createLinearGradient(0, -hh, 0, hh);
      if (def.style === 'citadel') {
        fillGrad.addColorStop(0, '#475569');
        fillGrad.addColorStop(1, '#1e293b');
      } else if (def.style === 'wood') {
        fillGrad.addColorStop(0, '#b45309');
        fillGrad.addColorStop(1, '#78350f');
      } else {
        fillGrad.addColorStop(0, '#a8836b');
        fillGrad.addColorStop(0.5, '#7e5a48');
        fillGrad.addColorStop(1, '#583b2e');
      }

      ctx.beginPath();
      ctx.roundRect(-hw, -hh, def.w, def.h, r);
      ctx.fillStyle = fillGrad;
      ctx.fill();
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = '#291c17';
      ctx.stroke();

      if (def.style !== 'wood' && def.style !== 'citadel') {
        const capH = Math.min(18, def.h * 0.32);
        ctx.beginPath();
        ctx.roundRect(-hw - 1, -hh - 1, def.w + 2, capH, [r, r, 6, 6]);
        ctx.fillStyle = def.style === 'moss' ? '#10b981' : '#58d638';
        ctx.fill();
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#14532d';
        ctx.stroke();
      } else if (def.style === 'citadel') {
        ctx.beginPath();
        ctx.roundRect(-hw, -hh, def.w, 12, [r, r, 2, 2]);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
      }

      ctx.restore();
    };

    const drawTrianglePeak = (tri: (typeof level.triangles)[number], body: Matter.Body) => {
      ctx.save();
      const verts = body.vertices;
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < verts.length; i++) {
        ctx.lineTo(verts[i].x, verts[i].y);
      }
      ctx.closePath();

      const grad = ctx.createLinearGradient(tri.x, tri.y - tri.h * 0.6, tri.x, tri.y + tri.h * 0.4);
      grad.addColorStop(0, '#4ade80');
      grad.addColorStop(0.26, '#22c55e');
      grad.addColorStop(0.28, '#78350f');
      grad.addColorStop(1, '#451a03');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = '#14532d';
      ctx.stroke();
      ctx.restore();
    };

    const drawEarthSprite = (
      x: number,
      y: number,
      r: number,
      angle: number,
      speed: number,
      stung: boolean
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      if (skin.id === 'classic' && earthSpriteCanvas) {
        const size = r * 2.55;
        if (stung || phase === 'LOST') {
          ctx.filter = 'grayscale(30%) brightness(0.9)';
        }
        ctx.drawImage(earthSpriteCanvas, -size / 2, -size / 2, size, size);
        ctx.filter = 'none';

        if (stung || phase === 'LOST') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, -r * 0.85, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Fredoka, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('!', 0, -r * 0.85);
        } else if (phase === 'GRAVITY' && speed > 1.4) {
          // Subtle sweat drop when falling fast
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(r * 0.85, -r * 0.65, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        return;
      }

      // Paid skins custom Earth rendering
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.15, 0, 0, r);
      grad.addColorStop(0, '#7dd3fc');
      grad.addColorStop(0.55, skin.oceanColor);
      grad.addColorStop(1, '#1458a8');

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = skin.landColor;
      ctx.beginPath();
      ctx.ellipse(-r * 0.48, -r * 0.42, r * 0.38, r * 0.24, -0.35, 0, Math.PI * 2);
      ctx.ellipse(r * 0.46, -r * 0.38, r * 0.32, r * 0.26, 0.4, 0, Math.PI * 2);
      ctx.ellipse(r * 0.38, r * 0.48, r * 0.34, r * 0.22, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0f2942';
      ctx.stroke();

      const ex = r * 0.31;
      const ey = -r * 0.06;
      ctx.fillStyle = '#0b132b';
      ctx.beginPath();
      ctx.ellipse(-ex, ey, r * 0.16, r * 0.2, 0, 0, Math.PI * 2);
      ctx.ellipse(ex, ey, r * 0.16, r * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-ex - r * 0.05, ey - r * 0.06, r * 0.065, 0, Math.PI * 2);
      ctx.arc(ex - r * 0.05, ey - r * 0.06, r * 0.065, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.arc(0, r * 0.22, r * 0.2, 0, Math.PI);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const drawHive = (hive: (typeof level.hives)[number], timeSec: number) => {
      const shake =
        phase === 'ATTACKING' ? Math.sin(timeSec * 36) * 2.5 : Math.sin(timeSec * 2) * 1.2;
      ctx.save();

      ctx.strokeStyle = '#5d3a1a';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (hive.branchSide === 'right') {
        ctx.moveTo(WORLD_W + 10, hive.y - 42);
        ctx.quadraticCurveTo(hive.x + 40, hive.y - 36, hive.x - 20, hive.y - 30);
      } else if (hive.branchSide === 'left') {
        ctx.moveTo(-10, hive.y - 42);
        ctx.quadraticCurveTo(hive.x - 40, hive.y - 36, hive.x + 20, hive.y - 30);
      } else {
        ctx.moveTo(hive.x, -10);
        ctx.lineTo(hive.x, hive.y - 28);
      }
      ctx.stroke();

      ctx.translate(hive.x + shake, hive.y);
      const scale = hive.hasGiantBoss ? 1.15 : 0.95;
      ctx.scale(scale, scale);

      const tiers = [
        { y: -20, rx: 15, ry: 7.5 },
        { y: -10, rx: 22, ry: 8.5 },
        { y: 1, rx: 26, ry: 9.5 },
        { y: 12, rx: 20, ry: 8.5 },
        { y: 21, rx: 12, ry: 6.5 },
      ];
      for (const tier of tiers) {
        ctx.beginPath();
        ctx.ellipse(0, tier.y, tier.rx, tier.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = hive.hasGiantBoss ? '#f59e0b' : '#fbbf24';
        ctx.fill();
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = hive.hasGiantBoss ? '#7c2d12' : '#78350f';
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.ellipse(0, 6, 7.5, 8.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();

      ctx.restore();
    };

    const drawBee = (bee: BeeAgent, timeSec: number) => {
      const { x, y } = bee.body.position;
      const vx = bee.body.velocity.x;
      // User bee image faces LEFT; flip horizontally if flying right!
      const faceRight = vx > 0.15 ? -1 : 1;
      const bob = Math.sin(timeSec * 30 + bee.seed) * 2.5;
      const size = bee.isBoss ? 72 : 34;

      ctx.save();
      ctx.translate(x, y + bob);

      if (bee.isBoss) {
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fill();
      }

      if (beeSpriteCanvas) {
        ctx.save();
        ctx.scale(faceRight, 1);
        ctx.drawImage(beeSpriteCanvas, -size / 2, -size / 2, size, size);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, bee.isBoss ? 22 : 10, 0, Math.PI * 2);
        ctx.fillStyle = '#facc15';
        ctx.fill();
      }

      // Golden Crown on Giant Boss Bee
      if (bee.isBoss) {
        ctx.beginPath();
        ctx.moveTo(-12, -26);
        ctx.lineTo(-14, -38);
        ctx.lineTo(-4, -31);
        ctx.lineTo(0, -41);
        ctx.lineTo(4, -31);
        ctx.lineTo(14, -38);
        ctx.lineTo(12, -26);
        ctx.closePath();
        ctx.fillStyle = '#fde047';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#713f12';
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawPurpleWater = (timeSec: number) => {
      const yBase = level.waterY;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, WORLD_H);
      ctx.lineTo(0, yBase);
      for (let x = 0; x <= WORLD_W; x += 20) {
        const wave = Math.sin(x * 0.04 + timeSec * 4) * 3.5;
        ctx.lineTo(x, yBase + wave);
      }
      ctx.lineTo(WORLD_W, WORLD_H);
      ctx.closePath();

      const wGrad = ctx.createLinearGradient(0, yBase, 0, WORLD_H);
      wGrad.addColorStop(0, 'rgba(192, 38, 211, 0.72)');
      wGrad.addColorStop(0.4, 'rgba(147, 51, 234, 0.85)');
      wGrad.addColorStop(1, 'rgba(76, 29, 149, 0.94)');
      ctx.fillStyle = wGrad;
      ctx.fill();

      ctx.beginPath();
      for (let x = 0; x <= WORLD_W; x += 20) {
        const wave = Math.sin(x * 0.04 + timeSec * 4) * 3.5;
        if (x === 0) ctx.moveTo(x, yBase + wave);
        else ctx.lineTo(x, yBase + wave);
      }
      ctx.strokeStyle = '#f0abfc';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      for (const b of bubbles) {
        const by = b.y - ((timeSec * b.speed + b.phase * 15) % 42);
        const bx = b.x + Math.sin(timeSec * 2 + b.phase) * 5;
        ctx.beginPath();
        ctx.arc(bx, Math.max(yBase - 4, by), b.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(240, 171, 252, 0.38)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(253, 244, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawGravityArrows = (timeSec: number) => {
      const activeFalling =
        phase === 'GRAVITY' || earthBodies.some((eb) => Math.abs(eb.body.velocity.y) > 1.0);
      if (!activeFalling) return;

      ctx.save();
      const arrowXs = [WORLD_W * 0.4, WORLD_W * 0.6];
      arrowXs.forEach((ax, idx) => {
        const offset = ((timeSec * 95 + idx * 45) % 90) - 20;
        const ay = 265 + offset;
        const alpha = Math.max(0, 0.75 - Math.abs(offset - 35) / 80);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
        ctx.strokeStyle = `rgba(14, 116, 144, ${(alpha * 0.65).toFixed(2)})`;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(ax - 9, ay);
        ctx.lineTo(ax + 9, ay);
        ctx.lineTo(ax + 9, ay + 22);
        ctx.lineTo(ax + 18, ay + 22);
        ctx.lineTo(ax, ay + 44);
        ctx.lineTo(ax - 18, ay + 22);
        ctx.lineTo(ax - 9, ay + 22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();
    };

    const drawSmoothStroke = (pts: Vec2[]) => {
      if (pts.length < 2) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const tracePath = () => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const midX = (pts[i].x + pts[i + 1].x) / 2;
          const midY = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        const last = pts[pts.length - 1];
        ctx.lineTo(last.x, last.y);
      };

      tracePath();
      ctx.strokeStyle = inkStyle.outlineColor;
      ctx.lineWidth = 14;
      ctx.stroke();

      tracePath();
      ctx.strokeStyle = inkStyle.strokeColor;
      ctx.lineWidth = 9.5;
      ctx.stroke();

      tracePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    };

    const drawSolutionGuide = (timeSec: number) => {
      if (!showSolutionRef.current || phase !== 'DRAWING' || level.solutionPath.length < 2) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([12, 10]);
      ctx.lineDashOffset = -timeSec * 38;

      ctx.beginPath();
      ctx.moveTo(level.solutionPath[0].x, level.solutionPath[0].y);
      for (let i = 1; i < level.solutionPath.length; i++) {
        ctx.lineTo(level.solutionPath[i].x, level.solutionPath[i].y);
      }

      ctx.strokeStyle = 'rgba(14, 165, 233, 0.9)';
      ctx.lineWidth = 11;
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 5.5;
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(level.solutionPath[0].x, level.solutionPath[0].y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#22c55e';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.restore();
    };

    let rafId = 0;
    let lastTs = performance.now();

    const frame = (now: number) => {
      const dtSec = Math.min(0.033, (now - lastTs) / 1000);
      lastTs = now;
      const timeSec = now / 1000;

      if (!pausedRef.current) {
        if (phase === 'GRAVITY' || phase === 'ATTACKING' || phase === 'WON' || phase === 'LOST') {
          Matter.Engine.update(engine, 1000 / 60);
        }

        if (phase === 'GRAVITY' || phase === 'ATTACKING') {
          simElapsed += dtSec;

          if (simElapsed >= 0.6 && !beesSpawned) {
            spawnBees();
          }

          if (phase === 'ATTACKING') {
            for (const bee of beeAgents) {
              if (simElapsed < bee.recoilUntil) continue;
              let nearest = earthBodies[0];
              let bestDist = Infinity;
              for (const eb of earthBodies) {
                const d = Math.hypot(
                  eb.body.position.x - bee.body.position.x,
                  eb.body.position.y - bee.body.position.y
                );
                if (d < bestDist) {
                  bestDist = d;
                  nearest = eb;
                }
              }
              if (nearest) {
                const dx = nearest.body.position.x - bee.body.position.x;
                const dy = nearest.body.position.y - bee.body.position.y;
                const dist = Math.max(1, Math.hypot(dx, dy));
                const nx = dx / dist;
                const ny = dy / dist;
                const buzz = Math.sin(simElapsed * 10 + bee.seed) * 0.35;
                Matter.Body.applyForce(bee.body, bee.body.position, {
                  x: (nx - ny * buzz) * bee.force,
                  y: (ny + nx * buzz) * bee.force,
                });

                const maxSpd = bee.speed * 1.45;
                const curSpd = Math.hypot(bee.body.velocity.x, bee.body.velocity.y);
                if (curSpd > maxSpd) {
                  Matter.Body.setVelocity(bee.body, {
                    x: (bee.body.velocity.x / curSpd) * maxSpd,
                    y: (bee.body.velocity.y / curSpd) * maxSpd,
                  });
                }
              }
            }
          }

          for (const eb of earthBodies) {
            const { x, y } = eb.body.position;
            if (y + eb.radius * 0.55 >= level.waterY || y > WORLD_H + 40) {
              spawnParticles(x, level.waterY - 4, '#e879f9', 22, 160);
              triggerEnd(false, 'Earth fell into the toxic river!');
              break;
            }
            for (const sp of level.spikes) {
              if (
                x + eb.radius * 0.72 > sp.x - sp.w / 2 &&
                x - eb.radius * 0.72 < sp.x + sp.w / 2 &&
                y + eb.radius * 0.72 > sp.y - sp.h / 2 &&
                y - eb.radius * 0.72 < sp.y + sp.h / 2
              ) {
                eb.stung = true;
                spawnParticles(x, y, '#ef4444', 18, 140);
                triggerEnd(false, 'Earth touched the canyon spikes!');
                break;
              }
            }
          }

          const remain = Math.max(0, level.surviveSeconds - simElapsed);
          callbacksRef.current.onTimerUpdate(remain);
          if (remain <= 0 && !endScheduled) {
            triggerEnd(true, 'Earth is safe!');
          }
        }

        if (endScheduled && endResult) {
          endTimer -= dtSec;
          if (endTimer <= 0) {
            const earnedStars = endResult.won
              ? strokeLength <= level.star3Ink
                ? 3
                : strokeLength <= level.star2Ink
                  ? 2
                  : 1
              : 0;
            const res = endResult;
            endResult = null;
            callbacksRef.current.onEnd(res.won, res.reason, earnedStars);
          }
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life += dtSec;
          p.x += p.vx * dtSec;
          p.y += p.vy * dtSec;
          p.vy += 260 * dtSec;
          if (p.life >= p.maxLife) {
            particles.splice(i, 1);
          }
        }
      }

      ctx.clearRect(0, 0, WORLD_W, WORLD_H);

      if (bgLoaded) {
        ctx.drawImage(bgImage, 0, 0, WORLD_W, WORLD_H);
      } else {
        const sky = ctx.createLinearGradient(0, 0, 0, WORLD_H);
        sky.addColorStop(0, '#38bdf8');
        sky.addColorStop(1, '#bae6fd');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      }

      if (level.windX !== 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.32)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        const dir = Math.sign(level.windX);
        for (let i = 0; i < 6; i++) {
          const wx =
            (((timeSec * 140 * dir + i * 130) % (WORLD_W + 100)) + WORLD_W + 100) %
              (WORLD_W + 100) -
            50;
          const wy = 240 + i * 70;
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(wx + 42 * dir, wy);
          ctx.stroke();
        }
        ctx.restore();
      }

      drawGravityArrows(timeSec);
      drawSolutionGuide(timeSec);

      for (const sp of level.spikes) {
        ctx.save();
        const count = Math.max(3, Math.floor(sp.w / 16));
        const sw = sp.w / count;
        const left = sp.x - sp.w / 2;
        const base = sp.y + sp.h / 2;
        const tip = sp.y - sp.h / 2;
        for (let i = 0; i < count; i++) {
          ctx.beginPath();
          ctx.moveTo(left + i * sw, base);
          ctx.lineTo(left + (i + 0.5) * sw, tip);
          ctx.lineTo(left + (i + 1) * sw, base);
          ctx.closePath();
          ctx.fillStyle = '#e11d48';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#4c0519';
          ctx.stroke();
        }
        ctx.restore();
      }

      for (const tb of terrainBodies) {
        drawTerrainBlock(tb.def, tb.body);
      }

      for (const tri of triangleBodies) {
        drawTrianglePeak(tri.def, tri.body);
      }

      for (const sw of seesawBodies) {
        ctx.save();
        ctx.translate(sw.body.position.x, sw.body.position.y);
        ctx.rotate(sw.body.angle);
        ctx.beginPath();
        ctx.roundRect(-sw.def.w / 2, -sw.def.h / 2, sw.def.w, sw.def.h, 8);
        ctx.fillStyle = '#d97706';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#451a03';
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(sw.def.x, sw.def.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1e293b';
        ctx.stroke();
      }

      for (const pin of pinBodies) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pin.def.x, pin.def.y, pin.def.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();
        ctx.lineWidth = 3.2;
        ctx.strokeStyle = '#334155';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pin.def.x, pin.def.y, pin.def.radius * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = '#64748b';
        ctx.fill();
        ctx.restore();
      }

      for (const prop of propBodies) {
        ctx.save();
        ctx.translate(prop.body.position.x, prop.body.position.y);
        ctx.rotate(prop.body.angle);
        if (prop.def.shape === 'boulder') {
          ctx.beginPath();
          ctx.arc(0, 0, prop.def.size, 0, Math.PI * 2);
          ctx.fillStyle = '#64748b';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#1e293b';
          ctx.stroke();
        } else {
          const s = prop.def.size * 1.9;
          ctx.beginPath();
          ctx.roundRect(-s / 2, -s / 2, s, s, 6);
          ctx.fillStyle = '#b45309';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#451a03';
          ctx.stroke();
        }
        ctx.restore();
      }

      if (pet.id !== 'none') {
        const px = 48;
        const py = 335 + Math.sin(timeSec * 3.2) * 6;
        ctx.save();
        ctx.translate(px, py);
        ctx.beginPath();
        ctx.ellipse(0, 14, 20, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fillStyle = pet.color;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-4.5, -2, 2.2, 0, Math.PI * 2);
        ctx.arc(4.5, -2, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (const eb of earthBodies) {
        const spd = Math.hypot(eb.body.velocity.x, eb.body.velocity.y);
        drawEarthSprite(
          eb.body.position.x,
          eb.body.position.y,
          eb.radius,
          eb.body.angle,
          spd,
          eb.stung
        );
      }

      if (phase === 'DRAWING') {
        drawSmoothStroke(strokePoints);
        if (isDrawing && pointerPos) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(pointerPos.x, pointerPos.y, 15, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#0ea5e9';
          ctx.stroke();
          ctx.restore();
        }
      } else if (barrierBody && strokePoints.length >= 2) {
        ctx.save();
        const subParts = barrierBody.parts.slice(1);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const pass of [
          { color: inkStyle.outlineColor, width: 14 },
          { color: inkStyle.strokeColor, width: 9.5 },
        ]) {
          ctx.strokeStyle = pass.color;
          ctx.lineWidth = pass.width;
          for (const part of subParts) {
            const verts = part.vertices;
            const pA = { x: (verts[0].x + verts[3].x) / 2, y: (verts[0].y + verts[3].y) / 2 };
            const pB = { x: (verts[1].x + verts[2].x) / 2, y: (verts[1].y + verts[2].y) / 2 };
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      for (const hive of level.hives) {
        drawHive(hive, timeSec);
      }
      for (const bee of beeAgents) {
        drawBee(bee, timeSec);
      }

      drawPurpleWater(timeSec);

      for (const p of particles) {
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      Matter.Events.off(engine, 'collisionStart');
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
    };
  }, [level, attemptId, equippedSkinId, equippedInkId, equippedPetId]);

  return (
    <canvas
      ref={canvasRef}
      width={WORLD_W}
      height={WORLD_H}
      className="w-full h-full object-fill touch-none cursor-crosshair block"
    />
  );
};

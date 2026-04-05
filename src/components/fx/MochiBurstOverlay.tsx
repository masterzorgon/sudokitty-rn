import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Image, StyleSheet, useWindowDimensions, View } from "react-native";

import { PARTICLE_COUNT } from "../../constants/mochiBurst";
import { fireBurstComplete, fireMochiArrival, useFXStore } from "../../stores/fxStore";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { playFeedback } from "../../utils/feedback";

/**
 * Sprite burst (safe path per mochi-burst-debug-journal.md): RN `Image` + `require()`, positions/opacity from
 * the same RAF/JS state as before. Do not drive this asset through Skia Picture/useImage or Reanimated
 * useFrameCallback — those paths crashed in native stacks.
 */
const MOCHI_BURST_SPRITE = require("../../../assets/images/icons/mochi-point-sprite.png");
/** Source art 51×44; keep aspect when scaling. */
const MOCHI_SPRITE_ASPECT = 44 / 51;

/** Must exceed max(delay + activeDuration) or the sim ends in a timeout while particles are still mid-flight. */
const MAX_BURST_MS = 10000;
const DT_CAP_MS = 100;
/** Global motion scale (initial velocity multiplier; paired with GRAVITY / SEEK). */
const SPEED_SCALE = 1;
const GRAVITY = 599;
const SEEK_STRENGTH = 800;
/** Extra delay per particle index so mochis reach the pill in sequence, not one blob. */
const STAGGER_DELAY_S = 0.08;
const DEAD_DIST_PX = 20;
const FADE_START_DIST = 100;
/** Visible life after delay — fade from 0 → 1 over this many seconds of simulation time. */
const OPACITY_EASE_IN_S = 0.12;
/** Spawn cluster width (px) around biased center. */
const SPAWN_X_JITTER_PX = 110;
/** Pull spawn cluster horizontally toward pill. */
const SPAWN_X_PULL_K = 0.093;
/** Initial horizontal velocity: bias toward target + noise (before SPEED_SCALE). */
const INITIAL_XVEL_BIAS_K = 0.11;
/** Random lateral noise on top of bias (before SPEED_SCALE). */
const INITIAL_X_NOISE_PX = 171;
const RENDER_EVERY_N_FRAMES = 2;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Smoothstep 0..1 for seek blend (no flat ballistic phase). */
function smoothstep01(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export interface MochiParticleState {
  spawnX: number;
  spawnY: number;
  x: number;
  y: number;
  xVel: number;
  yVel: number;
  scale: number;
  opacity: number;
  delay: number;
  activeDuration: number;
  dead: boolean;
  hasTarget: boolean;
  /** Final alpha for Image (includes ease-in; physics uses `opacity`). */
  displayOpacity: number;
}

function buildInitialMochis(
  count: number,
  sw: number,
  sh: number,
  targetCenter: { x: number; y: number } | null,
): MochiParticleState[] {
  const particles: MochiParticleState[] = [];
  const hasTarget = targetCenter !== null;
  const tx = targetCenter?.x ?? sw * 0.88;
  const ty = targetCenter?.y ?? 52;

  for (let i = 0; i < count; i++) {
    const midX = sw * 0.5;
    const spawnX =
      midX + (tx - midX) * SPAWN_X_PULL_K + randomRange(-SPAWN_X_JITTER_PX, SPAWN_X_JITTER_PX);
    const spawnY = sh - randomRange(32, 64);
    const delay = i * STAGGER_DELAY_S + randomRange(0, 0.028);
    const dx = tx - spawnX;
    const dy = ty - spawnY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Estimate time-to-target from initial distance. Do not cap too low: long bottom→header paths need >1.2s
    // or particles hit pe > activeDuration and vanish before reaching the pill.
    // Half-speed motion needs ~2× lifetime so particles can still reach the pill.
    const travelTime = hasTarget ? clamp(dist / 315, 0.58, 2.55) * 2 : 0.82 + randomRange(0, 0.12);
    const activeDuration = travelTime + randomRange(0, 0.16);

    const toTargetX = tx - spawnX;
    const xVel =
      (toTargetX * INITIAL_XVEL_BIAS_K + randomRange(-INITIAL_X_NOISE_PX, INITIAL_X_NOISE_PX)) *
      SPEED_SCALE;
    const yVel = randomRange(-440, -300) * SPEED_SCALE;

    particles.push({
      spawnX,
      spawnY,
      x: spawnX,
      y: spawnY,
      xVel,
      yVel,
      scale: 1,
      opacity: 1,
      delay,
      activeDuration,
      dead: false,
      hasTarget,
      displayOpacity: 0,
    });
  }
  return particles;
}

/** One simulation step (plain JS — no Reanimated worklets / useFrameCallback / AnimationFrameBatchinator). */
function simulateParticles(
  parts: MochiParticleState[],
  tBurst: number,
  sw: number,
  target: { x: number; y: number } | null,
  dt: number,
  onArrival?: (index: number) => void,
): void {
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.dead) continue;

    if (tBurst < p.delay) {
      p.x = p.spawnX;
      p.y = p.spawnY;
      p.displayOpacity = 0;
      continue;
    }

    const pe = tBurst - p.delay;

    const tx = target?.x ?? sw * 0.88;
    const ty = target?.y ?? 52;
    const canSeek = target !== null;

    let dx = tx - p.x;
    let dy = ty - p.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.001) dist = 0.001;

    if (pe > p.activeDuration) {
      /** Safety net: if particle expired near the target, count it as arrived. */
      if (canSeek && dist < FADE_START_DIST) {
        onArrival?.(i);
      }
      p.dead = true;
      p.displayOpacity = 0;
      continue;
    }

    const tNorm = p.activeDuration > 0.001 ? pe / p.activeDuration : 1;
    /** Seek ramps a bit later so spread reads wider before coalescing. */
    const wBlend = smoothstep01(clamp(tNorm / 0.66, 0, 1));

    const bvX = p.xVel;
    const bvY = p.yVel + GRAVITY * dt;

    if (canSeek) {
      const sx = (dx / dist) * SEEK_STRENGTH;
      const sy = (dy / dist) * SEEK_STRENGTH;
      p.xVel = bvX * (1 - wBlend) + sx * wBlend;
      p.yVel = bvY * (1 - wBlend) + sy * wBlend;
    } else {
      p.xVel = bvX;
      p.yVel = bvY;
      if (tNorm > 0.7) {
        p.opacity = Math.max(0, 1 - (tNorm - 0.7) / 0.3);
      }
    }

    p.x += p.xVel * dt;
    p.y += p.yVel * dt;

    if (canSeek && dist < FADE_START_DIST) {
      p.opacity = clamp(dist / FADE_START_DIST, 0, 1);
      p.scale = clamp(0.35 + (dist / FADE_START_DIST) * 0.65, 0.35, 1);
    }

    if (canSeek && dist < DEAD_DIST_PX) {
      onArrival?.(i);
      p.dead = true;
      p.opacity = 0;
      p.displayOpacity = 0;
      continue;
    }

    const easeIn = clamp(pe / OPACITY_EASE_IN_S, 0, 1);
    p.displayOpacity = p.opacity * easeIn;
  }
}

function shallowSnapshot(parts: MochiParticleState[]): MochiParticleState[] {
  return parts.map((p) => ({ ...p }));
}

/** Base width for sprite; height follows MOCHI_SPRITE_ASPECT. */
const BASE_SPRITE_WIDTH_PX = 28;

export function MochiBurstOverlay() {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const burstId = useFXStore((s) => s.burstId);
  const burstAmount = useFXStore((s) => s.burstAmount);

  const [renderParticles, setRenderParticles] = useState<MochiParticleState[]>([]);

  const particlesRef = useRef<MochiParticleState[]>([]);
  const burstElapsedRef = useRef(0);
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const screenRef = useRef({ w: width, h: height });
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const simActiveRef = useRef(false);

  useLayoutEffect(() => {
    screenRef.current = { w: width, h: height };
  }, [width, height]);

  useEffect(() => {
    const unsub = useFXStore.subscribe((state, prev) => {
      if (state.targetLayout !== prev.targetLayout) {
        const l = state.targetLayout;
        targetRef.current = l ? { x: l.x + l.width / 2, y: l.y + l.height / 2 } : null;
      }
    });
    const l = useFXStore.getState().targetLayout;
    targetRef.current = l ? { x: l.x + l.width / 2, y: l.y + l.height / 2 } : null;
    return unsub;
  }, []);

  const cancelSim = useCallback(() => {
    simActiveRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTsRef.current = null;
  }, []);

  const finishAndNotify = useCallback(() => {
    cancelSim();
    setRenderParticles([]);
    fireBurstComplete();
  }, [cancelSim, burstId]);

  useEffect(() => {
    if (burstId === 0) return;
    if (reducedMotion) {
      cancelSim();
      setRenderParticles([]);
      playFeedback("unitComplete");
      return;
    }

    const count = PARTICLE_COUNT(burstAmount);
    const layout = useFXStore.getState().targetLayout;
    const targetCenter = layout
      ? { x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 }
      : null;

    cancelSim();
    burstElapsedRef.current = 0;
    const initial = buildInitialMochis(count, width, height, targetCenter);
    particlesRef.current = initial;
    setRenderParticles(shallowSnapshot(initial));
    lastTsRef.current = null;
    simActiveRef.current = true;

    let renderTick = 0;
    const tick = (ts: number) => {
      if (!simActiveRef.current) return;

      const last = lastTsRef.current;
      lastTsRef.current = ts;
      let dtMs = last === null ? 16 : ts - last;
      if (dtMs === 0 || dtMs > 64) dtMs = 16;
      dtMs = Math.min(dtMs, DT_CAP_MS);
      const dt = dtMs / 1000;

      burstElapsedRef.current += dt;
      const tBurst = burstElapsedRef.current;
      const { w: sw } = screenRef.current;
      const target = targetRef.current;

      /** Particles built before `targetLayout` exists use short `activeDuration`; extend once a real target is known. */
      if (target) {
        for (const p of particlesRef.current) {
          if (!p.hasTarget) {
            p.activeDuration = Math.max(p.activeDuration, 2.8);
          }
        }
      }

      simulateParticles(particlesRef.current, tBurst, sw, target, dt, () => {
        playFeedback("mochiArrival");
        fireMochiArrival();
      });

      renderTick++;
      if (renderTick === 1 || renderTick % RENDER_EVERY_N_FRAMES === 0) {
        setRenderParticles(shallowSnapshot(particlesRef.current));
      }

      const tMs = tBurst * 1000;
      const parts = particlesRef.current;
      let allDead = parts.length === 0;
      if (!allDead) {
        allDead = true;
        for (let i = 0; i < parts.length; i++) {
          if (!parts[i].dead) {
            allDead = false;
            break;
          }
        }
      }

      if ((allDead && parts.length > 0) || tMs >= MAX_BURST_MS) {
        finishAndNotify();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelSim();
    };
  }, [burstId, reducedMotion, burstAmount, width, height, cancelSim, finishAndNotify]);

  if (reducedMotion) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="none">
      {renderParticles.map((p, i) => {
        if (p.dead || p.displayOpacity <= 0) return null;
        const w = BASE_SPRITE_WIDTH_PX * p.scale;
        const h = w * MOCHI_SPRITE_ASPECT;
        return (
          <Image
            key={i}
            source={MOCHI_BURST_SPRITE}
            resizeMode="contain"
            style={[
              styles.particle,
              {
                width: w,
                height: h,
                opacity: p.displayOpacity,
                transform: [{ translateX: p.x - w / 2 }, { translateY: p.y - h / 2 }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  particle: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import {
  runOnJS,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type FrameInfo,
} from "react-native-reanimated";
import { Canvas, Picture, Skia } from "@shopify/react-native-skia";

import { useColors } from "../../theme/colors";
import { delays, durations } from "../../theme/animations";

const DEFAULT_COUNT = 60;
const NUM_WAVES = 4;
const FALL_SPEED = 0.7;
const GRAVITY = 380 * FALL_SPEED;
const ELASTICITY = 0.6;
const BUFFER = 25;
const DT_CAP_MS = 33;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hn = (((h % 360) + 360) % 360) / 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hn * 12) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => clamp(n, 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function buildAccentHueColors(count: number, accentHex: string): string[] {
  const { r, g, b } = parseHexColor(accentHex);
  const { h: baseH, s: baseS, l: baseL } = rgbToHsl(r, g, b);
  const out: string[] = [];
  const hueSpread = 32;
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0.5;
    const hueShift = (t - 0.5) * hueSpread;
    const h = (baseH + hueShift + 360) % 360;
    const s = clamp(baseS * (0.88 + 0.12 * Math.sin(i * 1.7)), 0.28, 0.98);
    const l = clamp(baseL * (0.82 + 0.18 * Math.cos(i * 2.3)), 0.38, 0.9);
    const rgb = hslToRgb(h, s, l);
    out.push(rgbToHex(rgb.r, rgb.g, rgb.b));
  }
  return out;
}

export interface ConfettoState {
  x: number;
  y: number;
  xVel: number;
  yVel: number;
  rotation: number;
  rotVel: number;
  flipAngle: number;
  flipVel: number;
  delay: number;
  dead: boolean;
  w: number;
  h: number;
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function buildInitialPieces(count: number, screenW: number): ConfettoState[] {
  const perWave = Math.ceil(count / NUM_WAVES);
  const pieces: ConfettoState[] = [];

  for (let i = 0; i < count; i++) {
    const wave = Math.floor(i / perWave);
    const waveT = NUM_WAVES > 1 ? wave / (NUM_WAVES - 1) : 0;
    const delaySec =
      (delays.confettiMin + waveT * (delays.confettiMax - delays.confettiMin)) / 1000;

    const leftCannon = i % 2 === 0;
    const spawnX = (leftCannon ? screenW * 0.15 : screenW * 0.85) + randomRange(-20, 20);
    const spawnY = randomRange(-28, 4);

    const w = randomRange(6, 10);
    const h = randomRange(10, 16);

    pieces.push({
      x: spawnX,
      y: spawnY,
      xVel: randomRange(-75, 75),
      yVel: randomRange(-220 * FALL_SPEED, 160),
      rotation: randomRange(0, Math.PI * 2),
      rotVel: randomRange(-2, 2),
      flipAngle: randomRange(0, Math.PI * 2),
      flipVel: randomRange(1, 3),
      delay: delaySec,
      dead: false,
      w,
      h,
    });
  }

  return pieces;
}

export interface ConfettiCannonProps {
  count?: number;
  onComplete?: () => void;
}

export function ConfettiCannon({ count = DEFAULT_COUNT, onComplete }: ConfettiCannonProps) {
  const c = useColors();
  const { width, height } = useWindowDimensions();

  const colorHexList = useMemo(
    () => buildAccentHueColors(count, c.accent as string),
    [count, c.accent],
  );
  const colorsRef = useSharedValue(colorHexList);
  useLayoutEffect(() => {
    colorsRef.value = colorHexList;
  }, [colorHexList, colorsRef]);

  const state = useSharedValue<ConfettoState[]>(buildInitialPieces(count, width));
  const screenW = useSharedValue(width);
  const screenH = useSharedValue(height);
  const totalElapsed = useSharedValue(0);
  const finished = useSharedValue(false);
  const tick = useSharedValue(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const frameCallbackRef = useRef<ReturnType<typeof useFrameCallback> | null>(null);

  const finishAndNotify = useCallback(() => {
    frameCallbackRef.current?.setActive(false);
    onCompleteRef.current?.();
  }, []);

  const physicsStep = useCallback(
    (frameInfo: FrameInfo) => {
      "worklet";
      if (finished.value) {
        return;
      }

      let dtMs = frameInfo.timeSincePreviousFrame;
      if (dtMs === null || dtMs === 0) {
        dtMs = 16;
      }
      dtMs = Math.min(dtMs, DT_CAP_MS);
      const dt = dtMs / 1000;
      totalElapsed.value += dt;

      const maxDurationS = (durations.confettiFall * 2 + 800) / 1000 / FALL_SPEED;
      const sw = screenW.value;
      const sh = screenH.value;

      state.modify((value) => {
        "worklet";
        for (let i = 0; i < value.length; i++) {
          const p = value[i];
          if (p.dead) {
            continue;
          }

          p.delay -= dt;
          if (p.delay > 0) {
            continue;
          }

          p.yVel += GRAVITY * dt;
          p.y += p.yVel * dt;
          p.x += p.xVel * dt;
          p.rotation += p.rotVel * dt;
          p.flipAngle += p.flipVel * dt;

          if (p.x < 0) {
            p.x = 0;
            p.xVel *= -ELASTICITY;
          }
          if (p.x + p.w > sw) {
            p.x = sw - p.w;
            p.xVel *= -ELASTICITY;
          }

          if (p.y > sh + BUFFER) {
            p.dead = true;
          }
        }
        return value;
      });

      tick.value = tick.value + 1;

      const v = state.value;
      let deadCount = 0;
      for (let i = 0; i < v.length; i++) {
        if (v[i].dead) {
          deadCount++;
        }
      }

      const timedOut = totalElapsed.value > maxDurationS;
      if (deadCount === v.length || timedOut) {
        finished.value = true;
        runOnJS(finishAndNotify)();
      }
    },
    [finishAndNotify, state, screenW, screenH, totalElapsed, finished, tick],
  );

  const frameCallback = useFrameCallback(physicsStep, true);
  frameCallbackRef.current = frameCallback;

  useLayoutEffect(() => {
    screenW.value = width;
    screenH.value = height;
  }, [width, height, screenW, screenH]);

  useLayoutEffect(() => {
    state.value = buildInitialPieces(count, width);
    totalElapsed.value = 0;
    finished.value = false;
    tick.value = 0;
  }, [count, width, height, state, totalElapsed, finished, tick]);

  const picture = useDerivedValue(() => {
    "worklet";
    void tick.value;
    const pieces = state.value;
    const sw = screenW.value;
    const sh = screenH.value;
    const colors = colorsRef.value;

    const rec = Skia.PictureRecorder();
    const canvas = rec.beginRecording(Skia.XYWHRect(0, 0, sw, sh));
    const paint = Skia.Paint();

    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      if (p.dead || p.delay > 0) continue;

      paint.setColor(Skia.Color(colors[i % colors.length]));

      canvas.save();
      canvas.translate(p.x + p.w / 2, p.y + p.h / 2);
      canvas.rotate((p.rotation * 180) / Math.PI, 0, 0);
      const sx = Math.cos(p.flipAngle);
      const scaleX = Math.abs(sx) < 0.08 ? (sx >= 0 ? 0.08 : -0.08) : sx;
      canvas.scale(scaleX, 1);
      canvas.translate(-p.w / 2, -p.h / 2);
      canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(0, 0, p.w, p.h), 2, 2), paint);
      canvas.restore();
    }

    return rec.finishRecordingAsPicture();
  });

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Canvas style={{ width, height }}>
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});

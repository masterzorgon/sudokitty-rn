import * as session from './audioSessionManager';

let Audio: typeof import('expo-av').Audio | null = null;

let demoSound: any | null = null;
let progressInterval: ReturnType<typeof setInterval> | null = null;
let fadeInterval: ReturnType<typeof setInterval> | null = null;
let endTimeout: ReturnType<typeof setTimeout> | null = null;

const FADE_DURATION_MS = 2000;
const FADE_STEP_MS = 200;
const PROGRESS_STEP_MS = 100;
const BASE_VOLUME = 0.5;

async function ensureAudio(): Promise<boolean> {
  if (!Audio) {
    try {
      const av = await import('expo-av');
      Audio = av.Audio;
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

export interface DemoCallbacks {
  onProgress?: (fraction: number) => void;
  onComplete?: () => void;
}

export async function playDemo(
  asset: number,
  durationMs: number = 20000,
  callbacks?: DemoCallbacks,
): Promise<void> {
  await stopDemo();

  const audioModuleReady = await ensureAudio();
  if (!audioModuleReady || !Audio) {
    return;
  }

  try {
    await session.acquire();

    const { sound } = await Audio.Sound.createAsync(asset, {
      shouldPlay: true,
      volume: BASE_VOLUME,
    });
    demoSound = sound;

    const startTime = Date.now();
    const fadeStartMs = durationMs - FADE_DURATION_MS;

    progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const fraction = Math.min(1, elapsed / durationMs);
      callbacks?.onProgress?.(fraction);

      if (elapsed >= fadeStartMs && !fadeInterval) {
        startFade(durationMs - elapsed);
      }
    }, PROGRESS_STEP_MS);

    endTimeout = setTimeout(async () => {
      const wasSound = demoSound;
      clearTimers();
      if (wasSound) {
        try { await wasSound.setVolumeAsync(0); } catch {}
        try { await wasSound.unloadAsync(); } catch {}
      }
      demoSound = null;
      await session.release();
      callbacks?.onComplete?.();
    }, durationMs);
  } catch {
    demoSound = null;
    await session.release();
  }
}

function startFade(remainingMs: number) {
  if (!demoSound || fadeInterval) return;
  const steps = Math.max(1, Math.floor(remainingMs / FADE_STEP_MS));
  const volumeStep = BASE_VOLUME / steps;
  let currentVolume = BASE_VOLUME;

  fadeInterval = setInterval(() => {
    currentVolume = Math.max(0, currentVolume - volumeStep);
    if (demoSound) {
      try { demoSound.setStatusAsync({ volume: currentVolume }); } catch {}
    }
    if (currentVolume <= 0 && fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = null;
    }
  }, FADE_STEP_MS);
}

function clearTimers() {
  if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
  if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null; }
  if (endTimeout) { clearTimeout(endTimeout); endTimeout = null; }
}

export async function stopDemo(): Promise<void> {
  clearTimers();
  if (demoSound) {
    try { await demoSound.setVolumeAsync(0); } catch {}
    try { await demoSound.unloadAsync(); } catch {}
    demoSound = null;
    await session.release();
  }
}

export function isDemoPlaying(): boolean {
  return demoSound !== null;
}

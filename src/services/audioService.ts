// Audio service for background music playback
// Module-level singleton with no React dependency
// Handles loading, playback, fading, and cleanup

// Lazy-loaded to prevent crash when native module isn't built yet
// Run `npx expo run:ios` to rebuild with expo-av native module
let Audio: typeof import('expo-av').Audio | null = null;
let InterruptionModeIOS: typeof import('expo-av').InterruptionModeIOS | null = null;

async function ensureAudioModule() {
  if (!Audio) {
    try {
      const av = await import('expo-av');
      Audio = av.Audio;
      InterruptionModeIOS = av.InterruptionModeIOS;
      return true;
    } catch {
      console.warn('[audioService] expo-av native module not available. Rebuild with: npx expo run:ios');
      return false;
    }
  }
  return true;
}

// ============================================
// Types & Constants
// ============================================

const FADE_DURATION_MS = 500;
const FADE_STEPS = 10;
const CROSSFADE_MS = 300;
const MUSIC_VOLUME = 0.35;
const DEFAULT_ASSET = require('../../assets/audio/tracks/mochi-morning.m4a');

// ============================================
// Internal State
// ============================================

let sound: any | null = null;
let loaded = false;
let currentFade: { cancel: () => void } | null = null;

// ============================================
// Audio Session Configuration
// ============================================

/**
 * Configure iOS audio session
 * Call once at app startup (e.g., in app/_layout.tsx)
 */
export async function configureAudioSession(): Promise<void> {
  if (!await ensureAudioModule() || !Audio || !InterruptionModeIOS) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    });
  } catch (error) {
    console.warn('[audioService] Failed to configure audio session:', error);
  }
}

// ============================================
// Load/Unload
// ============================================

/**
 * Load the background music into memory.
 * @param asset - Metro asset number from require(). Falls back to default track.
 */
export async function loadBackgroundMusic(asset?: number): Promise<void> {
  if (loaded || sound) {
    return;
  }

  if (!await ensureAudioModule() || !Audio) return;
  try {
    const musicAsset = asset ?? DEFAULT_ASSET;
    const { sound: loadedSound } = await Audio.Sound.createAsync(
      musicAsset,
      {
        shouldPlay: false,
        isLooping: true,
        volume: 0,
      }
    );

    sound = loadedSound;
    loaded = true;
  } catch (error) {
    console.warn('[audioService] Failed to load background music:', error);
    sound = null;
    loaded = false;
  }
}

/**
 * Unload audio from memory
 * Safe to call multiple times
 */
export async function unload(): Promise<void> {
  if (currentFade) {
    currentFade.cancel();
    currentFade = null;
  }

  if (sound) {
    try {
      await sound.unloadAsync();
    } catch (error) {
      console.warn('[audioService] Failed to unload sound:', error);
    }
    sound = null;
    loaded = false;
  }
}

// ============================================
// Playback Control
// ============================================

/**
 * Play/resume at given volume (0-1)
 * No-op if not loaded
 */
export async function play(volume: number = 1.0): Promise<void> {
  if (!sound || !loaded) {
    return;
  }

  try {
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) {
      return;
    }

    await sound.setVolumeAsync(volume);

    if (!status.isPlaying) {
      await sound.playAsync();
    }
  } catch (error) {
    console.warn('[audioService] Failed to play sound:', error);
  }
}

/**
 * Pause playback
 * No-op if not playing
 */
export async function pause(): Promise<void> {
  if (!sound || !loaded) {
    return;
  }

  try {
    const status = await sound.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      await sound.pauseAsync();
    }
  } catch (error) {
    console.warn('[audioService] Failed to pause sound:', error);
  }
}

// ============================================
// Fade
// ============================================

/**
 * Fade volume from current to target over duration
 * Returns a cancel function
 */
export function fade(
  targetVolume: number,
  durationMs: number = FADE_DURATION_MS
): { cancel: () => void } {
  // Cancel any existing fade
  if (currentFade) {
    currentFade.cancel();
  }

  let cancelled = false;
  const stepTime = durationMs / FADE_STEPS;

  (async () => {
    if (!sound || !loaded) {
      return;
    }

    try {
      const status = await sound.getStatusAsync();
      if (!status.isLoaded || cancelled) {
        return;
      }

      const startVolume = status.volume ?? 0;
      const delta = (targetVolume - startVolume) / FADE_STEPS;

      for (let i = 1; i <= FADE_STEPS; i++) {
        if (cancelled) {
          return;
        }

        const newVolume = startVolume + delta * i;
        await sound.setVolumeAsync(Math.max(0, Math.min(1, newVolume)));
        await new Promise((resolve) => setTimeout(resolve, stepTime));
      }
    } catch (error) {
      console.warn('[audioService] Failed during fade:', error);
    }
  })();

  const cancelHandle = {
    cancel: () => {
      cancelled = true;
    },
  };

  currentFade = cancelHandle;
  return cancelHandle;
}

// ============================================
// Track Switching
// ============================================

/**
 * Crossfade to a different track.
 * Fades out current → unloads → loads new → fades in.
 * If not currently playing, swaps silently.
 */
export async function switchTrack(asset: number): Promise<void> {
  const wasPlaying = await isPlaying();

  if (wasPlaying) {
    fade(0, CROSSFADE_MS);
    await new Promise((r) => setTimeout(r, CROSSFADE_MS));
  }

  await unload();
  await loadBackgroundMusic(asset);

  if (wasPlaying) {
    await play(0);
    fade(MUSIC_VOLUME, CROSSFADE_MS);
  }
}

// ============================================
// Query State
// ============================================

export function isLoaded(): boolean {
  return loaded && sound !== null;
}

export async function isPlaying(): Promise<boolean> {
  if (!sound || !loaded) {
    return false;
  }

  try {
    const status = await sound.getStatusAsync();
    return status.isLoaded && status.isPlaying;
  } catch {
    return false;
  }
}

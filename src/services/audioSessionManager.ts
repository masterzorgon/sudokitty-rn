// Ref-counted iOS audio session manager.
// Activates the session when the first consumer needs audio,
// deactivates when the last consumer releases. Prevents pops
// caused by an always-active session being torn down by iOS.

let Audio: typeof import("expo-av").Audio | null = null;
let InterruptionModeIOS: typeof import("expo-av").InterruptionModeIOS | null = null;

async function ensureModule(): Promise<boolean> {
  if (!Audio) {
    try {
      const av = await import("expo-av");
      Audio = av.Audio;
      InterruptionModeIOS = av.InterruptionModeIOS;
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

let refCount = 0;
let sessionActive = false;
let releaseDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const RELEASE_DEBOUNCE_MS = 150;

/**
 * Acquire the audio session. Activates iOS audio hardware on first call.
 * Each acquire must be balanced by a release.
 */
export async function acquire(): Promise<void> {
  if (releaseDebounceTimer) {
    clearTimeout(releaseDebounceTimer);
    releaseDebounceTimer = null;
  }

  refCount += 1;
  if (sessionActive) return;

  if (!(await ensureModule()) || !Audio || !InterruptionModeIOS) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    });
    sessionActive = true;
  } catch (error) {
    console.warn("[audioSession] Failed to activate:", error);
  }
}

async function deactivateSessionIfIdle(): Promise<void> {
  if (refCount > 0 || !sessionActive) return;

  if (!(await ensureModule()) || !Audio || !InterruptionModeIOS) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    });
    sessionActive = false;
  } catch (error) {
    console.warn("[audioSession] Failed to deactivate:", error);
  }
}

/**
 * Release the audio session. Deactivates when refCount reaches 0 (debounced).
 * Debouncing absorbs rapid acquire/release cycles (e.g. hydration flicker).
 */
export async function release(): Promise<void> {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0) return;

  if (!sessionActive) return;

  if (releaseDebounceTimer) {
    clearTimeout(releaseDebounceTimer);
    releaseDebounceTimer = null;
  }

  releaseDebounceTimer = setTimeout(() => {
    releaseDebounceTimer = null;
    void deactivateSessionIfIdle();
  }, RELEASE_DEBOUNCE_MS);
}

export function isActive(): boolean {
  return sessionActive;
}

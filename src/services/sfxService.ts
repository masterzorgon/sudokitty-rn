// Sound effects service
// Pre-loads short audio clips and plays them on demand.
// Guarded: only loads when soundsEnabled is true. No load = no audio session = no pops.
// Uses audioSessionManager for ref-counted session lifecycle.

import { useSettingsStore, waitForSettingsHydration } from "../stores/settingsStore";
import * as session from "./audioSessionManager";

let Audio: typeof import("expo-av").Audio | null = null;

export type SfxId =
  | "correct"
  | "unitComplete"
  | "mistake"
  | "gameWon"
  | "gameLost"
  | "tap"
  | "erase"
  | "notesToggle"
  | "hint";

const SFX_ASSETS: Record<SfxId, number> = {
  correct: require("../../assets/audio/sfx/correct.m4a"),
  unitComplete: require("../../assets/audio/sfx/correct.m4a"),
  mistake: require("../../assets/audio/sfx/mistake.m4a"),
  gameWon: require("../../assets/audio/sfx/game-won.m4a"),
  gameLost: require("../../assets/audio/sfx/game-lost.m4a"),
  tap: require("../../assets/audio/sfx/tap.m4a"),
  erase: require("../../assets/audio/sfx/erase.m4a"),
  notesToggle: require("../../assets/audio/sfx/notes-toggle.m4a"),
  hint: require("../../assets/audio/sfx/hint.m4a"),
};

const SFX_VOLUME = 0.7;

const sounds: Partial<Record<SfxId, any>> = {};
let loaded = false;
let unloadInFlight: Promise<void> | null = null;

/**
 * Preload all SFX into memory.
 * Skipped when soundsEnabled is false — no audio session activation.
 */
export async function loadSfx(): Promise<void> {
  await waitForSettingsHydration();
  if (unloadInFlight) await unloadInFlight;
  if (loaded) return;
  if (!useSettingsStore.getState().soundsEnabled) return;

  if (!Audio) {
    try {
      const av = await import("expo-av");
      Audio = av.Audio;
    } catch {
      return;
    }
  }

  await session.acquire();

  await Promise.all(
    (Object.entries(SFX_ASSETS) as [SfxId, number][]).map(async ([id, asset]) => {
      try {
        const { sound } = await Audio!.Sound.createAsync(asset, {
          shouldPlay: false,
          volume: SFX_VOLUME,
        });
        sounds[id] = sound;
      } catch {
        // Missing asset — sfx will be a no-op for this id
      }
    }),
  );
  loaded = true;
}

export async function playSfx(id: SfxId, options?: { force?: boolean }): Promise<void> {
  if (!options?.force && !useSettingsStore.getState().soundsEnabled) return;

  // Lazy-load on first forced play if sounds were disabled at mount time
  if (!loaded && options?.force) {
    await loadSfxForce();
  }

  const sound = sounds[id];
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // swallow — non-critical
  }
}

/**
 * Force-load SFX regardless of settings (used for force-play on settings toggle).
 */
async function loadSfxForce(): Promise<void> {
  await waitForSettingsHydration();
  if (loaded) return;
  if (!Audio) {
    try {
      const av = await import("expo-av");
      Audio = av.Audio;
    } catch {
      return;
    }
  }

  await session.acquire();

  await Promise.all(
    (Object.entries(SFX_ASSETS) as [SfxId, number][]).map(async ([id, asset]) => {
      try {
        const { sound } = await Audio!.Sound.createAsync(asset, {
          shouldPlay: false,
          volume: SFX_VOLUME,
        });
        sounds[id] = sound;
      } catch {
        /* ignore */
      }
    }),
  );
  loaded = true;
}

/**
 * Best-effort instant mute (no unload). Used before backgrounding / emergency mute.
 */
export async function muteNow(): Promise<void> {
  await Promise.all(
    Object.values(sounds).map(async (s) => {
      try {
        await s?.setVolumeAsync(0);
      } catch {
        /* best-effort */
      }
    }),
  );
}

/**
 * Unload all SFX from memory.
 * Sets volume to 0 before unloading to prevent pop, then releases audio session.
 */
export function unloadSfx(): Promise<void> {
  const p = _doUnload();
  unloadInFlight = p;
  p.finally(() => {
    if (unloadInFlight === p) unloadInFlight = null;
  });
  return p;
}

async function _doUnload(): Promise<void> {
  const entries = Object.values(sounds);
  if (entries.length === 0) {
    loaded = false;
    return;
  }

  await Promise.all(
    entries.map(async (s) => {
      try {
        await s?.setVolumeAsync(0);
      } catch {
        /* best-effort — volume first, then unload */
      }
    }),
  );

  await Promise.all(
    entries.map(async (s) => {
      try {
        await s?.unloadAsync();
      } catch {
        /* ignore */
      }
    }),
  );
  Object.keys(sounds).forEach((k) => delete sounds[k as SfxId]);

  const wasLoaded = loaded;
  loaded = false;

  if (wasLoaded) {
    await session.release();
  }
}

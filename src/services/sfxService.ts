// Sound effects service
// Pre-loads short audio clips and plays them on demand
// Uses expo-av, respects soundsEnabled setting

import { useSettingsStore } from '../stores/settingsStore';

let Audio: typeof import('expo-av').Audio | null = null;

export type SfxId =
  | 'correct'
  | 'unitComplete'
  | 'mistake'
  | 'gameWon'
  | 'gameLost'
  | 'tap'
  | 'erase'
  | 'notesToggle'
  | 'hint';

const SFX_ASSETS: Record<SfxId, number> = {
  correct: require('../../assets/audio/sfx/correct.m4a'),
  unitComplete: require('../../assets/audio/sfx/correct.m4a'),
  mistake: require('../../assets/audio/sfx/mistake.m4a'),
  gameWon: require('../../assets/audio/sfx/game-won.m4a'),
  gameLost: require('../../assets/audio/sfx/game-lost.m4a'),
  tap: require('../../assets/audio/sfx/tap.m4a'),
  erase: require('../../assets/audio/sfx/erase.m4a'),
  notesToggle: require('../../assets/audio/sfx/notes-toggle.m4a'),
  hint: require('../../assets/audio/sfx/hint.m4a'),
};

const SFX_VOLUME = 0.7;

const sounds: Partial<Record<SfxId, any>> = {};
let loaded = false;

export async function loadSfx(): Promise<void> {
  if (loaded) return;
  if (!Audio) {
    try {
      const av = await import('expo-av');
      Audio = av.Audio;
    } catch {
      return;
    }
  }

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
    })
  );
  loaded = true;
}

export async function playSfx(id: SfxId, options?: { force?: boolean }): Promise<void> {
  if (!options?.force && !useSettingsStore.getState().soundsEnabled) return;
  const sound = sounds[id];
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // swallow — non-critical
  }
}

export async function unloadSfx(): Promise<void> {
  await Promise.all(
    Object.values(sounds).map(async (s) => {
      try {
        await s?.unloadAsync();
      } catch {
        // ignore
      }
    })
  );
  Object.keys(sounds).forEach((k) => delete sounds[k as SfxId]);
  loaded = false;
}

/**
 * Background music hook for game screen.
 * Connects audio service to React lifecycle, stores, and AppState.
 *
 * BEHAVIOR CONTRACT:
 * - musicEnabled (not soundsEnabled) controls background music.
 * - Game 'playing' or 'paused': music plays (settings sheet open does not stop music).
 * - Game 'won' or 'lost': music fades out.
 * - App background: music pauses. App foreground: music resumes if policy allows.
 * - When musicEnabled is false, audio is NOT loaded (no audio session = no pops).
 * - Waits for settings store hydration before loading so default `true` prefs do not
 *   briefly acquire the audio session when the user has music off.
 *
 * All playback decisions route through musicCoordinator.
 * Game teardown uses `cleanupGameAudio()` from game.tsx (not this hook).
 */

import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as audioService from "../services/audioService";
import * as musicCoordinator from "../services/musicCoordinator";
import {
  useMusicEnabled,
  hasSettingsHydrated,
  waitForSettingsHydration,
} from "../stores/settingsStore";
import { useGameStore } from "../stores/gameStore";
import { useActiveTrackId } from "../stores/ownedTracksStore";
import { getTrackById } from "../constants/backingTracks";

/** Slightly longer than coordinator fade + step quantization so unload does not clip the tail. */
const UNLOAD_AFTER_MUSIC_OFF_MS = 700;

export function useBackgroundMusic() {
  const musicEnabled = useMusicEnabled();
  const gameStatus = useGameStore((s) => s.gameStatus);
  const activeTrackId = useActiveTrackId();
  const prevMusicEnabled = useRef(musicEnabled);
  /** Avoid switchTrack() when only `settingsHydrated` flips true (load effect already has correct asset). */
  const prevSettingsHydrated = useRef(false);

  const [settingsHydrated, setSettingsHydrated] = useState(hasSettingsHydrated);

  useEffect(() => {
    if (hasSettingsHydrated()) {
      setSettingsHydrated(true);
      return;
    }
    waitForSettingsHydration().then(() => setSettingsHydrated(true));
  }, []);

  // Init coordinator (teardown is `cleanupGameAudio` in game.tsx)
  useEffect(() => {
    musicCoordinator.init();
  }, []);

  // Load music when enabled, unload when disabled.
  // Gated on settings hydration to avoid phantom session acquire before AsyncStorage applies.
  // Delay unload after disabling music so musicCoordinator.sync can fade out first (see FADE_DURATION_MS).
  useEffect(() => {
    if (!settingsHydrated) return;
    let unloadTimer: ReturnType<typeof setTimeout> | null = null;

    if (musicEnabled) {
      const track = getTrackById(activeTrackId);
      void audioService.loadBackgroundMusic(track?.asset).then(() => {
        musicCoordinator.resyncAfterAudioReady();
      });
    } else if (prevMusicEnabled.current && !musicEnabled) {
      unloadTimer = setTimeout(() => {
        void audioService.unload();
      }, UNLOAD_AFTER_MUSIC_OFF_MS);
    }
    prevMusicEnabled.current = musicEnabled;

    return () => {
      if (unloadTimer) clearTimeout(unloadTimer);
    };
  }, [musicEnabled, activeTrackId, settingsHydrated]);

  // Sync coordinator on input changes
  useEffect(() => {
    if (!settingsHydrated) return;
    musicCoordinator.sync({
      musicEnabled,
      appActive: AppState.currentState === "active",
      gameStatus: gameStatus as musicCoordinator.GameStatus,
      activeTrackId,
    });
  }, [musicEnabled, gameStatus, activeTrackId, settingsHydrated]);

  // Respond to app state changes (background/foreground)
  useEffect(() => {
    if (!settingsHydrated) return;
    const subscription = AppState.addEventListener("change", (nextState) => {
      musicCoordinator.sync({
        musicEnabled,
        appActive: nextState === "active",
        gameStatus: gameStatus as musicCoordinator.GameStatus,
        activeTrackId,
      });
    });
    return () => subscription.remove();
  }, [musicEnabled, gameStatus, activeTrackId, settingsHydrated]);

  // Track switching — skip the run where only hydration completed (avoid unload/reload same asset)
  useEffect(() => {
    if (!settingsHydrated) return;
    if (!audioService.isLoaded()) return;
    const track = getTrackById(activeTrackId);
    if (!track) return;

    const onlyHydrationBecameTrue = settingsHydrated && !prevSettingsHydrated.current;
    prevSettingsHydrated.current = settingsHydrated;

    if (onlyHydrationBecameTrue) {
      return;
    }

    void audioService.switchTrack(track.asset).then(() => {
      musicCoordinator.resyncAfterAudioReady();
    });
  }, [activeTrackId, settingsHydrated]);
}

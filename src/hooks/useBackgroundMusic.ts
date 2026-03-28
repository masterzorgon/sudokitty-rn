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
 *
 * All playback decisions route through musicCoordinator.
 */

import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as audioService from "../services/audioService";
import * as musicCoordinator from "../services/musicCoordinator";
import { useMusicEnabled } from "../stores/settingsStore";
import { useGameStore } from "../stores/gameStore";
import { useActiveTrackId } from "../stores/ownedTracksStore";
import { getTrackById } from "../constants/backingTracks";

export function useBackgroundMusic() {
  const musicEnabled = useMusicEnabled();
  const gameStatus = useGameStore((s) => s.gameStatus);
  const activeTrackId = useActiveTrackId();
  const prevMusicEnabled = useRef(musicEnabled);

  // Init/dispose coordinator lifecycle
  useEffect(() => {
    musicCoordinator.init();
    return () => {
      musicCoordinator.dispose();
    };
  }, []);

  // Load music when enabled, unload when disabled.
  // On mount: only load if musicEnabled is true.
  // On toggle: load/unload reactively.
  useEffect(() => {
    if (musicEnabled) {
      const track = getTrackById(activeTrackId);
      audioService.loadBackgroundMusic(track?.asset);
    } else if (prevMusicEnabled.current && !musicEnabled) {
      audioService.unload();
    }
    prevMusicEnabled.current = musicEnabled;
  }, [musicEnabled, activeTrackId]);

  // Sync coordinator on input changes
  useEffect(() => {
    musicCoordinator.sync({
      musicEnabled,
      appActive: AppState.currentState === "active",
      gameStatus: gameStatus as musicCoordinator.GameStatus,
      activeTrackId,
    });
  }, [musicEnabled, gameStatus, activeTrackId]);

  // Respond to app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      musicCoordinator.sync({
        musicEnabled,
        appActive: nextState === "active",
        gameStatus: gameStatus as musicCoordinator.GameStatus,
        activeTrackId,
      });
    });
    return () => subscription.remove();
  }, [musicEnabled, gameStatus, activeTrackId]);

  // Track switching
  useEffect(() => {
    if (!audioService.isLoaded()) return;
    const track = getTrackById(activeTrackId);
    if (track) {
      audioService.switchTrack(track.asset);
    }
  }, [activeTrackId]);
}

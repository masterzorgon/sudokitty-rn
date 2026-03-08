/**
 * Background music hook for game screen.
 * Connects audio service to React lifecycle, stores, and AppState.
 *
 * BEHAVIOR CONTRACT:
 * - musicEnabled (not soundsEnabled) controls background music.
 * - Game 'playing' or 'paused': music plays (settings sheet open does not stop music).
 * - Game 'won' or 'lost': music fades out.
 * - App background: music pauses. App foreground: music resumes if policy allows.
 *
 * All playback decisions route through musicCoordinator.
 */

import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as audioService from '../services/audioService';
import * as musicCoordinator from '../services/musicCoordinator';
import { useMusicEnabled } from '../stores/settingsStore';
import { useGameStore } from '../stores/gameStore';
import { useActiveTrackId } from '../stores/ownedTracksStore';
import { getTrackById } from '../constants/backingTracks';

export function useBackgroundMusic() {
  const musicEnabled = useMusicEnabled();
  const gameStatus = useGameStore((s) => s.gameStatus);
  const activeTrackId = useActiveTrackId();

  useEffect(() => {
    musicCoordinator.init();

    (async () => {
      const track = getTrackById(activeTrackId);
      await audioService.loadBackgroundMusic(track?.asset);
    })();

    return () => {
      musicCoordinator.dispose();
    };
  }, []);

  useEffect(() => {
    musicCoordinator.sync({
      musicEnabled,
      appActive: AppState.currentState === 'active',
      gameStatus: gameStatus as musicCoordinator.GameStatus,
      activeTrackId,
    });
  }, [musicEnabled, gameStatus, activeTrackId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      musicCoordinator.sync({
        musicEnabled,
        appActive: nextState === 'active',
        gameStatus: gameStatus as musicCoordinator.GameStatus,
        activeTrackId,
      });
    });
    return () => subscription.remove();
  }, [musicEnabled, gameStatus, activeTrackId]);

  useEffect(() => {
    if (!audioService.isLoaded()) return;
    const track = getTrackById(activeTrackId);
    if (track) {
      audioService.switchTrack(track.asset);
    }
  }, [activeTrackId]);
}

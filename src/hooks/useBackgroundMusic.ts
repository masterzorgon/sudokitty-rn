// Background music hook for game screen
// Connects audio service to React lifecycle, stores, and AppState

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as audioService from '../services/audioService';
import { useSoundsEnabled } from '../stores/settingsStore';
import { useGameStore } from '../stores/gameStore';
import { useActiveTrackId } from '../stores/ownedTracksStore';
import { getTrackById } from '../constants/backingTracks';

// ============================================
// Constants
// ============================================

const MUSIC_VOLUME = 0.35; // Ambient level - won't overpower haptics or UI sounds
const FADE_DURATION_MS = 500;

// ============================================
// Hook
// ============================================

export function useBackgroundMusic() {
  const soundsEnabled = useSoundsEnabled();
  const gameStatus = useGameStore((s) => s.gameStatus);
  const activeTrackId = useActiveTrackId();
  
  const mountedRef = useRef(true);
  const currentFadeRef = useRef<{ cancel: () => void } | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const initialTrackRef = useRef(activeTrackId);

  // ============================================
  // Load and initialize on mount
  // ============================================

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      const track = getTrackById(initialTrackRef.current);
      await audioService.loadBackgroundMusic(track?.asset);
      
      if (!mountedRef.current) return;

      const currentStatus = useGameStore.getState().gameStatus;

      if (soundsEnabled && currentStatus === 'playing') {
        await audioService.play(0);
        if (mountedRef.current) {
          currentFadeRef.current = audioService.fade(MUSIC_VOLUME, FADE_DURATION_MS);
        }
      }
    })();

    return () => {
      mountedRef.current = false;
      
      if (currentFadeRef.current) {
        currentFadeRef.current.cancel();
        currentFadeRef.current = null;
      }

      (async () => {
        if (await audioService.isPlaying()) {
          const fadeOut = audioService.fade(0, FADE_DURATION_MS);
          await new Promise((resolve) => setTimeout(resolve, FADE_DURATION_MS));
          fadeOut.cancel();
        }
        await audioService.pause();
        await audioService.unload();
      })();
    };
  }, []);

  // ============================================
  // Watch activeTrackId changes
  // ============================================

  useEffect(() => {
    if (!mountedRef.current || !audioService.isLoaded()) return;

    const track = getTrackById(activeTrackId);
    if (track) {
      audioService.switchTrack(track.asset);
    }
  }, [activeTrackId]);

  // ============================================
  // Watch soundsEnabled toggle
  // ============================================

  useEffect(() => {
    if (!mountedRef.current || !audioService.isLoaded()) {
      return;
    }

    (async () => {
      // Cancel previous fade
      if (currentFadeRef.current) {
        currentFadeRef.current.cancel();
        currentFadeRef.current = null;
      }

      if (soundsEnabled && gameStatus === 'playing') {
        // Fade in and play
        await audioService.play(0);
        if (mountedRef.current) {
          currentFadeRef.current = audioService.fade(MUSIC_VOLUME, FADE_DURATION_MS);
        }
      } else {
        // Fade out and pause
        if (await audioService.isPlaying()) {
          currentFadeRef.current = audioService.fade(0, FADE_DURATION_MS);
          await new Promise((resolve) => setTimeout(resolve, FADE_DURATION_MS));
          if (mountedRef.current) {
            await audioService.pause();
          }
        }
      }
    })();
  }, [soundsEnabled]);

  // ============================================
  // Watch gameStatus changes
  // ============================================

  useEffect(() => {
    if (!mountedRef.current || !audioService.isLoaded() || !soundsEnabled) {
      return;
    }

    (async () => {
      // Cancel previous fade
      if (currentFadeRef.current) {
        currentFadeRef.current.cancel();
        currentFadeRef.current = null;
      }

      if (gameStatus === 'playing') {
        // Resume/play music
        const playing = await audioService.isPlaying();
        if (!playing) {
          await audioService.play(0);
          if (mountedRef.current) {
            currentFadeRef.current = audioService.fade(MUSIC_VOLUME, FADE_DURATION_MS);
          }
        }
      } else if (gameStatus === 'won' || gameStatus === 'lost') {
        // Pause music when game ends (not when paused e.g. settings open)
        if (await audioService.isPlaying()) {
          currentFadeRef.current = audioService.fade(0, FADE_DURATION_MS);
          await new Promise((resolve) => setTimeout(resolve, FADE_DURATION_MS));
          if (mountedRef.current) {
            await audioService.pause();
          }
        }
      }
    })();
  }, [gameStatus, soundsEnabled]);

  // ============================================
  // Watch AppState (background/foreground)
  // ============================================

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (!mountedRef.current || !audioService.isLoaded() || !soundsEnabled) {
        return;
      }

      (async () => {
        if (previousState === 'active' && nextAppState.match(/inactive|background/)) {
          // App going to background - pause immediately
          if (currentFadeRef.current) {
            currentFadeRef.current.cancel();
            currentFadeRef.current = null;
          }
          await audioService.pause();
        } else if (previousState.match(/inactive|background/) && nextAppState === 'active') {
          // App coming to foreground - resume if game is playing
          if (gameStatus === 'playing') {
            await audioService.play(0);
            if (mountedRef.current) {
              currentFadeRef.current = audioService.fade(MUSIC_VOLUME, FADE_DURATION_MS);
            }
          }
        }
      })();
    });

    return () => {
      subscription.remove();
    };
  }, [soundsEnabled, gameStatus]);
}

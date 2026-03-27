import { requireNativeModule } from 'expo-modules-core';

const CoreHapticsModule = requireNativeModule<{
  supportsHaptics: boolean;
  play: (patternName: string) => void;
}>('CoreHaptics');

export const supportsHaptics: boolean = CoreHapticsModule.supportsHaptics ?? false;

export type HapticPattern =
  | 'selection'
  | 'tap'
  | 'tapHeavy'
  | 'carouselSwipe'
  | 'pencilMark'
  | 'erase'
  | 'correct'
  | 'unitComplete'
  | 'mistake'
  | 'gameWon'
  | 'gameLost'
  | 'streak'
  | 'levelUp';

export function play(pattern: HapticPattern): void {
  CoreHapticsModule.play(pattern);
}

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
  | 'correct'
  | 'unitComplete'
  | 'mistake'
  | 'gameWon'
  | 'gameLost';

export function play(pattern: HapticPattern): void {
  CoreHapticsModule.play(pattern);
}

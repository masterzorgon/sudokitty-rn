// Unified feedback: haptics + sound effects
// Single abstraction for both; each respects its own setting (hapticsEnabled / soundsEnabled)

import { playHaptic, type HapticPattern } from './haptics';
import { playSfx, type SfxId } from '../services/sfxService';

export type FeedbackId =
  | 'selection'
  | 'tap'
  | 'tapHeavy'
  | 'correct'
  | 'unitComplete'
  | 'mistake'
  | 'gameWon'
  | 'gameLost'
  | 'erase'
  | 'notesToggle'
  | 'hint';

const HAPTIC_MAP: Record<FeedbackId, HapticPattern | null> = {
  selection: 'selection',
  tap: 'tap',
  tapHeavy: 'tapHeavy',
  correct: 'correct',
  unitComplete: 'unitComplete',
  mistake: 'mistake',
  gameWon: 'gameWon',
  gameLost: 'gameLost',
  erase: 'tap',
  notesToggle: 'tap',
  hint: 'tap',
};

const SFX_MAP: Record<FeedbackId, SfxId | null> = {
  selection: null,
  tap: 'tap',
  tapHeavy: 'tap',
  correct: 'correct',
  unitComplete: 'unitComplete',
  mistake: 'mistake',
  gameWon: 'gameWon',
  gameLost: 'gameLost',
  erase: 'erase',
  notesToggle: 'notesToggle',
  hint: 'hint',
};

export interface PlayFeedbackOptions {
  forceHaptic?: boolean;
  forceSfx?: boolean;
}

/**
 * Play haptic and/or sound feedback for a semantic interaction.
 * Haptics and sounds are independently controlled by user settings.
 */
export function playFeedback(id: FeedbackId, options?: PlayFeedbackOptions): void {
  const haptic = HAPTIC_MAP[id];
  const sfx = SFX_MAP[id];
  if (haptic) playHaptic(haptic, { force: options?.forceHaptic });
  if (sfx) playSfx(sfx, { force: options?.forceSfx });
}

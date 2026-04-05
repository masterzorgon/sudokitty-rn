// Unified feedback: haptics + sound effects
// Single abstraction for both; each respects its own setting (hapticsEnabled / soundsEnabled)

import { playHaptic, type HapticPattern } from "./haptics";
import { playSfx, type SfxId } from "../services/sfxService";

export type FeedbackId =
  | "selection"
  | "carouselSwipe"
  | "tap"
  | "tapHeavy"
  | "pencilMark"
  | "correct"
  | "unitComplete"
  | "mistake"
  | "gameWon"
  | "gameLost"
  | "erase"
  | "notesToggle"
  | "hint"
  | "mochiArrival";

const HAPTIC_MAP: Record<FeedbackId, HapticPattern | null> = {
  selection: "selection",
  carouselSwipe: "carouselSwipe",
  tap: "tap",
  tapHeavy: "tapHeavy",
  pencilMark: "pencilMark",
  correct: "correct",
  unitComplete: "unitComplete",
  mistake: "mistake",
  gameWon: "gameWon",
  gameLost: "gameLost",
  erase: "erase",
  notesToggle: "tap",
  hint: "tap",
  mochiArrival: "tap",
};

const SFX_MAP: Record<FeedbackId, SfxId | null> = {
  selection: null,
  carouselSwipe: null,
  tap: "tap",
  tapHeavy: "tap",
  pencilMark: null,
  correct: "correct",
  unitComplete: "unitComplete",
  mistake: "mistake",
  gameWon: "gameWon",
  gameLost: "gameLost",
  erase: "erase",
  notesToggle: "notesToggle",
  hint: "hint",
  mochiArrival: "mochiArrival",
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

/** Same priority as NumberPad after a correct placement (hint apply or random hint fill). */
export function playFeedbackForCorrectHintPlacement(options: {
  isGameWon: boolean;
  completedUnitsCount: number;
}): void {
  if (options.isGameWon) playFeedback("gameWon");
  else if (options.completedUnitsCount > 0) playFeedback("unitComplete");
  else playFeedback("correct");
}

import * as audioService from "./audioService";
import {
  playDemo as trackPlayDemo,
  stopDemo as trackStopDemo,
  type DemoCallbacks,
} from "./trackDemoService";

const FADE_DURATION_MS = 500;
const MUSIC_VOLUME = 0.35;

export type GameStatus = "playing" | "paused" | "won" | "lost";

export interface MusicInputs {
  musicEnabled: boolean;
  appActive: boolean;
  gameStatus: GameStatus;
  activeTrackId: string;
}

type AudioMode = "playing" | "silent" | "preview";

let transitionId = 0;
let lastInputs: MusicInputs | null = null;
let currentMode: AudioMode = "silent";
let previewActive = false;
let disposed = false;

function deriveMode(inputs: MusicInputs): AudioMode {
  if (previewActive) return "preview";
  if (!inputs.musicEnabled) return "silent";
  if (!inputs.appActive) return "silent";
  if (inputs.gameStatus === "won" || inputs.gameStatus === "lost") return "silent";
  return "playing";
}

async function applyTransition(targetMode: AudioMode, myId: number): Promise<void> {
  if (disposed || myId !== transitionId) return;

  if (targetMode === "playing") {
    if (!audioService.isLoaded()) return;
    const playing = await audioService.isPlaying();
    if (!playing) {
      await audioService.play(0);
    }
    if (myId !== transitionId) return;
    audioService.fade(MUSIC_VOLUME, FADE_DURATION_MS);
  } else if (targetMode === "silent" || targetMode === "preview") {
    if (!audioService.isLoaded()) return;
    if (await audioService.isPlaying()) {
      audioService.fade(0, FADE_DURATION_MS);
      await new Promise((r) => setTimeout(r, FADE_DURATION_MS));
      if (myId !== transitionId) return;
      await audioService.pause();
    }
  }
}

/**
 * Sync background music state with current inputs.
 * Idempotent: only transitions if derived mode differs from current mode.
 */
export function sync(inputs: MusicInputs): void {
  if (disposed) return;

  lastInputs = inputs;
  const targetMode = deriveMode(inputs);

  if (targetMode === currentMode) return;

  transitionId += 1;
  const myId = transitionId;
  currentMode = targetMode;

  applyTransition(targetMode, myId);
}

/**
 * Call when background audio finishes loading or after switchTrack completes.
 * sync() can run before loadBackgroundMusic resolves; applyTransition then no-ops while
 * !isLoaded, but currentMode is already "playing", so later sync calls no-op forever.
 * If playback never started, reset to silent and sync again.
 */
export function resyncAfterAudioReady(): void {
  if (disposed) return;
  if (!lastInputs) return;
  const targetMode = deriveMode(lastInputs);
  if (targetMode !== "playing") return;
  if (!audioService.isLoaded()) return;

  void (async () => {
    const playing = await audioService.isPlaying();
    if (playing) return;

    if (currentMode === "playing") {
      currentMode = "silent";
    }
    sync(lastInputs!);
  })();
}

/**
 * Start track preview. Suspends background music, plays demo, then restores
 * background music on completion or manual stop.
 */
export function startPreview(asset: number, durationMs: number, callbacks?: DemoCallbacks): void {
  if (disposed) return;

  trackStopDemo();

  previewActive = true;
  transitionId += 1;
  const myId = transitionId;
  currentMode = "preview";

  (async () => {
    if (audioService.isLoaded() && (await audioService.isPlaying())) {
      audioService.fade(0, FADE_DURATION_MS);
      await new Promise((r) => setTimeout(r, FADE_DURATION_MS));
      if (myId !== transitionId) return;
      await audioService.pause();
    }

    await trackPlayDemo(asset, durationMs, {
      ...callbacks,
      onComplete: () => {
        previewActive = false;
        if (lastInputs && !disposed) {
          sync(lastInputs);
        }
        callbacks?.onComplete?.();
      },
    });
  })();
}

/**
 * Stop any active preview and restore background music if policy allows.
 */
export function stopPreview(): void {
  trackStopDemo();
  previewActive = false;
  if (lastInputs && !disposed) {
    sync(lastInputs);
  }
}

/**
 * Initialize coordinator. Call once when game screen mounts.
 */
export function init(): void {
  disposed = false;
}

/**
 * Prepare for coordinated game teardown (see `cleanupGameAudio`).
 * Cancels transitions, stops preview demo, and marks coordinator disposed.
 */
export async function prepareForGameCleanup(): Promise<void> {
  disposed = true;
  transitionId += 1;
  previewActive = false;
  await trackStopDemo();
}

export function isPreviewActive(): boolean {
  return previewActive;
}

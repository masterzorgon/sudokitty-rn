/**
 * Single sequenced teardown for game screen: cancels fades, mutes, unloads BGM then SFX.
 * Avoids concurrent session.release() races from separate useEffect cleanups.
 */

import * as audioService from "./audioService";
import * as sfxService from "./sfxService";
import * as musicCoordinator from "./musicCoordinator";

export async function cleanupGameAudio(): Promise<void> {
  await musicCoordinator.prepareForGameCleanup();
  audioService.cancelFade();
  await Promise.all([audioService.muteNow(), sfxService.muteNow()]);
  await audioService.unload();
  await sfxService.unloadSfx();
}

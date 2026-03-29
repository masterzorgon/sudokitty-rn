/**
 * Fast, best-effort mute of all loaded expo-av sounds before iOS tears down the session
 * (background / inactive). Does not unload — normal teardown handles that.
 */

import * as audioService from "./audioService";
import * as sfxService from "./sfxService";
import * as trackDemoService from "./trackDemoService";

export async function muteAllAudio(): Promise<void> {
  await Promise.all([audioService.muteNow(), sfxService.muteNow(), trackDemoService.muteNow()]);
}

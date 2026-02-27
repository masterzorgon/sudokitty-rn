let Audio: typeof import('expo-av').Audio | null = null;

let demoSound: any | null = null;
let demoTimeout: ReturnType<typeof setTimeout> | null = null;

async function ensureAudio(): Promise<boolean> {
  if (!Audio) {
    try {
      const av = await import('expo-av');
      Audio = av.Audio;
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

export async function playDemo(asset: number, durationMs: number = 8000): Promise<void> {
  await stopDemo();

  if (!(await ensureAudio()) || !Audio) return;

  try {
    const { sound } = await Audio.Sound.createAsync(asset, {
      shouldPlay: true,
      volume: 0.5,
    });
    demoSound = sound;
    demoTimeout = setTimeout(() => {
      stopDemo();
    }, durationMs);
  } catch {
    demoSound = null;
  }
}

export async function stopDemo(): Promise<void> {
  if (demoTimeout) {
    clearTimeout(demoTimeout);
    demoTimeout = null;
  }
  if (demoSound) {
    try {
      await demoSound.unloadAsync();
    } catch {}
    demoSound = null;
  }
}

export function isDemoPlaying(): boolean {
  return demoSound !== null;
}

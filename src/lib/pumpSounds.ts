/**
 * Pump SFX — exact WAVs from project-mobile-native/assets/sounds
 * (pump-start.wav, pump-stop.wav, dial-click.wav) with native volumes.
 */

const START_SRC = "/sounds/pump-start.wav";
const STOP_SRC = "/sounds/pump-stop.wav";
const CLICK_SRC = "/sounds/dial-click.wav";

/** Match native pumpPowerSound / dialClickSound */
const START_VOLUME = 0.55;
const STOP_VOLUME = 0.5;
const CLICK_VOLUME = 0.55;
const CLICK_POOL = 4;

let muted = false;
let startAudio: HTMLAudioElement | null = null;
let stopAudio: HTMLAudioElement | null = null;
let clickPool: HTMLAudioElement[] = [];
let clickIndex = 0;
let preloadPromise: Promise<void> | null = null;

function makeAudio(src: string, volume: number) {
  const a = new Audio(src);
  a.preload = "auto";
  a.loop = false;
  a.volume = muted ? 0 : volume;
  return a;
}

function applyMuteVolumes() {
  try {
    if (startAudio) startAudio.volume = muted ? 0 : START_VOLUME;
    if (stopAudio) stopAudio.volume = muted ? 0 : STOP_VOLUME;
    clickPool.forEach((a) => {
      a.volume = muted ? 0 : CLICK_VOLUME;
    });
  } catch {
    // ignore
  }
}

function playOneShot(audio: HTMLAudioElement | null, volume: number) {
  if (!audio || muted) return;
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = volume;
    void audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

export function isPumpSoundMuted() {
  return muted;
}

export function setPumpSoundMuted(next: boolean) {
  muted = Boolean(next);
  applyMuteVolumes();
  return muted;
}

export function togglePumpSoundMuted() {
  return setPumpSoundMuted(!muted);
}

export function preloadPumpSounds() {
  if (typeof window === "undefined") return Promise.resolve();
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    startAudio = makeAudio(START_SRC, START_VOLUME);
    stopAudio = makeAudio(STOP_SRC, STOP_VOLUME);
    clickPool = Array.from({ length: CLICK_POOL }, () =>
      makeAudio(CLICK_SRC, CLICK_VOLUME)
    );
    // Warm decode — ignore failures (autoplay policies)
    await Promise.allSettled(
      [startAudio, stopAudio, ...clickPool].map(
        (a) =>
          new Promise<void>((resolve) => {
            if (a.readyState >= 2) {
              resolve();
              return;
            }
            a.addEventListener("canplaythrough", () => resolve(), { once: true });
            a.addEventListener("error", () => resolve(), { once: true });
            a.load();
          })
      )
    );
  })();

  return preloadPromise;
}

/** Native playPumpStartSound — cuts leftover stop, plays start whoosh */
export async function playPumpStartSound() {
  await preloadPumpSounds();
  if (stopAudio) {
    try {
      stopAudio.pause();
      stopAudio.currentTime = 0;
    } catch {
      // ignore
    }
  }
  if (muted) return;
  playOneShot(startAudio, START_VOLUME);
}

/** Native playPumpStopSound — cuts leftover start, plays stop click */
export async function playPumpStopSound() {
  await preloadPumpSounds();
  if (startAudio) {
    try {
      startAudio.pause();
      startAudio.currentTime = 0;
    } catch {
      // ignore
    }
  }
  if (muted) return;
  playOneShot(stopAudio, STOP_VOLUME);
}

/** Native dial detent — pool so rapid ticks don't mute each other */
export async function playDialClick() {
  await preloadPumpSounds();
  if (muted || clickPool.length === 0) return;
  const player = clickPool[clickIndex % clickPool.length];
  clickIndex += 1;
  playOneShot(player, CLICK_VOLUME);
}

/**
 * Per-section ambient music player.
 * Plays the right track for Games / Library / Breathing,
 * with soft fade-in, crossfade on switch, and fade-out on stop.
 */

export type AmbientSection = 'games' | 'library' | 'breathing';

const TRACKS: Record<AmbientSection, string> = {
  games: '/music/Game-Music.mp3',
  library: '/music/Resourtce-Library-Music.mp3',
  breathing: '/music/Breath-Music.mp3',
};

/** Gentle volume — calm, never loud. Adjust 0–1. */
const TARGET_VOLUME = 0.35;

let audio: HTMLAudioElement | null = null;
let currentSection: AmbientSection | null = null;
let fadeTimer: number | null = null;

function clearFadeTimer() {
  if (fadeTimer !== null) {
    window.clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

function fadeIn(a: HTMLAudioElement) {
  clearFadeTimer();
  a.volume = 0;
  fadeTimer = window.setInterval(() => {
    if (a.volume < TARGET_VOLUME - 0.02) {
      a.volume = Math.min(TARGET_VOLUME, a.volume + 0.02);
    } else {
      clearFadeTimer();
    }
  }, 80);
}

function fadeOutAndRelease(a: HTMLAudioElement) {
  const t = window.setInterval(() => {
    if (a.volume > 0.04) {
      a.volume = Math.max(0, a.volume - 0.04);
    } else {
      a.pause();
      window.clearInterval(t);
    }
  }, 60);
}

/** Start (or switch to) the track for a section. */
export function playSection(section: AmbientSection): void {
  if (currentSection === section && audio && !audio.paused) return;

  // crossfade: gently stop the old track
  if (audio) fadeOutAndRelease(audio);

  const next = new Audio(TRACKS[section]);
  next.loop = true;
  audio = next;
  currentSection = section;
  fadeIn(next);
  void next.play().catch(() => {
    /* browser waits for a user interaction — starts on next tap */
  });
}

/** Fade out and stop everything. */
export function stopAmbient(): void {
  clearFadeTimer();
  if (audio) fadeOutAndRelease(audio);
  audio = null;
  currentSection = null;
}
import type { IntroChapterId } from "./intro.copy";
import soundtrackAsset from "@/assets/bensound-birthofahero.mp3.asset.json";

export type IntroVoiceId = IntroChapterId | "asteroids" | "sculpture" | "flow" | "neural";

/**
 * Soundtrack: "Birth of a Hero" — Music by Bensound.com, Artist: Benjamin Tissot.
 * License code: I7JBR57FQ3ATQ5FP.
 * Voice-over files live in `public/audio/intro/`. Set a path to `null` to disable that track.
 */
export const INTRO_AUDIO: {
  soundtrack: string | null;
  voiceOver: Record<IntroVoiceId, string | null>;
} = {
  soundtrack: soundtrackAsset.url,
  voiceOver: {
    storm: "/audio/intro/vo-en-1-storm.mp3",
    current: "/audio/intro/vo-en-2-current.mp3",
    light: "/audio/intro/vo-en-3-light.mp3",
    roots: "/audio/intro/vo-en-4-roots.mp3",
    asteroids: "/audio/intro/vo-en-1-storm.mp3",
    sculpture: "/audio/intro/vo-en-2-current.mp3",
    flow: "/audio/intro/vo-en-3-light.mp3",
    neural: "/audio/intro/vo-en-4-roots.mp3",
  },
};

export const MUSIC_VOLUME = 0.55;
/** Music level while the voice-over speaks. */
export const MUSIC_DUCKED_VOLUME = 0.22;
export const VOICE_VOLUME = 1;

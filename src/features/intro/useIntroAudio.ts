import { useCallback, useEffect, useRef, useState } from "react";
import { INTRO_AUDIO, MUSIC_DUCKED_VOLUME, MUSIC_VOLUME, VOICE_VOLUME, type IntroVoiceId } from "./intro.audio";

export type IntroAudioPrefs = { music: boolean; voice: boolean };

function fadeTo(el: HTMLAudioElement, target: number, ms: number, onDone?: () => void): () => void {
  const from = el.volume;
  const start = performance.now();
  let raf = 0;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    el.volume = from + (target - from) * t;
    if (t < 1) raf = requestAnimationFrame(step);
    else onDone?.();
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/**
 * Soundtrack loops independently of the chapters; the voice-over plays one clip per chapter.
 * Playback must start from a user gesture (the "Enter" click), browsers block autoplay otherwise.
 */
export function useIntroAudio() {
  const [prefs, setPrefs] = useState<IntroAudioPrefs>({ music: true, voice: true });
  const prefsRef = useRef(prefs);

  const music = useRef<HTMLAudioElement | null>(null);
  const voice = useRef<HTMLAudioElement | null>(null);
  const cancelMusicFade = useRef<() => void>(() => {});
  const started = useRef(false);

  const musicTarget = () => (voice.current && !voice.current.paused ? MUSIC_DUCKED_VOLUME : MUSIC_VOLUME);

  const fadeMusic = useCallback((target: number, ms: number, onDone?: () => void) => {
    const el = music.current;
    if (!el) return;
    cancelMusicFade.current();
    cancelMusicFade.current = fadeTo(el, target, ms, onDone);
  }, []);

  const playMusic = useCallback(() => {
    if (!INTRO_AUDIO.soundtrack) return;
    if (!music.current) {
      const el = new Audio(INTRO_AUDIO.soundtrack);
      el.loop = true;
      el.volume = 0;
      el.preload = "auto";
      music.current = el;
    }
    music.current.play().then(() => fadeMusic(musicTarget(), 2500)).catch(() => {});
  }, [fadeMusic]);

  const stopVoice = useCallback(() => {
    const el = voice.current;
    if (!el) return;
    el.pause();
    voice.current = null;
    if (prefsRef.current.music && music.current && !music.current.paused) fadeMusic(MUSIC_VOLUME, 800);
  }, [fadeMusic]);

  const playVoice = useCallback(
    (id: IntroVoiceId) => {
      stopVoice();
      const src = INTRO_AUDIO.voiceOver[id];
      if (!started.current || !prefsRef.current.voice || !src) return;
      const el = new Audio(src);
      el.volume = VOICE_VOLUME;
      el.onended = () => {
        if (voice.current === el) stopVoice();
      };
      voice.current = el;
      el.play()
        .then(() => {
          if (voice.current === el && prefsRef.current.music) fadeMusic(MUSIC_DUCKED_VOLUME, 600);
        })
        .catch(() => {
          if (voice.current === el) voice.current = null;
        });
    },
    [fadeMusic, stopVoice],
  );

  /** Call from the click that enters the experience. */
  const start = useCallback(() => {
    started.current = true;
    if (prefsRef.current.music) playMusic();
  }, [playMusic]);

  const setMusic = useCallback(
    (on: boolean) => {
      prefsRef.current = { ...prefsRef.current, music: on };
      setPrefs(prefsRef.current);
      if (!started.current) return;
      if (on) playMusic();
      else fadeMusic(0, 600, () => music.current?.pause());
    },
    [fadeMusic, playMusic],
  );

  const setVoice = useCallback(
    (on: boolean) => {
      prefsRef.current = { ...prefsRef.current, voice: on };
      setPrefs(prefsRef.current);
      if (!on) stopVoice();
    },
    [stopVoice],
  );

  useEffect(
    () => () => {
      cancelMusicFade.current();
      music.current?.pause();
      voice.current?.pause();
      music.current = null;
      voice.current = null;
    },
    [],
  );

  return { prefs, start, setMusic, setVoice, playVoice, stopVoice };
}

import { useEffect, useRef, useState } from "react";

interface Options {
  src: string | null;
  /** When false, do not play (e.g. activate/gender phases). */
  enabled: boolean;
}

/**
 * Plays a one-shot guide voice clip. Autoplay is attempted on src change
 * (call after a user gesture when possible). Reports when the clip ends.
 */
export function useGuardianGuideAudio({ src, enabled }: Options): {
  playing: boolean;
  ended: boolean;
  blocked: boolean;
  retryPlay: () => void;
} {
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(!enabled || !src);
  const [blocked, setBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!enabled || !src) {
      setPlaying(false);
      setEnded(true);
      setBlocked(false);
      return;
    }

    setEnded(false);
    setBlocked(false);
    setPlaying(false);

    const audio = new Audio(src);
    audioRef.current = audio;
    audio.preload = "auto";
    audio.loop = false;
    audio.setAttribute("playsinline", "");

    const onPlay = () => {
      setPlaying(true);
      setBlocked(false);
    };
    const onEnded = () => {
      setPlaying(false);
      setEnded(true);
    };
    const onError = () => {
      setPlaying(false);
      setEnded(true);
      setBlocked(false);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    const tryPlay = () => {
      void audio
        .play()
        .then(() => {
          setBlocked(false);
        })
        .catch(() => {
          setBlocked(true);
          setPlaying(false);
        });
    };

    audio.addEventListener("canplaythrough", tryPlay, { once: true });
    tryPlay();

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, [src, enabled]);

  const retryPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    void audio
      .play()
      .then(() => {
        setBlocked(false);
        setPlaying(true);
        setEnded(false);
      })
      .catch(() => setBlocked(true));
  };

  return { playing, ended, blocked, retryPlay };
}

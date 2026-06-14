import { useReducedMotion } from "framer-motion";

/** Shared motion presets that respect prefers-reduced-motion. */
export function useAegisMotion() {
  const reduceMotion = useReducedMotion();

  return {
    reduceMotion: Boolean(reduceMotion),
    fadeUp: (delay = 0) =>
      reduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 12 },
            animate: { opacity: 1, y: 0, transition: { duration: 0.3, delay, ease: "easeOut" as const } },
          },
    fadeIn: (delay = 0) =>
      reduceMotion
        ? {}
        : {
            initial: { opacity: 0 },
            animate: { opacity: 1, transition: { duration: 0.25, delay } },
          },
    slideUp: (delay = 0) =>
      reduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 24 },
            animate: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 340, damping: 32, delay } },
          },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.3 },
    spring: reduceMotion
      ? { duration: 0 }
      : { type: "spring" as const, stiffness: 340, damping: 32 },
  };
}

/** Shared safe-area padding for intro v2 overlay (viewport-fit=cover). */
export const INTRO_V2_PAD_X =
  "px-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]";

export const INTRO_V2_PAD_TOP = "pt-[max(0.75rem,env(safe-area-inset-top,0px))]";

export const INTRO_V2_PAD_BOTTOM = "pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]";

/** Keep narrative copy below header + above skip control on short screens. */
export const INTRO_V2_TEXT_STAGE =
  "pt-[max(5.25rem,calc(env(safe-area-inset-top,0px)+4.75rem))] pb-[max(6.5rem,calc(env(safe-area-inset-bottom,0px)+5.25rem))]";

export function introLineTypography(long: boolean) {
  return long
    ? "text-[clamp(1.05rem,3.6vw+0.35rem,1.75rem)] leading-snug sm:text-3xl"
    : "text-[clamp(1.2rem,4vw+0.4rem,2.25rem)] leading-snug sm:text-4xl";
}

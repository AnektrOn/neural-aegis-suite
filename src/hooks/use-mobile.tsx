import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function computeIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  // Check both viewport width AND coarse pointer (touch device).
  // Xiaomi 13T in landscape can be ~915px wide → still a phone, so we also
  // honour the coarse-pointer + max-device-width signal.
  const narrow = window.innerWidth < MOBILE_BREAKPOINT;
  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(max-width: 1024px)").matches;
  return narrow || coarse;
}

export function useIsMobile() {
  // Lazy init → correct value on first render, no desktop flash on phones.
  const [isMobile, setIsMobile] = React.useState<boolean>(() => computeIsMobile());

  React.useEffect(() => {
    const update = () => setIsMobile(computeIsMobile());

    // Re-evaluate on every relevant signal: viewport resize, orientation flip,
    // and matchMedia threshold cross. Belt-and-braces — some Android browsers
    // (incl. MIUI on Xiaomi) don't always fire matchMedia 'change' reliably.
    const mqlWidth = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const mqlPointer = window.matchMedia("(pointer: coarse)");

    mqlWidth.addEventListener?.("change", update);
    mqlPointer.addEventListener?.("change", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    update();

    return () => {
      mqlWidth.removeEventListener?.("change", update);
      mqlPointer.removeEventListener?.("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return isMobile;
}

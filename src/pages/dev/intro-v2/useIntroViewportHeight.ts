import { useEffect, useState } from "react";

/** Stable full-screen height on mobile (dynamic toolbar / visualViewport). */
export function useIntroViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const read = () => {
      const vv = window.visualViewport;
      setHeight(Math.round(vv?.height ?? window.innerHeight));
    };
    read();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", read);
    vv?.addEventListener("scroll", read);
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => {
      vv?.removeEventListener("resize", read);
      vv?.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
    };
  }, []);

  return height;
}

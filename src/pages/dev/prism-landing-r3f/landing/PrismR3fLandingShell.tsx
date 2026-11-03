import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PrismR3fLandingCanvas from "../ui/PrismR3fLandingCanvas";
import { usePrismR3fLandingChapter } from "../config/PrismR3fLandingChapterContext";
import { PrismR3fLandingLoadProvider } from "../config/PrismR3fLandingLoadContext";
import { PrismR3fLandingHud } from "./PrismR3fLandingHud";
import { PrismR3fLandingLoader } from "./PrismR3fLandingLoader";
import { getPrismLandingBeat } from "./prismR3fLandingBeats";
import { usePrismLandingBeatEffects } from "./usePrismLandingBeatEffects";
import { usePrismLandingWheelNav } from "./usePrismLandingWheelNav";
import "./prismR3fLanding.css";

function PrismR3fLandingShellInner() {
  const { chapterIndex } = usePrismR3fLandingChapter();
  const beat = getPrismLandingBeat(chapterIndex);
  const [searchParams] = useSearchParams();
  const showDevLink = import.meta.env.DEV && searchParams.get("debug") === "1";
  const [loadProgress, setLoadProgress] = useState(0);
  const [ready, setReady] = useState(false);

  usePrismLandingBeatEffects(chapterIndex);
  usePrismLandingWheelNav(ready);

  const onLoadProgress = useCallback((pct: number) => {
    setLoadProgress(pct);
  }, []);

  const onAppReady = useCallback(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  return (
    <PrismR3fLandingLoadProvider onAppReady={onAppReady}>
      <div
        className="prism-r3f-landing-root"
        data-beat={chapterIndex}
        data-beat-id={beat.id}
      >
        <PrismR3fLandingCanvas onLoadProgress={onLoadProgress} />
        {!ready ? <PrismR3fLandingLoader progress={loadProgress} /> : null}
        {ready ? <PrismR3fLandingHud /> : null}
        {showDevLink ? (
          <Link to="/dev/prism-landing-r3f" className="prism-r3f-landing-dev-link">
            Godrays lab
          </Link>
        ) : null}
      </div>
    </PrismR3fLandingLoadProvider>
  );
}

export function PrismR3fLandingShell() {
  return <PrismR3fLandingShellInner />;
}

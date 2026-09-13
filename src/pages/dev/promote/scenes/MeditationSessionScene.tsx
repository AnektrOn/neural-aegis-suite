import { lazy, Suspense, useState } from "react";
import { ArrowLeft, Pause, Play } from "lucide-react";
import { copy, PROMOTE_TRACKS } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

const MeditationNebula = lazy(() =>
  import("@/features/meditation/components/MeditationNebula").then((mod) => ({ default: mod.MeditationNebula })),
);

export function MeditationSessionScene() {
  const { isFR, goTo } = usePromotePlayer();
  const [playing, setPlaying] = useState(true);
  const track = PROMOTE_TRACKS[1];
  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-black">
      <Suspense fallback={<div className="h-full bg-black" />}>
        <MeditationNebula state={playing ? "mouvement" : "repos"} />
      </Suspense>
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => goTo("meditation")}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground/80"
          aria-label={copy(isFR, "Retour", "Back")}
        >
          <ArrowLeft size={20} />
        </button>
        <p className="font-display text-[10px] uppercase tracking-[0.22em] text-foreground/70">
          {copy(isFR, track.titleFr, track.titleEn)}
        </p>
        <span className="w-11" />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center pb-[max(2rem,env(safe-area-inset-bottom))]">
        <p className="font-mono text-sm tabular-nums text-foreground/70">3:12 / {track.duration.replace(" min", ":00")}</p>
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          className="mt-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md"
        >
          {playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
        </button>
      </div>
    </div>
  );
}

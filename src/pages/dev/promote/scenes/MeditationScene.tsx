import { Flower2, Play } from "lucide-react";
import { copy, PROMOTE_TRACKS } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

export function MeditationScene() {
  const { isFR, goTo } = usePromotePlayer();
  return (
    <div className="space-y-4 pb-6 pt-2">
      <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {copy(isFR, "Bibliothèque", "Library")}
      </p>
      <h1 className="font-cormorant text-3xl font-light">{copy(isFR, "Méditation", "Meditation")}</h1>
      <div className="space-y-2">
        {PROMOTE_TRACKS.map((track) => (
          <button
            key={track.id}
            type="button"
            onClick={() => goTo("meditation-session")}
            className="dashboard-panel flex w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
              {track.id === "m1" ? <Play size={16} /> : <Flower2 size={16} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-barlow text-[15px]">{copy(isFR, track.titleFr, track.titleEn)}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{track.duration}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

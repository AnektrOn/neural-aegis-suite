import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { QuantumNebulaHandle, QuantumNebulaState } from "@/components/ui/quantum-nebula";
import { grantMeditationPlaybackUrl } from "../lib/playback";

const MeditationNebula = lazy(() =>
  import("../components/MeditationNebula").then((mod) => ({ default: mod.MeditationNebula })),
);

function formatClock(totalSec: number): string {
  const s = Number.isFinite(totalSec) ? Math.max(0, Math.floor(totalSec)) : 0;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function MeditationSessionPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const nebulaRef = useRef<QuantumNebulaHandle | null>(null);

  const [title, setTitle] = useState("");
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nebulaState, setNebulaState] = useState<QuantumNebulaState>("repos");
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!trackId) return;
    let alive = true;
    setLoading(true);
    setAudioSrc(null);
    setPlaying(false);
    setPaused(false);
    setBlocked(false);
    setFailed(false);
    setElapsedSec(0);
    setNebulaState("repos");

    (async () => {
      try {
        const { data, error } = await supabase
          .from("meditation_tracks")
          .select("id, title")
          .eq("id", trackId)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("not-found");
        const url = await grantMeditationPlaybackUrl(trackId);
        if (!alive) return;
        setTitle(data.title);
        setAudioSrc(url);
      } catch (e) {
        if (!alive) return;
        toast({
          title: t("toast.error"),
          description:
            e instanceof Error && e.message !== "not-found" ? e.message : t("meditation.sessionMissing"),
          variant: "destructive",
        });
        navigate("/meditation", { replace: true });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [trackId, navigate, t, toast]);

  const handlePlay = useCallback(() => {
    setPlaying(true);
    setBlocked(false);
    setNebulaState("mouvement");
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setPaused(false);
    setNebulaState("reflexion");
  }, []);

  const togglePause = useCallback(() => {
    if (blocked || failed || !audioSrc || !playing) {
      void nebulaRef.current?.playAudio();
      return;
    }
    setPaused((prev) => !prev);
  }, [audioSrc, blocked, failed, playing]);

  return (
    <div className="relative min-h-screen">
      {audioSrc ? (
        <Suspense fallback={null}>
          <MeditationNebula
            ref={nebulaRef}
            state={nebulaState}
            audioSrc={audioSrc}
            autoPlayAudio
            audioPaused={paused}
            onAudioPlay={handlePlay}
            onAudioEnded={handleEnded}
            onAudioBlocked={setBlocked}
            onAudioError={() => setFailed(true)}
            onAudioTimeUpdate={setElapsedSec}
            className="z-0"
          />
        </Suspense>
      ) : null}

      <div className="relative z-10 flex min-h-screen flex-col justify-between p-4 sm:p-6">
        <div>
          <Link
            to="/meditation"
            className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-background/50 px-3 py-2 text-sm text-foreground backdrop-blur-md hover:border-primary/30"
          >
            <ArrowLeft size={14} />
            {t("meditation.back")}
          </Link>
        </div>

        <div className="ethereal-glass mx-auto w-full max-w-md space-y-4 p-5">
          <p className="text-neural-label">{t("meditation.nowPlaying")}</p>
          <h2 className="text-lg font-medium text-foreground">{loading ? "…" : title}</h2>
          <p className="text-sm tabular-nums text-muted-foreground">{formatClock(elapsedSec)}</p>
          {failed ? <p className="text-sm text-destructive">{t("meditation.playbackError")}</p> : null}
          <button
            type="button"
            onClick={togglePause}
            disabled={loading || !audioSrc}
            className="btn-neural w-full min-h-[44px] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : blocked || !playing || paused ? (
              <Play size={16} />
            ) : (
              <Pause size={16} />
            )}
            {blocked || !playing
              ? t("meditation.tapToStart")
              : paused
                ? t("meditation.resume")
                : t("meditation.pause")}
          </button>
        </div>
      </div>
    </div>
  );
}

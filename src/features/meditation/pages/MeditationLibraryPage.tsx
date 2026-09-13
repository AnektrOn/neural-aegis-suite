import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flower2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { LibraryScope } from "@/lib/library-scope";
import { isLibraryScope } from "@/lib/library-scope";
import type { MeditationTrack } from "../types";
import { Skeleton } from "@/components/ui/skeleton";

type ScopeFilter = "all" | LibraryScope;

export default function MeditationLibraryPage() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";

  const [tracks, setTracks] = useState<MeditationTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("meditation_assignments")
        .select(
          `
          assigned_at,
          meditation_tracks (
            id,
            title,
            duration_label,
            library_scope
          )
        `,
        )
        .eq("user_id", user.id)
        .order("assigned_at", { ascending: false });

      if (error) {
        toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
        setTracks([]);
        return;
      }

      const list: MeditationTrack[] = [];
      for (const row of data || []) {
        const track = row.meditation_tracks as
          | {
              id: string;
              title: string;
              duration_label: string | null;
              library_scope: string;
            }
          | null
          | undefined;
        if (!track?.id) continue;
        const scope = isLibraryScope(track.library_scope) ? track.library_scope : "global_fr";
        list.push({
          id: track.id,
          title: track.title,
          duration_label: track.duration_label,
          library_scope: scope,
          assigned_at: row.assigned_at as string,
        });
      }
      setTracks(list);
    } catch (e) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : t("toast.unexpected"),
        variant: "destructive",
      });
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [user, t, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (scopeFilter === "all") return tracks;
    return tracks.filter((track) => track.library_scope === scopeFilter);
  }, [tracks, scopeFilter]);

  const scopeLabel = (scope: LibraryScope) => {
    if (scope === "global_fr") return t("meditation.filterGlobalFr");
    if (scope === "global_en") return t("meditation.filterGlobalEn");
    return t("meditation.filterPerso");
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="mb-3 text-neural-label text-neural-accent/60">{t("meditation.kicker")}</p>
        <h1 className="flex items-center gap-3 text-neural-title text-3xl text-foreground">
          <Flower2 size={28} strokeWidth={1.25} className="shrink-0 text-primary" />
          {t("meditation.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("meditation.subtitle")}</p>
      </div>

      {!loading && tracks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {(["all", "global_fr", "global_en", "perso"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setScopeFilter(key)}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-label uppercase transition-all cursor-pointer ${
                scopeFilter === key
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground/30"
              }`}
            >
              {key === "all" ? t("meditation.filterAll") : scopeLabel(key)}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2" aria-busy="true" aria-label={t("meditation.loading")}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ethereal-glass rounded-xl border border-border/20 p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && tracks.length === 0 ? (
        <div className="ethereal-glass p-12 text-center">
          <Flower2 size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t("meditation.empty")}</p>
        </div>
      ) : null}

      {!loading && tracks.length > 0 && visible.length === 0 ? (
        <div className="ethereal-glass p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("meditation.emptyFilter")}</p>
        </div>
      ) : null}

      {!loading && visible.length > 0 ? (
        <div className="space-y-2">
          {visible.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => navigate(`/meditation/${track.id}`)}
              className="ethereal-glass w-full rounded-xl border border-border/20 p-4 text-left transition-all hover:border-primary/25 cursor-pointer min-h-[44px]"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-lg border border-border/30 p-2 text-muted-foreground">
                  <Play size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{track.title}</p>
                    <span className="shrink-0 rounded-full border border-border/40 px-2 py-0.5 text-[8px] uppercase tracking-widest text-muted-foreground">
                      {scopeLabel(track.library_scope)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-neural-label text-xs">
                    {track.duration_label || "—"} · {new Date(track.assigned_at).toLocaleDateString(dateLocale)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

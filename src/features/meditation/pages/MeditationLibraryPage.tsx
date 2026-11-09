import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flower2, Play, Sparkles, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { LibraryScope } from "@/lib/library-scope";
import { isLibraryScope } from "@/lib/library-scope";
import type { MeditationTrack } from "../types";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import { cn } from "@/lib/utils";

type ScopeFilter = "all" | LibraryScope;

export default function MeditationLibraryPage() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";

  const [tracks, setTracks] = useState<MeditationTrack[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [mobileTab, setMobileTab] = useState<"catalog" | "featured">("catalog");

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

  useEffect(() => {
    if (!visible.length) {
      setSelectedId(null);
    } else if (!selectedId || !visible.some((t) => t.id === selectedId)) {
      setSelectedId(visible[0].id);
    }
  }, [visible, selectedId]);

  const selectedTrack = useMemo(
    () => visible.find((t) => t.id === selectedId) ?? visible[0] ?? null,
    [visible, selectedId],
  );

  const scopeLabel = (scope: LibraryScope) => {
    if (scope === "global_fr") return t("meditation.filterGlobalFr");
    if (scope === "global_en") return t("meditation.filterGlobalEn");
    return t("meditation.filterPerso");
  };

  const leftPane = (
    <div className="space-y-5">
      <div>
        <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.24em] uppercase text-[#9e7828] dark:text-[#c9a24b] mb-1.5 flex items-center gap-2">
          <Sparkles size={12} className="text-[#c9a24b]" />
          <span>{t("meditation.kicker")} · FRÉQUENCE CIRCADIENNE</span>
        </p>
        <h1 className="flex items-center gap-3 font-cormorant text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight">
          <Flower2 size={32} strokeWidth={1.2} className="shrink-0 text-[#c9a24b]" />
          {t("meditation.title")}
        </h1>
        <p className="font-sans mt-2 max-w-xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {t("meditation.subtitle")}
        </p>
      </div>

      {!loading && tracks.length > 0 ? (
        <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-1.5 pt-1 sm:flex-wrap">
          {(["all", "global_fr", "global_en", "perso"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setScopeFilter(key)}
              className={cn(
                "shrink-0 min-h-[38px] font-cinzel text-[9.5px] font-semibold tracking-[0.14em] rounded-xl border px-3.5 py-1.5 uppercase transition-all cursor-pointer whitespace-nowrap",
                scopeFilter === key
                  ? "border-[#c9a24b]/60 bg-[#c9a24b]/20 text-[#c9a24b] shadow-sm font-semibold"
                  : "border-white/5 bg-black/25 text-muted-foreground hover:border-white/15 hover:text-foreground",
              )}
            >
              {key === "all" ? t("meditation.filterAll") : scopeLabel(key)}
            </button>
          ))}
        </div>
      ) : null}

      {/* Mobile Segmented Switcher (<lg) */}
      <div className="flex lg:hidden items-center p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab("catalog")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "catalog"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          🎧 Sessions ({visible.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("featured")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "featured"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          ✨ En Vedette
        </button>
      </div>

      {/* Spotlight Practice Card */}
      <div className={cn("space-y-4", mobileTab !== "featured" && "hidden lg:block", "pb-[calc(var(--mobile-dock-padding,5rem)+1.5rem)] lg:pb-0")}>
      {selectedTrack ? (
        <div className="aegis-dock-tile p-6 sm:p-7 space-y-5 rounded-2xl border border-[rgba(233,228,216,0.1)] shadow-[0_12px_44px_rgba(0,0,0,0.35)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[radial-gradient(circle,rgba(201,162,75,0.18)_0%,transparent_70%)] pointer-events-none" />

          <div className="flex items-center justify-between gap-3 relative z-10">
            <span className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a24b]">
              SESSION RECOMMANDÉE
            </span>
            <span className="font-mono text-[9.5px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/10 bg-black/40 text-[#c9a24b]">
              {scopeLabel(selectedTrack.library_scope)}
            </span>
          </div>

          <div className="space-y-2 relative z-10">
            <h2 className="font-cormorant text-2xl sm:text-3xl font-light text-foreground leading-tight">
              {selectedTrack.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <Volume2 size={13} className="text-[#c9a24b]" />
                {selectedTrack.duration_label || "Durée libre"}
              </span>
              <span>·</span>
              <span>Assigné le {new Date(selectedTrack.assigned_at).toLocaleDateString(dateLocale)}</span>
            </div>
          </div>

          <div className="pt-2 relative z-10">
            <button
              type="button"
              onClick={() => navigate(`/meditation/${selectedTrack.id}`)}
              className="btn-solaire w-full sm:w-auto px-7 py-3 text-xs font-cinzel font-semibold tracking-[0.16em] uppercase flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
            >
              <Play size={14} className="fill-current" />
              <span>Lancer l&apos;Immersion</span>
            </button>
          </div>
        </div>
      ) : !loading && tracks.length === 0 ? (
        <div className="aegis-dock-tile p-12 text-center rounded-2xl border border-white/5 space-y-3">
          <Flower2 size={36} strokeWidth={1} className="mx-auto text-[#c9a24b]/30" />
          <p className="font-cormorant text-xl font-light italic text-muted-foreground">{t("meditation.empty")}</p>
        </div>
      ) : null}
      </div>
    </div>
  );

  const rightPane = (
    <div className={cn("space-y-3", mobileTab !== "catalog" && "hidden lg:block")}>
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
        <p className="font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t("meditation.kicker")} · CATALOGUE
        </p>
        <span className="font-mono text-xs text-muted-foreground">
          {visible.length} {visible.length > 1 ? "sessions" : "session"}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2.5" aria-busy="true" aria-label={t("meditation.loading")}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aegis-dock-tile p-4 rounded-xl border border-white/5 animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-white/5 rounded" />
                <div className="h-3 w-1/3 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && tracks.length > 0 && visible.length === 0 ? (
        <div className="aegis-dock-tile p-12 text-center rounded-2xl border border-white/5">
          <p className="text-sm text-muted-foreground">{t("meditation.emptyFilter")}</p>
        </div>
      ) : null}

      {!loading && visible.length > 0 ? (
        <div className="space-y-2.5">
          {visible.map((track) => {
            const isSelected = track.id === selectedId;
            return (
              <div
                key={track.id}
                onClick={() => setSelectedId(track.id)}
                className={cn(
                  "aegis-dock-tile w-full rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer flex items-center gap-3.5 group",
                  isSelected
                    ? "border-[#c9a24b]/50 bg-[#c9a24b]/[0.08] shadow-[0_8px_24px_rgba(201,162,75,0.15)]"
                    : "border-[rgba(233,228,216,0.08)] hover:border-white/20",
                )}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/meditation/${track.id}`);
                  }}
                  title="Écouter la session"
                  className={cn(
                    "w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all",
                    isSelected
                      ? "bg-[#c9a24b] text-black shadow-md"
                      : "bg-white/5 text-muted-foreground group-hover:bg-[#c9a24b]/20 group-hover:text-[#c9a24b]",
                  )}
                >
                  <Play size={15} className={cn("ml-0.5", isSelected ? "fill-current" : "")} />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("truncate text-sm font-medium transition-colors", isSelected ? "text-[#c9a24b]" : "text-foreground")}>
                      {track.title}
                    </p>
                    <span className="shrink-0 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[8.5px] uppercase tracking-wider text-muted-foreground">
                      {scopeLabel(track.library_scope)}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground flex items-center gap-2">
                    <span>{track.duration_label || "Durée libre"}</span>
                    <span>·</span>
                    <span>{new Date(track.assigned_at).toLocaleDateString(dateLocale)}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  return <MemberSplitLayout left={leftPane} right={rightPane} scrollLeft={true} />;
}

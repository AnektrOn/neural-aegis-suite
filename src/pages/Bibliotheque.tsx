import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Library, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { LibraryScope } from "@/lib/library-scope";
import { getLibraryScope, isLibraryScope } from "@/lib/library-scope";
import { pickLocalizedText } from "@/lib/content-i18n";
import type { Locale } from "@/i18n/translations";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import { cn } from "@/lib/utils";

type JsonI18n = Partial<Record<Locale, string>> | Record<string, string> | null;

interface LibraryRow {
  id: string;
  title: string;
  external_url: string;
  duration: string | null;
  assigned_at: string;
  library_scope: LibraryScope;
}

/** Returns an iframe-safe embed URL for Drive or YouTube, or null if not supported. */
function toLibraryEmbedUrl(externalUrl: string): string | null {
  const raw = externalUrl.trim();
  if (!raw) return null;

  if (raw.includes("drive.google.com")) {
    const fromPath = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fromPath?.[1]) {
      return `https://drive.google.com/file/d/${fromPath[1]}/preview`;
    }
    try {
      const url = new URL(raw);
      const id = url.searchParams.get("id");
      if (id && url.hostname.includes("drive.google.com")) {
        return `https://drive.google.com/file/d/${id}/preview`;
      }
    } catch {
      return null;
    }
    return null;
  }

  if (raw.includes("youtube.com") || raw.includes("youtu.be")) {
    try {
      const url = new URL(raw);
      let vid: string | null = null;
      if (url.hostname === "youtu.be") {
        vid = url.pathname.replace(/^\//, "").split("/")[0] || null;
      } else if (url.hostname.includes("youtube.com")) {
        vid = url.searchParams.get("v");
        if (!vid && url.pathname.startsWith("/embed/")) {
          vid = url.pathname.replace(/^\/embed\//, "").split("/")[0] || null;
        }
      }
      if (vid) return `https://www.youtube.com/embed/${vid}`;
    } catch {
      return null;
    }
  }

  return null;
}

/** Stable key so the same clip is not listed twice when it exists in both library tables and legacy toolbox rows. */
function embedDedupeKey(externalUrl: string): string | null {
  const embed = toLibraryEmbedUrl(externalUrl);
  return embed ?? null;
}

type LibraryFilter = "all" | LibraryScope;

export default function Bibliotheque() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";

  const [rows, setRows] = useState<LibraryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState<LibraryFilter>("all");
  const [mobileTab, setMobileTab] = useState<"player" | "catalog">("player");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [libRes, tbRes] = await Promise.all([
        supabase
          .from("library_video_assignments")
          .select(
            `
          id,
          assigned_at,
          library_videos (
            id,
            title,
            title_i18n,
            external_url,
            meta,
            library_scope
          )
        `,
          )
          .eq("user_id", user.id)
          .order("assigned_at", { ascending: false }),
        supabase
          .from("toolbox_assignments")
          .select("id, title, title_i18n, external_url, duration, assigned_at, widget_config, content_type, user_delivery_status")
          .eq("user_id", user.id)
          .neq("user_delivery_status", "inactive")
          .eq("content_type", "external_link")
          .not("external_url", "is", null)
          .order("assigned_at", { ascending: false }),
      ]);

      if (libRes.error && tbRes.error) {
        toast({
          title: t("toast.error"),
          description: [libRes.error.message, tbRes.error.message].filter(Boolean).join(" · "),
          variant: "destructive",
        });
        setRows([]);
        return;
      }

      if (libRes.error) {
        console.warn("Bibliothèque: library_video_assignments:", libRes.error.message);
      }
      if (tbRes.error) {
        console.warn("Bibliothèque: toolbox_assignments (legacy):", tbRes.error.message);
      }

      const list: LibraryRow[] = [];
      const seenEmbedKeys = new Set<string>();

      const isExcludedVideo = (title: string) => {
        const normalized = title.toLowerCase().replace(/[_\s]/g, " ");
        return normalized.includes("deep transformation") || normalized.includes("transformation profonde");
      };

      if (!libRes.error) {
        for (const row of libRes.data || []) {
          const vid = row.library_videos as
            | {
                id: string;
                title: string;
                title_i18n?: JsonI18n;
                external_url: string;
                meta: unknown;
                library_scope: string;
              }
            | null
            | undefined;
          if (!vid?.external_url) continue;
          const dedupe = embedDedupeKey(vid.external_url);
          if (!dedupe) continue;
          seenEmbedKeys.add(dedupe);
          const meta = vid.meta as { duration_label?: string } | null;
          const scope = isLibraryScope(vid.library_scope) ? vid.library_scope : "global_fr";
          const displayTitle = pickLocalizedText(locale as Locale, vid.title_i18n, vid.title);
          if (isExcludedVideo(displayTitle)) continue;
          list.push({
            id: `lib:${vid.id}`,
            title: displayTitle,
            external_url: vid.external_url,
            duration: meta?.duration_label ?? null,
            assigned_at: row.assigned_at as string,
            library_scope: scope,
          });
        }
      }

      if (!tbRes.error) {
        for (const row of tbRes.data || []) {
          const url = row.external_url as string | null;
          if (!url) continue;
          const dedupe = embedDedupeKey(url);
          if (!dedupe) continue;
          if (seenEmbedKeys.has(dedupe)) continue;
          seenEmbedKeys.add(dedupe);
          const scope = getLibraryScope(row.widget_config);
          const displayTitle = pickLocalizedText(locale as Locale, row.title_i18n as JsonI18n, row.title as string);
          if (isExcludedVideo(displayTitle)) continue;
          list.push({
            id: `tb:${row.id}`,
            title: displayTitle,
            external_url: url,
            duration: (row.duration as string | null) ?? null,
            assigned_at: row.assigned_at as string,
            library_scope: scope,
          });
        }
      }

      list.sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime());

      setRows(list);
    } catch (e) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : t("toast.unexpected"),
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user, t, toast, locale]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleRows = useMemo(() => {
    if (scopeFilter === "all") return rows;
    return rows.filter((r) => r.library_scope === scopeFilter);
  }, [rows, scopeFilter]);

  useEffect(() => {
    setSelectedId((prev) => {
      if (prev && visibleRows.some((r) => r.id === prev)) return prev;
      return visibleRows[0]?.id ?? null;
    });
  }, [visibleRows]);

  const selected = useMemo(() => visibleRows.find((r) => r.id === selectedId) ?? null, [visibleRows, selectedId]);
  const embedSrc = selected?.external_url ? toLibraryEmbedUrl(selected.external_url) : null;

  const scopeLabel = (scope: LibraryScope) => {
    if (scope === "global_fr") return t("library.filterGlobalFr");
    if (scope === "global_en") return t("library.filterGlobalEn");
    return t("library.filterPerso");
  };

  const leftPane = (
    <div className="space-y-4">
      <div>
        <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.24em] uppercase text-[#9e7828] dark:text-[#c9a24b] mb-1.5">
          {t("library.kicker")} · TRANSMISSIONS MAÎTRES
        </p>
        <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight flex items-center gap-2.5">
          <Library size={28} strokeWidth={1.2} className="text-[#c9a24b] shrink-0" />
          {t("library.title")}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">{t("library.subtitle")}</p>
      </div>

      {!loading && rows.length > 0 && (
        <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-1.5 pt-1 sm:flex-wrap">
          {(["all", "global_fr", "global_en", "perso"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setScopeFilter(key)}
              className={cn(
                "shrink-0 font-cinzel text-[9.5px] font-semibold uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap",
                scopeFilter === key
                  ? "border-[#c9a24b]/60 bg-[#c9a24b]/20 text-[#c9a24b] shadow-sm font-semibold"
                  : "border-white/5 bg-black/25 text-muted-foreground hover:border-white/15 hover:text-foreground",
              )}
            >
              {key === "all" ? t("library.filterAll") : scopeLabel(key)}
            </button>
          ))}
        </div>
      )}

      {/* Mobile Segmented Switcher (<lg) */}
      <div className="flex lg:hidden items-center p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab("player")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "player"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          📺 Lecteur
        </button>
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
          📜 Catalogue ({visibleRows.length})
        </button>
      </div>

      <div className={cn("space-y-4", mobileTab !== "player" && "hidden lg:block", "pb-[calc(var(--mobile-dock-padding,5rem)+1.5rem)] lg:pb-0")}>
      {selected && embedSrc ? (
        <div className="aegis-dock-tile p-5 space-y-3.5 rounded-2xl shadow-[0_12px_44px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-foreground truncate pr-2">
              {selected.title}
            </h2>
            <span className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/10 bg-black/30 text-[#c9a24b] shrink-0">
              {scopeLabel(selected.library_scope)}
            </span>
          </div>
          <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black aspect-video shadow-2xl">
            <iframe
              title={selected.title}
              src={embedSrc}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
          <p className="font-mono text-[10.5px] text-muted-foreground flex items-center justify-between">
            <span>{selected.duration || "—"}</span>
            <span>Assigné le {new Date(selected.assigned_at).toLocaleDateString(dateLocale)}</span>
          </p>
        </div>
      ) : (
        <div className="aegis-dock-tile p-12 text-center text-muted-foreground text-sm rounded-2xl shadow-md space-y-2">
          <Library size={32} strokeWidth={1} className="mx-auto text-[#c9a24b]/30" />
          <p className="font-cormorant text-lg font-light italic">{t("library.selectPrompt")}</p>
        </div>
      )}
      </div>
    </div>
  );

  const rightPane = (
    <div className={cn("space-y-3", mobileTab !== "catalog" && "hidden lg:block")}>
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
        <p className="font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t("library.listHeading")}
        </p>
        <span className="font-mono text-xs text-muted-foreground">
          {visibleRows.length} {visibleRows.length > 1 ? "vidéos" : "vidéo"}
        </span>
      </div>

      {loading && (
        <div className="aegis-dock-tile p-12 text-center rounded-2xl">
          <div className="w-7 h-7 border-2 border-[#c9a24b]/30 border-t-[#c9a24b] rounded-full animate-spin mx-auto" />
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="aegis-dock-tile p-12 text-center rounded-2xl shadow-md">
          <Library size={32} strokeWidth={1} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">{t("library.empty")}</p>
        </div>
      )}

      {!loading && rows.length > 0 && visibleRows.length === 0 && (
        <div className="aegis-dock-tile p-12 text-center rounded-2xl shadow-md">
          <p className="text-muted-foreground text-sm">{t("library.emptyFilter")}</p>
        </div>
      )}

      {!loading && visibleRows.length > 0 && (
        <div className="space-y-2">
          {visibleRows.map((item, i) => {
            const active = item.id === selectedId;
            const sc = item.library_scope;
            return (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.25) }}
                onClick={() => {
                  setSelectedId(item.id);
                  setMobileTab("player");
                }}
                className={cn(
                  "w-full text-left aegis-dock-tile p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm",
                  active
                    ? "border-[#c9a24b]/60 bg-[#c9a24b]/15 shadow-[0_0_24px_rgba(201,162,75,0.18)]"
                    : "border-white/5 hover:border-[#c9a24b]/30 hover:bg-black/30",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 shrink-0 rounded-xl p-2.5 border transition-all",
                      active
                        ? "border-[#c9a24b] bg-[#c9a24b] text-[#0b0b0a] shadow-sm"
                        : "border-white/10 bg-black/30 text-muted-foreground",
                    )}
                  >
                    <Play size={13} fill={active ? "currentColor" : "none"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn("text-xs font-medium truncate", active ? "text-[#c9a24b] font-semibold" : "text-foreground")}>
                        {item.title}
                      </p>
                      <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 text-muted-foreground shrink-0 font-mono">
                        {scopeLabel(sc)}
                      </span>
                    </div>
                    <p className="font-mono mt-1 text-[10px] text-muted-foreground">
                      {item.duration || "—"} &bull; {new Date(item.assigned_at).toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <MemberPageScaffold width="wide" viewport className="min-w-0 overflow-x-hidden">
      <MemberSplitLayout
        left={leftPane}
        right={rightPane}
        leftColSpan={7}
        rightColSpan={5}
        scrollRight={true}
        scrollLeft={true}
      />
    </MemberPageScaffold>
  );
}

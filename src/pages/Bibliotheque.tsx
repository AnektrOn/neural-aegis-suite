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
          .select("id, title, title_i18n, external_url, duration, assigned_at, widget_config, content_type")
          .eq("user_id", user.id)
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
          list.push({
            id: `lib:${vid.id}`,
            title: pickLocalizedText(locale as Locale, vid.title_i18n, vid.title),
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
          list.push({
            id: `tb:${row.id}`,
            title: pickLocalizedText(locale as Locale, row.title_i18n as JsonI18n, row.title as string),
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

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">{t("library.kicker")}</p>
        <h1 className="text-neural-title text-3xl text-foreground flex items-center gap-3">
          <Library size={28} strokeWidth={1.25} className="text-primary shrink-0" />
          {t("library.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{t("library.subtitle")}</p>
      </div>

      {!loading && rows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(["all", "global_fr", "global_en", "perso"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setScopeFilter(key)}
              className={`text-[9px] uppercase tracking-[0.2em] px-4 py-2 rounded-full border transition-all ${
                scopeFilter === key
                  ? "text-primary border-primary/30 bg-primary/5"
                  : "text-muted-foreground border-border hover:border-muted-foreground/30"
              }`}
            >
              {key === "all" ? t("library.filterAll") : scopeLabel(key)}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="ethereal-glass p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="ethereal-glass p-12 text-center">
          <Library size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">{t("library.empty")}</p>
        </div>
      )}

      {!loading && rows.length > 0 && visibleRows.length === 0 && (
        <div className="ethereal-glass p-12 text-center">
          <p className="text-muted-foreground text-sm">{t("library.emptyFilter")}</p>
        </div>
      )}

      {!loading && rows.length > 0 && visibleRows.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <p className="text-neural-label mb-2">{t("library.listHeading")}</p>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {visibleRows.map((item, i) => {
                const active = item.id === selectedId;
                const sc = item.library_scope;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left ethereal-glass p-4 rounded-xl border transition-all ${
                      active
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/20 hover:border-primary/25"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 shrink-0 rounded-lg p-2 border ${
                          active ? "border-primary/30 bg-primary/10 text-primary" : "border-border/30 text-muted-foreground"
                        }`}
                      >
                        <Play size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                          <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-border/40 text-muted-foreground shrink-0">
                            {scopeLabel(sc)}
                          </span>
                        </div>
                        <p className="text-neural-label mt-0.5 text-xs">
                          {item.duration || "—"} · {new Date(item.assigned_at).toLocaleDateString(dateLocale)}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <p className="text-neural-label">{t("library.playerHeading")}</p>
            {selected && embedSrc ? (
              <div className="ethereal-glass p-4 sm:p-5 space-y-3">
                <p className="text-sm font-medium text-foreground">{selected.title}</p>
                <div className="relative w-full overflow-hidden rounded-xl border border-border/30 bg-black aspect-video">
                  <iframe
                    title={selected.title}
                    src={embedSrc}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <div className="ethereal-glass p-8 text-center text-muted-foreground text-sm">{t("library.selectPrompt")}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Loader2, TreePine } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  POLE_PART_META,
  POLE_PART_ORDER,
  TAO_POLES_ENABLED,
  WU_XING_META,
  WU_XING_POLES,
  type PolePartId,
  type TaoPortraitPartRow,
  type WuXingPole,
} from "../domain/types";
import { countFilledParts, hasTransversalT2, partsByPole } from "../services/taoPortraitService";
import { TaoMarkdownBody } from "./TaoMarkdownBody";
import { TaoPortraitEmpty } from "./TaoPortraitEmpty";

interface TaoPortraitPanelProps {
  parts: TaoPortraitPartRow[];
  loading?: boolean;
  className?: string;
  /** Inside Deep Dive — skip standalone page chrome */
  variant?: "standalone" | "embedded";
}

export function TaoPortraitPanel({ parts, loading, className, variant = "standalone" }: TaoPortraitPanelProps) {
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";
  const [searchParams] = useSearchParams();

  const initialPole = TAO_POLES_ENABLED[0] ?? "wood";
  const [pole, setPole] = useState<WuXingPole>(initialPole);
  const [partId, setPartId] = useState<PolePartId>("P01_DIA");
  const [view, setView] = useState<"pole" | "t2">("pole");

  useEffect(() => {
    if (variant !== "embedded") return;
    const viewParam = searchParams.get("view");
    const poleParam = searchParams.get("pole");
    if (viewParam === "t2") {
      setView("t2");
      return;
    }
    if (poleParam && TAO_POLES_ENABLED.includes(poleParam as WuXingPole)) {
      setView("pole");
      setPole(poleParam as WuXingPole);
      setPartId("P01_DIA");
    }
  }, [searchParams, variant]);

  const poleParts = useMemo(() => partsByPole(parts, pole), [parts, pole]);
  const activePart = poleParts[partId];
  const meta = pole !== "transversal" ? WU_XING_META[pole] : null;
  const t2Row = parts.find((r) => r.pole === "transversal" && r.part_id === "T2_SYNTHESIS");
  const woodFilled = countFilledParts(parts, "wood");
  const hasT2 = hasTransversalT2(parts);

  if (loading) {
    return (
      <div className={cn("flex min-h-[240px] items-center justify-center", className)}>
        <Loader2 className="h-7 w-7 animate-spin text-primary" strokeWidth={1.5} aria-hidden />
      </div>
    );
  }

  const showEmpty = view === "pole" ? woodFilled === 0 && pole === "wood" : !hasT2;

  const poleSelector = (
    <div className={cn("flex flex-wrap gap-2", variant === "standalone" ? "mt-5" : "mb-4")}>
      <button
        type="button"
        onClick={() => setView("t2")}
        className={cn(
          "rounded-full border px-3 py-1.5 text-[11px] font-display uppercase tracking-wider transition-colors min-h-[36px]",
          view === "t2"
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border/40 text-muted-foreground hover:border-border/60",
        )}
      >
        {t("tao.portrait.t2Tab")}
        {hasT2 ? (
          <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" aria-hidden />
        ) : null}
      </button>
      {WU_XING_POLES.map((p) => {
        const m = WU_XING_META[p];
        const enabled = TAO_POLES_ENABLED.includes(p);
        const filled = countFilledParts(parts, p);
        return (
          <button
            key={p}
            type="button"
            disabled={!enabled}
            onClick={() => {
              setView("pole");
              setPole(p);
              setPartId("P01_DIA");
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-display uppercase tracking-wider transition-colors min-h-[36px]",
              !enabled && "opacity-40 cursor-not-allowed",
              view === "pole" && pole === p
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/40 text-muted-foreground hover:border-border/60",
            )}
          >
            {m.emoji} {isFR ? m.label_fr : m.label_en}
            {filled > 0 ? (
              <span className="ml-1.5 text-[10px] opacity-70">({filled}/5)</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={cn("space-y-5", className)}>
      {variant === "standalone" ? (
        <header className="rounded-2xl border border-border/40 bg-card/40 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/40 text-xl"
              style={
                meta
                  ? {
                      borderColor: `color-mix(in srgb, ${meta.color} 40%, transparent)`,
                      background: `color-mix(in srgb, ${meta.color} 10%, hsl(var(--card)))`,
                    }
                  : undefined
              }
            >
              {meta ? meta.emoji : "🌀"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {t("tao.portrait.eyebrow")}
              </p>
              <h2 className="mt-1 font-cormorant-display text-2xl text-foreground leading-tight">
                {t("tao.portrait.title")}
              </h2>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed font-body">
                {t("tao.portrait.subtitle")}
              </p>
            </div>
          </div>
          {poleSelector}
        </header>
      ) : (
        poleSelector
      )}

      {view === "t2" ? (
        <section className="rounded-2xl border border-border/40 bg-card/30 p-5 sm:p-8">
          {!t2Row?.content_md?.trim() ? (
            <TaoPortraitEmpty variant="t2" />
          ) : (
            <TaoMarkdownBody markdown={t2Row.content_md} accentColor="hsl(var(--primary))" />
          )}
        </section>
      ) : showEmpty ? (
        <TaoPortraitEmpty variant="pole" pole={pole} />
      ) : (
        <>
          <Tabs value={partId} onValueChange={(v) => setPartId(v as PolePartId)}>
            <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 bg-muted/30 p-1">
              {POLE_PART_ORDER.map((id) => {
                const pm = POLE_PART_META[id];
                const filled = Boolean(poleParts[id]?.content_md?.trim());
                return (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="text-[10px] sm:text-xs font-display uppercase tracking-wider data-[state=active]:bg-background min-h-[40px] gap-1.5"
                  >
                    <span className="opacity-60">{pm.code}</span>
                    <span className="hidden sm:inline">{isFR ? pm.short_fr : pm.short_en}</span>
                    {filled ? (
                      <FileText size={12} className="text-primary shrink-0" aria-hidden />
                    ) : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {POLE_PART_ORDER.map((id) => {
              const row = poleParts[id];
              const pm = POLE_PART_META[id];
              return (
                <TabsContent key={id} value={id} className="mt-4 focus-visible:outline-none">
                  <article className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
                    <div
                      className="px-5 py-4 border-b border-border/30 flex items-center gap-3"
                      style={
                        meta
                          ? {
                              background: `linear-gradient(90deg, color-mix(in srgb, ${meta.color} 8%, transparent), transparent)`,
                            }
                          : undefined
                      }
                    >
                      <TreePine
                        size={18}
                        strokeWidth={1.5}
                        style={{ color: meta?.color }}
                        className="shrink-0"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {pm.code} · {meta ? (isFR ? meta.label_fr : meta.label_en) : ""}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {isFR ? pm.label_fr : pm.label_en}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 sm:p-8">
                      {!row?.content_md?.trim() ? (
                        <TaoPortraitEmpty variant="part" partId={id} pole={pole} />
                      ) : (
                        <TaoMarkdownBody markdown={row.content_md} accentColor={meta?.color} />
                      )}
                    </div>
                  </article>
                </TabsContent>
              );
            })}
          </Tabs>
        </>
      )}
    </div>
  );
}

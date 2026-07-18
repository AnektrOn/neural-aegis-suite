import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Layers,
  BookOpen,
  Sparkles,
  ChevronsDownUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
} from "lucide-react";
import { NeuralCard } from "@/components/ui/neural-card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { parseUniversalMarkdownDocument } from "@/lib/cartography-document-parse";
import { sectionTitleParts } from "./BalanceRichText";
import { ReportSectionPanel } from "./ReportSectionPanel";
import { ReportContentBlocks } from "./ReportContentBlocks";

type FileKind = "cartographie" | "synthesis" | "detailed" | "guardians";

const KIND_CONFIG: Record<
  FileKind,
  { glow: "warm" | "purple"; icon: typeof Layers; accent: string; border: string }
> = {
  cartographie: {
    glow: "warm",
    icon: Layers,
    accent: "text-[hsl(var(--aegis-warm))]",
    border: "border-[hsl(var(--aegis-warm))]",
  },
  synthesis: {
    glow: "warm",
    icon: BookOpen,
    accent: "text-[hsl(var(--aegis-warm))]",
    border: "border-[hsl(var(--aegis-warm))]",
  },
  detailed: {
    glow: "purple",
    icon: FileText,
    accent: "text-[hsl(var(--neural-accent))]",
    border: "border-[hsl(var(--neural-accent))]",
  },
  guardians: {
    glow: "purple",
    icon: Sparkles,
    accent: "text-[hsl(var(--neural-accent))]",
    border: "border-[hsl(var(--neural-accent))]",
  },
};

function extractNavLabel(title: string, index: number): { num: string; label: string; full: string } {
  const parts = sectionTitleParts(title);
  const num = parts.num ?? String(index);
  const label = parts.label || title;
  return { num, label, full: title };
}


export function CartographyFileView({
  markdown,
  title,
  reportCode,
  kind = "cartographie",
}: {
  markdown: string;
  title?: string | null;
  reportCode?: string;
  kind?: FileKind;
}) {
  const { t } = useLanguage();
  const doc = parseUniversalMarkdownDocument(markdown);
  const cfg = KIND_CONFIG[kind];
  const Icon = cfg.icon;
  const displayTitle = title ?? doc.title ?? reportCode?.toUpperCase() ?? t("cartography.fileDefaultTitle");
  const codeLabel = reportCode?.match(/p0?(\d)/i)?.[0]?.toUpperCase();
  const [activeSection, setActiveSection] = useState(doc.sections[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  const isLongDoc = doc.sections.length >= 2 || kind === "synthesis";
  const sectionVariant = isLongDoc ? "flat" : "card";
  const sectionCollapsible = !isLongDoc;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(doc.sections.map((s, i) => [s.id, i === 0])),
  );

  useEffect(() => {
    setOpenSections(Object.fromEntries(doc.sections.map((s, i) => [s.id, i === 0])));
    setActiveSection(doc.sections[0]?.id ?? "");
  }, [markdown]);

  const allExpanded = useMemo(
    () => doc.sections.every((s) => openSections[s.id] !== false),
    [doc.sections, openSections],
  );

  useEffect(() => {
    if (doc.sections.length < 2) return;
    const elements = doc.sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];
    if (!elements.length) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        const id = visible[0]?.target.id;
        if (id) setActiveSection(id);
      },
      { rootMargin: "-15% 0px -60% 0px", threshold: [0, 0.2, 0.5] },
    );
    for (const el of elements) observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [doc.sections]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    if (sectionCollapsible) {
      setOpenSections((prev) => ({ ...prev, [id]: true }));
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleAllSections = () => {
    const next = !allExpanded;
    setOpenSections(Object.fromEntries(doc.sections.map((s) => [s.id, next])));
  };

  return (
    <article className="scroll-mt-[calc(var(--safe-top)+9rem)]">
      <NeuralCard variant="premium" glow={cfg.glow} className="overflow-hidden p-0">
        <header className="relative border-b border-border-subtle/40 px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start gap-4">
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-subtle/40 bg-black/20",
                cfg.accent,
              )}
            >
              <Icon size={20} strokeWidth={1.5} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              {codeLabel && (
                <span
                  className={cn(
                    "inline-block rounded-md border border-border-subtle/40 bg-black/15 px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.18em]",
                    cfg.accent,
                  )}
                >
                  {codeLabel}
                </span>
              )}
              <h2 className="mt-1 font-display text-base leading-snug text-text-primary sm:text-lg">
                {displayTitle}
              </h2>
            </div>
          </div>
        </header>

        <div
          className={cn(
            doc.sections.length > 1 && "lg:grid lg:grid-cols-[minmax(15rem,17rem)_1fr] lg:items-start",
          )}
        >
          {doc.sections.length > 1 && (
            <>
              {/* Desktop — navigation latérale */}
              <nav
                className="sticky top-[calc(var(--safe-top)+3.5rem)] z-10 hidden max-h-[calc(100vh-6rem)] flex-col overflow-y-auto border-b border-border-subtle/25 bg-[hsl(var(--aegis-s1))]/96 px-4 py-4 backdrop-blur-md lg:flex lg:border-b-0 lg:border-r lg:px-3 lg:py-5"
                aria-label={t("cartography.fileSectionsNav")}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-display uppercase tracking-[0.14em] text-text-tertiary">
                    {t("cartography.fileSectionCount", { count: doc.sections.length })}
                  </p>
                  {sectionCollapsible && (
                    <button
                      type="button"
                      onClick={toggleAllSections}
                      className="inline-flex min-h-[32px] items-center gap-1 rounded-md px-1.5 text-[10px] uppercase tracking-[0.08em] text-text-tertiary transition-colors hover:bg-white/[0.04] hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      title={
                        allExpanded
                          ? t("cartography.fileCollapseAll")
                          : t("cartography.fileExpandAll")
                      }
                    >
                      {allExpanded ? (
                        <ChevronsDownUp size={13} aria-hidden />
                      ) : (
                        <ChevronsUpDown size={13} aria-hidden />
                      )}
                    </button>
                  )}
                </div>
                <div className="relative flex flex-col gap-0.5">
                  {/* Filament vertical décoratif */}
                  <span
                    className="pointer-events-none absolute left-[0.6rem] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"
                    aria-hidden
                  />
                  {doc.sections.map((s, i) => {
                    const { num, label, full } = extractNavLabel(s.title, i + 1);
                    const isActive = activeSection === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        title={full}
                        onClick={() => scrollToSection(s.id)}
                        className={cn(
                          "group relative flex min-h-[44px] items-start gap-3 rounded-lg px-2.5 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive
                            ? "bg-white/[0.05] text-text-primary"
                            : "text-text-tertiary hover:bg-white/[0.03] hover:text-text-secondary",
                        )}
                        aria-current={isActive ? "true" : undefined}
                      >
                        {/* Puce numérotée / filament actif */}
                        <span
                          className={cn(
                            "relative z-[1] mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-display text-[10px] tabular-nums transition-all",
                            isActive
                              ? cn(cfg.border, "bg-[hsl(var(--aegis-s1))] text-text-primary shadow-[0_0_10px_hsl(var(--aegis-warm)/0.3)]")
                              : "border-border-subtle/40 bg-black/20 text-text-tertiary group-hover:border-border-subtle/70",
                          )}
                          aria-hidden
                        >
                          {num}
                        </span>
                        <span
                          className={cn(
                            "block flex-1 font-display text-[11px] leading-[1.35] tracking-[0.03em] line-clamp-2",
                            isActive && "font-medium",
                          )}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* Progression de lecture */}
                <div className="mt-4 border-t border-border-subtle/20 pt-3">
                  <div className="flex items-center justify-between text-[9px] font-display uppercase tracking-[0.18em] text-text-tertiary">
                    <span>{t("cartography.fileIntro")}</span>
                    <span className="tabular-nums text-text-secondary">
                      {Math.max(
                        1,
                        doc.sections.findIndex((s) => s.id === activeSection) + 1,
                      )}
                      /{doc.sections.length}
                    </span>
                  </div>
                  <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={cn("h-full transition-all duration-500", cfg.accent.replace("text-", "bg-"))}
                      style={{
                        width: `${
                          ((Math.max(
                            1,
                            doc.sections.findIndex((s) => s.id === activeSection) + 1,
                          )) /
                            doc.sections.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </nav>

              {/* Mobile / tablette — navigation horizontale */}
              <nav
                className="sticky top-[calc(var(--safe-top)+3.5rem)] z-10 border-b border-border-subtle/25 bg-[hsl(var(--aegis-s1))]/96 px-4 py-2 backdrop-blur-md sm:px-6 lg:hidden"
                aria-label={t("cartography.fileSectionsNav")}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-display uppercase tracking-[0.14em] text-text-tertiary">
                    {t("cartography.fileSectionCount", { count: doc.sections.length })}
                  </p>
                  {sectionCollapsible && (
                    <button
                      type="button"
                      onClick={toggleAllSections}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2 text-[10px] uppercase tracking-[0.1em] text-text-tertiary transition-colors hover:bg-white/[0.04] hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {allExpanded ? (
                        <>
                          <ChevronsDownUp size={13} aria-hidden />
                          {t("cartography.fileCollapseAll")}
                        </>
                      ) : (
                        <>
                          <ChevronsUpDown size={13} aria-hidden />
                          {t("cartography.fileExpandAll")}
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {doc.sections.map((s, i) => {
                    const { num, label, full } = extractNavLabel(s.title, i + 1);
                    const short = `${num} · ${label.length > 20 ? `${label.slice(0, 20)}…` : label}`;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        title={full}
                        onClick={() => scrollToSection(s.id)}
                        className={cn(
                          "shrink-0 min-h-[44px] max-w-[220px] truncate rounded-lg border px-3 py-2 text-left text-[11px] font-display tracking-[0.04em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:max-w-[280px]",
                          activeSection === s.id
                            ? cn("bg-white/[0.08] text-text-primary", cfg.border, "border-opacity-40")
                            : "border-transparent text-text-tertiary hover:bg-white/[0.04]",
                        )}
                        aria-current={activeSection === s.id ? "true" : undefined}
                      >
                        {short}
                      </button>
                    );
                  })}
                </div>
              </nav>
            </>
          )}

          <div
            className={cn(
              "min-w-0 px-4 py-5 sm:px-6 sm:py-6",
              sectionVariant === "flat" ? "space-y-8" : "space-y-4",
            )}
          >
          {doc.intro.length > 0 && (
            <div className="rounded-xl border border-[hsl(var(--aegis-warm)/0.12)] bg-[hsl(var(--aegis-warm-muted)/0.08)] p-4 sm:p-5">
              <p className="mb-3 text-[10px] font-display uppercase tracking-[0.16em] text-[hsl(var(--aegis-warm))]">
                {t("cartography.fileIntro")}
              </p>
              <ReportContentBlocks blocks={doc.intro} />
            </div>
          )}

          {doc.sections.map((section, i) => (
            <ReportSectionPanel
              key={section.id}
              section={section}
              index={i + 1}
              defaultOpen={i === 0}
              accentClass={cfg.border}
              collapsible={sectionCollapsible}
              variant={sectionVariant}
              open={sectionCollapsible ? openSections[section.id] : undefined}
              onOpenChange={
                sectionCollapsible
                  ? (v) => setOpenSections((prev) => ({ ...prev, [section.id]: v }))
                  : undefined
              }
            />
          ))}

          {/* Pager prev/next — navigation contextuelle entre sections */}
          {doc.sections.length > 1 && (() => {
            const idx = doc.sections.findIndex((s) => s.id === activeSection);
            const prev = idx > 0 ? doc.sections[idx - 1] : null;
            const next = idx >= 0 && idx < doc.sections.length - 1 ? doc.sections[idx + 1] : null;
            return (
              <div className="mt-6 grid gap-3 border-t border-border-subtle/25 pt-6 sm:grid-cols-2">
                {prev ? (
                  <button
                    type="button"
                    onClick={() => scrollToSection(prev.id)}
                    className="group flex items-center gap-3 rounded-xl border border-border-subtle/30 bg-white/[0.02] px-4 py-3 text-left transition-all hover:border-border-subtle/60 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronLeft size={18} strokeWidth={1.5} className={cn("shrink-0 transition-transform group-hover:-translate-x-0.5", cfg.accent)} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[9px] font-display uppercase tracking-[0.2em] text-text-tertiary">
                        {t("appendix.previous")}
                      </span>
                      <span className="mt-0.5 block truncate font-display text-xs text-text-secondary">
                        {extractNavLabel(prev.title, idx).label}
                      </span>
                    </span>
                  </button>
                ) : (
                  <span aria-hidden />
                )}
                {next ? (
                  <button
                    type="button"
                    onClick={() => scrollToSection(next.id)}
                    className="group flex items-center gap-3 rounded-xl border border-border-subtle/30 bg-white/[0.02] px-4 py-3 text-right transition-all hover:border-border-subtle/60 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-start-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[9px] font-display uppercase tracking-[0.2em] text-text-tertiary">
                        {t("appendix.next")}
                      </span>
                      <span className="mt-0.5 block truncate font-display text-xs text-text-secondary">
                        {extractNavLabel(next.title, idx + 2).label}
                      </span>
                    </span>
                    <ChevronRight size={18} strokeWidth={1.5} className={cn("shrink-0 transition-transform group-hover:translate-x-0.5", cfg.accent)} aria-hidden />
                  </button>
                ) : (
                  <span aria-hidden />
                )}
              </div>
            );
          })()}

          {doc.sections.length === 0 && doc.intro.length === 0 && (
            <p className="py-8 text-center text-sm text-text-tertiary">{t("cartography.fileEmpty")}</p>
          )}

          {doc.footer && (
            <p className="border-t border-border-subtle/25 pt-4 text-center text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
              {doc.footer}
            </p>
          )}
          </div>
        </div>
      </NeuralCard>
    </article>
  );
}

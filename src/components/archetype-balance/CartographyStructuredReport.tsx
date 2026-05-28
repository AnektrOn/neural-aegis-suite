import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ParsedCartographyDisplay } from "@/lib/cartography-markdown-parse";
import { BalanceHouseCard } from "./BalanceHouseCard";
import { BalanceGuardianCard } from "./BalanceGuardianCard";
import { ReportSectionPanel } from "./ReportSectionPanel";
import { CartographyFileView } from "./CartographyFileView";
import { DetailedReportCard } from "./DetailedReportCard";

interface CartographyStructuredReportProps {
  display: ParsedCartographyDisplay;
  activeTab: "cartographie" | "guardians" | "synthesis" | "detailed";
}

export function CartographyStructuredReport({
  display,
  activeTab,
}: CartographyStructuredReportProps) {
  const { t } = useLanguage();
  const { houses, guardians, synthesis, detailedReports } = display;

  if (activeTab === "cartographie" && houses.length > 0) {
    return <HousesTab houses={houses} />;
  }

  if (activeTab === "guardians" && guardians.length > 0) {
    return (
      <div className="mt-5 space-y-4">
        <SectionLabel text={t("balanceReport.guardiansTitle")} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 xl:gap-5">
          {guardians.map((g) => (
            <BalanceGuardianCard key={g.name} guardian={g} />
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "synthesis" && synthesis.length > 0) {
    return (
      <div className="mt-5 space-y-4">
        <SectionLabel text={t("cartography.synthesisIntro")} />
        {synthesis.map((section, i) => (
          <ReportSectionPanel key={section.id} section={section} index={i + 1} defaultOpen={i === 0} />
        ))}
      </div>
    );
  }

  if (activeTab === "detailed" && detailedReports.length > 0) {
    return (
      <div className="mt-5 space-y-4">
        <SectionLabel text={t("cartography.detailedIntro")} />
        {detailedReports.map((report, i) => (
          <DetailedReportCard key={report.id} report={report} defaultOpen={i === 0} />
        ))}
      </div>
    );
  }

  return null;
}

type FileKind = "cartographie" | "synthesis" | "detailed" | "guardians";

interface SectionRow {
  id: string;
  markdown: string;
  title: string | null;
  reportCode?: string;
}

function fileTabLabel(s: SectionRow): string {
  if (s.reportCode) {
    const m = s.reportCode.match(/p0?(\d)/i);
    if (m) return `P0${m[1]}`;
    return s.reportCode.toUpperCase();
  }
  if (s.title) {
    const short = s.title.replace(/^[^\w]*\s*/, "").slice(0, 18);
    return short.length < s.title.length ? `${short}…` : short;
  }
  return "Doc";
}

/** Affiche les fichiers importés — 1 onglet par fichier si plusieurs (P01…P05). */
export function CartographyFileList({
  sections,
  kind,
}: {
  sections: SectionRow[];
  kind: FileKind;
}) {
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  if (!sections.length) {
    return (
      <p className="mt-8 text-center text-sm text-text-tertiary">{t("cartography.fileNoImport")}</p>
    );
  }

  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  const multi = sections.length > 1;

  return (
    <div className="mt-5">
      {multi && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-display uppercase tracking-[0.16em] text-text-tertiary">
            {t("cartography.fileDocPicker", { count: sections.length })}
          </p>
          <nav
            className="flex gap-1 overflow-x-auto rounded-xl bg-white/[0.04] p-1"
            role="tablist"
            aria-label={t("cartography.fileDocNav")}
          >
            {sections.map((s) => {
              const selected = s.id === active.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  title={s.title ?? undefined}
                  onClick={() => setActiveId(s.id)}
                  className={cn(
                    "shrink-0 min-h-[44px] rounded-lg px-4 py-2 text-xs font-display uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "bg-[hsl(var(--aegis-s1))] text-text-primary shadow-sm"
                      : "text-text-tertiary hover:bg-white/[0.04]",
                  )}
                >
                  {fileTabLabel(s)}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      <CartographyFileView
        key={active.id}
        markdown={active.markdown}
        title={active.title}
        reportCode={active.reportCode}
        kind={kind}
      />
    </div>
  );
}

function HousesTab({ houses }: { houses: ParsedCartographyDisplay["houses"] }) {
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState(houses[0]?.id ?? 1);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = houses
      .map((h) => document.getElementById(`maison-${h.id}`))
      .filter(Boolean) as HTMLElement[];
    if (!elements.length) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        const top = visible[0]?.target.id;
        if (top) {
          const n = Number(top.replace("maison-", ""));
          if (!Number.isNaN(n)) setActiveId(n);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );

    for (const el of elements) observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [houses]);

  const scrollTo = (id: number) => {
    setActiveId(id);
    document.getElementById(`maison-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const houseNavButton = (h: (typeof houses)[number]) => (
    <button
      key={h.id}
      type="button"
      onClick={() => scrollTo(h.id)}
      className={cn(
        "flex min-h-[44px] flex-col items-center justify-center rounded-lg border px-2 py-1.5 text-[10px] uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "min-w-[3.25rem] lg:min-w-0 lg:w-full",
        activeId === h.id
          ? "border-[hsl(var(--aegis-warm)/0.45)] bg-[hsl(var(--aegis-warm-muted)/0.35)] text-text-primary"
          : "border-border-subtle/50 bg-white/[0.03] text-text-tertiary hover:bg-white/[0.06]",
      )}
      aria-current={activeId === h.id ? "true" : undefined}
    >
      <span className="text-base leading-none" aria-hidden>
        {h.sign}
      </span>
      <span>M{h.id}</span>
    </button>
  );

  return (
    <div className="mt-5 lg:grid lg:grid-cols-[minmax(11rem,13rem)_1fr] lg:items-start lg:gap-6 xl:gap-8">
      <div className="lg:sticky lg:top-[calc(var(--safe-top)+3.5rem)] lg:self-start">
        <SectionLabel text={t("balanceReport.housesTitle")} />
        <nav
          className="sticky top-[calc(var(--safe-top)+3.5rem)] z-10 -mx-1 mb-4 overflow-x-auto px-1 pb-2 lg:static lg:mx-0 lg:px-0 lg:pb-0"
          aria-label={t("balanceReport.houseNavAria")}
        >
          <div className="flex min-w-max gap-1.5 lg:grid lg:min-w-0 lg:grid-cols-2 lg:gap-1.5 xl:grid-cols-3">
            {houses.map(houseNavButton)}
          </div>
        </nav>
      </div>
      <div className="min-w-0 space-y-4">
        {houses.map((house, i) => (
          <BalanceHouseCard key={house.id} house={house} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Sparkles size={14} strokeWidth={1.5} className="text-text-tertiary" aria-hidden />
      <h2 className="text-xs font-display uppercase tracking-[0.2em] text-text-tertiary">{text}</h2>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ParsedCartographyDisplay } from "@/lib/cartography-markdown-parse";
import { BalanceHouseCard } from "./BalanceHouseCard";
import { BalanceGuardianCard } from "./BalanceGuardianCard";
import { ReportSectionAccordion } from "./ReportSectionAccordion";
import { DetailedReportCard } from "./DetailedReportCard";
import { CartographyMarkdownPanel } from "./CartographyMarkdownPanel";

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
        <div className="grid gap-4 sm:grid-cols-2">
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
          <ReportSectionAccordion key={section.id} section={section} defaultOpen={i === 0} />
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

  return (
    <div className="mt-5">
      <SectionLabel text={t("balanceReport.housesTitle")} />
      <nav
        className="sticky top-[calc(var(--safe-top)+3.5rem)] z-10 -mx-1 mb-4 overflow-x-auto px-1 pb-2"
        aria-label={t("balanceReport.houseNavAria")}
      >
        <div className="flex min-w-max gap-1.5">
          {houses.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => scrollTo(h.id)}
              className={cn(
                "flex min-h-[44px] min-w-[3.25rem] flex-col items-center justify-center rounded-lg border px-2 py-1.5 text-[10px] uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
          ))}
        </div>
      </nav>
      <div className="space-y-4">
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

/** Markdown brut si le parseur ne reconnaît pas la section */
export function CartographyMarkdownFallback({
  markdown,
  title,
}: {
  markdown: string;
  title?: string | null;
}) {
  return (
    <div className="mt-5">
      {title && (
        <h3 className="mb-4 font-display text-sm uppercase tracking-[0.1em] text-text-primary">
          {title}
        </h3>
      )}
      <CartographyMarkdownPanel markdown={markdown} />
    </div>
  );
}

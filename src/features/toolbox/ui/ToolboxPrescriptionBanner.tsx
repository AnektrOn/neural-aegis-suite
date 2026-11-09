import { createContext, useContext, useState, type ReactNode } from "react";
import { Compass, Sparkles, ShieldAlert, Scale, Users, Activity, Mic, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ToolboxExocortexOrgan,
  ToolboxPillar,
  ToolboxTier,
} from "@/lib/toolbox-content-type-definitions";

const PrescriptionBannerGuardContext = createContext<boolean>(false);

const ORGAN_LABELS: Record<ToolboxExocortexOrgan, { fr: string; en: string; icon: typeof Compass }> = {
  vortex_emergency: { fr: "Mode Vortex", en: "Vortex Mode", icon: ShieldAlert },
  decision_log: { fr: "Decision Log", en: "Decision Log", icon: Scale },
  people_board: { fr: "People Board", en: "People Board", icon: Users },
  daily_posture: { fr: "Posture Quotidienne", en: "Daily Posture", icon: Activity },
  voice_oracle: { fr: "Oracle Vocal", en: "Voice Oracle", icon: Mic },
};

const PILLAR_LABELS: Record<ToolboxPillar, { fr: string; en: string }> = {
  homeostasie_nerveuse: { fr: "Régulation Nerveuse", en: "Nervous Regulation" },
  conscience_interface: { fr: "Dépollution Cognitive", en: "Cognitive Clarity" },
  alchimie_archetypale: { fr: "Gouvernance Relationnelle", en: "Archetypal Governance" },
  gouvernance_souveraine: { fr: "Arbitrage Décisionnel", en: "Sovereign Arbitration" },
};

const TIER_LABELS: Record<ToolboxTier, { fr: string; en: string }> = {
  beginner: { fr: "Mode Débutant", en: "Beginner Mode" },
  initiate: { fr: "Mode Initié", en: "Initiate Mode" },
  sovereign: { fr: "Mode Souverain", en: "Sovereign Mode" },
};

function readStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
}

export function extractWhyThisForYou(
  config: Record<string, unknown> | null | undefined,
  locale: "fr" | "en" = "fr",
): string {
  if (!config || typeof config !== "object") return "";
  const i18n = config.why_this_for_you_i18n;
  if (i18n && typeof i18n === "object") {
    const o = i18n as Record<string, unknown>;
    const fr = typeof o.fr === "string" ? o.fr.trim() : "";
    const en = typeof o.en === "string" ? o.en.trim() : "";
    const picked = locale === "en" ? en || fr : fr || en;
    if (picked) return picked;
  }
  if (typeof config.why_this_for_you === "string") {
    return config.why_this_for_you.trim();
  }
  return "";
}

export interface ToolboxPrescriptionBannerProps {
  config?: Record<string, unknown> | null;
  locale?: "fr" | "en";
  archetypeTargets?: string[];
  shadowTargets?: string[];
  distributionMode?: string;
  className?: string;
}

export function ToolboxPrescriptionBanner({
  config,
  locale = "fr",
  archetypeTargets,
  shadowTargets,
  distributionMode,
  className,
}: ToolboxPrescriptionBannerProps) {
  const alreadyRenderedAbove = useContext(PrescriptionBannerGuardContext);
  if (alreadyRenderedAbove) return null;

  const cfg = config && typeof config === "object" ? config : {};
  const whyText = extractWhyThisForYou(cfg, locale);

  const organRaw = typeof cfg.exocortex_organ === "string" ? (cfg.exocortex_organ as ToolboxExocortexOrgan) : undefined;
  const organMeta = organRaw && organRaw in ORGAN_LABELS ? ORGAN_LABELS[organRaw] : undefined;

  const pillarRaw = typeof cfg.pillar === "string" ? (cfg.pillar as ToolboxPillar) : undefined;
  const pillarMeta = pillarRaw && pillarRaw in PILLAR_LABELS ? PILLAR_LABELS[pillarRaw] : undefined;

  const tierRaw = typeof cfg.tier === "string" ? (cfg.tier as ToolboxTier) : undefined;
  const tierMeta = tierRaw && tierRaw in TIER_LABELS ? TIER_LABELS[tierRaw] : undefined;

  const archetypes = archetypeTargets?.length ? archetypeTargets : readStringArray(cfg.archetype_targets);
  const shadows = shadowTargets?.length ? shadowTargets : readStringArray(cfg.shadow_targets);
  const mode = distributionMode || (typeof cfg.distribution_mode === "string" ? cfg.distribution_mode : undefined);
  const isIndividual =
    mode === "individual" ||
    Boolean(whyText) ||
    (typeof cfg.parent_template_key === "string" && cfg.parent_template_key.trim().length > 0);

  const hasBadges = Boolean(organMeta || pillarMeta || tierMeta || archetypes.length || shadows.length);

  if (!whyText && !isIndividual && !hasBadges) {
    return null;
  }

  const OrganIcon = organMeta?.icon ?? Compass;
  const isEn = locale === "en";
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      data-slot="toolbox-prescription-banner"
      className={cn(
        "w-full rounded-xl border px-3.5 py-2.5 text-left transition-colors",
        isIndividual
          ? "border-primary/25 bg-primary/[0.06]"
          : "border-border/30 bg-secondary/10",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {isIndividual ? (
            <Sparkles className="size-3.5 shrink-0 text-primary" />
          ) : (
            <OrganIcon className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/90">
            {whyText || isIndividual
              ? isEn
                ? "Why this protocol for you"
                : "Pourquoi ce protocole pour toi"
              : organMeta
                ? isEn
                  ? organMeta.en
                  : organMeta.fr
                : isEn
                  ? "Executive Protocol"
                  : "Protocole Exécutif"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {tierMeta ? (
            <span className="inline-flex items-center rounded-md border border-border/40 bg-background/50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              {isEn ? tierMeta.en : tierMeta.fr}
            </span>
          ) : null}
          {organMeta && (whyText || isIndividual) ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-primary">
              <OrganIcon className="size-2.5" />
              {isEn ? organMeta.en : organMeta.fr}
            </span>
          ) : null}
          {pillarMeta ? (
            <span className="inline-flex items-center rounded-md border border-border/30 bg-secondary/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
              {isEn ? pillarMeta.en : pillarMeta.fr}
            </span>
          ) : null}
          {archetypes.map((arch) => (
            <span
              key={`arch-${arch}`}
              className="inline-flex items-center rounded-md border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-300/90"
            >
              {arch}
            </span>
          ))}
          {shadows.map((sh) => (
            <span
              key={`shadow-${sh}`}
              className="inline-flex items-center rounded-md border border-purple-400/25 bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-purple-300/90"
            >
              {sh.replace(/_/g, " ")}
            </span>
          ))}
          {whyText ? (
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="ml-1 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
              aria-expanded={!collapsed}
            >
              {collapsed ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
            </button>
          ) : null}
        </div>
      </div>

      {whyText && !collapsed ? (
        <p className="mt-1.5 text-xs leading-relaxed text-foreground/85">{whyText}</p>
      ) : null}
    </div>
  );
}

export function ToolboxPrescriptionBannerScope({
  config,
  locale = "fr",
  children,
}: {
  config?: Record<string, unknown> | null;
  locale?: "fr" | "en";
  children: ReactNode;
}) {
  return (
    <PrescriptionBannerGuardContext.Provider value={true}>
      <div className="w-full space-y-3">
        <ToolboxPrescriptionBanner config={config} locale={locale} />
        {children}
      </div>
    </PrescriptionBannerGuardContext.Provider>
  );
}

import { Sparkles, TreePine } from "lucide-react";
import type { SampleProfile } from "@/features/archetype-deepdive-v2/domain/sampleProfile";
import type { TaoPersonaSummary } from "@/features/tao-portrait/lib/buildTaoPersonaSummary";
import { taoDeepDiveHref } from "@/features/tao-portrait/lib/buildTaoPersonaSummary";
import { WU_XING_META } from "@/features/tao-portrait/domain/types";
import { parseProfileLabel } from "./parseProfileLabel";
import { themeFor } from "./archetypeTheme";
import type { PortraitLensCard } from "./portraitLensTypes";

function humanizeToken(value: string): string {
  return value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildPortraitLenses(input: {
  profile: SampleProfile | null;
  taoSummary: TaoPersonaSummary | null;
  glimpseLine: string;
  dominantColor: string;
}): PortraitLensCard[] {
  const lenses: PortraitLensCard[] = [];

  if (input.profile) {
    const { classTitle } = parseProfileLabel(input.profile.label);
    const dominant = input.profile.narrative.archetypeBlocks[0];
    const color = dominant ? themeFor(dominant.archetype).color : input.dominantColor;

    lenses.push({
      id: "myss",
      frameworkKey: "persona.lens.myss.framework",
      systemKey: "persona.lens.myss.system",
      status: "ready",
      title: classTitle,
      excerpt: input.glimpseLine,
      eyebrow: input.profile.subtitle ?? null,
      accentColor: color,
      icon: Sparkles,
      detailKind: "myss",
      actions: [
        {
          labelKey: "persona.lens.myss.cta",
          href: "/deep-dive?lens=myss",
          variant: "primary",
        },
      ],
    });
  }

  const tao = input.taoSummary;
  const taoStatus = tao?.hasContent
    ? tao.t2Available
      ? "ready"
      : "partial"
    : "empty";

  const showT2 = Boolean(tao?.t2Available);
  const taoTitle = showT2
    ? tao?.t2Title
    : tao?.fallbackTitle ?? null;
  const taoExcerpt = showT2
    ? tao?.t2Excerpt ?? tao?.t2Lead
    : tao?.fallbackLead;
  const taoEyebrow =
    showT2 && (tao?.t2Stade || tao?.t2Domaine)
      ? [tao.t2Stade, tao.t2Domaine].filter(Boolean).map(humanizeToken).join(" · ")
      : null;

  const taoActions: PortraitLensCard["actions"] = [];
  if (showT2) {
    taoActions.push({
      labelKey: "persona.glimpse.ctaTaoT2",
      href: taoDeepDiveHref({ view: "t2" }),
      variant: "primary",
    });
  }
  taoActions.push({
    labelKey: showT2 ? "persona.glimpse.ctaTaoPoles" : "persona.glimpse.ctaTaoDeepDive",
    href: taoDeepDiveHref(),
    variant: showT2 ? "outline" : "primary",
  });

  const taoAccent =
    tao?.primaryPole && tao.primaryPole !== "transversal"
      ? WU_XING_META[tao.primaryPole].color
      : "#4a7c59";

  lenses.push({
    id: "tao",
    frameworkKey: "persona.lens.tao.framework",
    systemKey: "persona.lens.tao.system",
    status: taoStatus,
    title: taoTitle,
    excerpt: taoExcerpt ?? null,
    eyebrow: taoEyebrow,
    accentColor: taoAccent,
    icon: TreePine,
    mark: showT2 ? tao?.t2Glyphe ?? undefined : undefined,
    progressFilled: tao?.totalFilled,
    progressTotal: tao?.totalSections,
    detailKind: "tao",
    actions: taoActions,
  });

  return lenses;
}

export function defaultPortraitLensId(lenses: PortraitLensCard[]): string {
  const ready = lenses.find((l) => l.status === "ready");
  if (ready) return ready.id;
  const partial = lenses.find((l) => l.status === "partial");
  if (partial) return partial.id;
  return lenses[0]?.id ?? "myss";
}

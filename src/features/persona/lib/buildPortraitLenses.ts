import type { SampleProfile } from "@/features/archetype-deepdive-v2/domain/sampleProfile";
import type { TaoPersonaSummary } from "@/features/tao-portrait/lib/buildTaoPersonaSummary";
import { taoDeepDiveHref } from "@/features/tao-portrait/lib/buildTaoPersonaSummary";
import { WU_XING_META } from "@/features/tao-portrait/domain/types";
import { parseProfileLabel } from "./parseProfileLabel";
import { themeFor } from "./archetypeTheme";
import type { PortraitLensCard } from "./portraitLensTypes";
import { lensStatusFromCompletion, type LensCompletionMap } from "./loadLensCompletion";
import {
  PORTRAIT_LENS_REGISTRY,
  PORTRAIT_LENS_SHELF_ORDER,
  type PortraitLensRegistryId,
} from "./portraitLensRegistry";

function humanizeToken(value: string): string {
  return value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildPortraitLenses(input: {
  profile: SampleProfile | null;
  taoSummary: TaoPersonaSummary | null;
  glimpseLine: string;
  dominantColor: string;
  completions?: LensCompletionMap;
}): PortraitLensCard[] {
  const lenses: PortraitLensCard[] = [];
  const completions = input.completions ?? {};
  const myssCompletion = completions.myss;

  if (input.profile) {
    const { classTitle } = parseProfileLabel(input.profile.label);
    const dominant = input.profile.narrative.archetypeBlocks[0];
    const color = dominant ? themeFor(dominant.archetype).color : input.dominantColor;
    const reg = PORTRAIT_LENS_REGISTRY.find((e) => e.id === "myss")!;

    lenses.push({
      id: "myss",
      frameworkKey: reg.frameworkKey,
      systemKey: reg.systemKey,
      status: "ready",
      title: classTitle,
      excerpt: input.glimpseLine,
      eyebrow: input.profile.subtitle ?? null,
      accentColor: color,
      icon: reg.icon,
      detailKind: "myss",
      coverArtUrl: reg.coverArtUrl,
      progressFilled: myssCompletion?.answered,
      progressTotal: myssCompletion?.total,
      actions: [
        {
          labelKey: reg.ctaOpenKey,
          href: reg.routeReady,
          variant: "primary",
        },
      ],
    });
  } else {
    const reg = PORTRAIT_LENS_REGISTRY.find((e) => e.id === "myss")!;
    const status = lensStatusFromCompletion(myssCompletion, {});
    lenses.push({
      id: "myss",
      frameworkKey: reg.frameworkKey,
      systemKey: reg.systemKey,
      status,
      title: null,
      excerpt: null,
      eyebrow: null,
      accentColor: reg.accentColor,
      icon: reg.icon,
      detailKind: "myss",
      coverArtUrl: reg.coverArtUrl,
      progressFilled: myssCompletion?.answered,
      progressTotal: myssCompletion?.total,
      emptyDetailKey: reg.emptyDetailKey,
      actions: [
        {
          labelKey: status === "ready" ? reg.ctaOpenKey : reg.ctaStartKey,
          href: status === "ready" ? reg.routeReady : reg.routeStart,
          variant: "primary",
        },
      ],
    });
  }

  const tao = input.taoSummary;
  const taoReg = PORTRAIT_LENS_REGISTRY.find((e) => e.id === "tao")!;
  const taoStatus = tao?.hasContent
    ? tao.t2Available
      ? "ready"
      : "partial"
    : lensStatusFromCompletion(completions.tao, {});

  const showT2 = Boolean(tao?.t2Available);
  const taoTitle = showT2 ? tao?.t2Title : tao?.fallbackTitle ?? null;
  const taoExcerpt = showT2 ? tao?.t2Excerpt ?? tao?.t2Lead : tao?.fallbackLead;
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
  if (taoStatus === "empty") {
    taoActions.length = 0;
    taoActions.push({
      labelKey: taoReg.ctaStartKey,
      href: taoReg.routeStart,
      variant: "primary",
    });
  }

  const taoAccent =
    tao?.primaryPole && tao.primaryPole !== "transversal"
      ? WU_XING_META[tao.primaryPole].color
      : taoReg.accentColor;

  lenses.push({
    id: "tao",
    frameworkKey: taoReg.frameworkKey,
    systemKey: taoReg.systemKey,
    status: taoStatus,
    title: taoTitle,
    excerpt: taoExcerpt ?? null,
    eyebrow: taoEyebrow,
    accentColor: taoAccent,
    icon: taoReg.icon,
    mark: showT2 ? tao?.t2Glyphe ?? undefined : undefined,
    progressFilled: tao?.totalFilled ?? completions.tao?.answered,
    progressTotal: tao?.totalSections ?? completions.tao?.total,
    detailKind: "tao",
    emptyDetailKey: taoReg.emptyDetailKey,
    comingSoon: false,
    coverArtUrl: taoReg.coverArtUrl,
    actions: taoActions,
  });

  const futureIds: PortraitLensRegistryId[] = ["jung", "blavatsky", "manly_hall"];
  for (const id of futureIds) {
    const reg = PORTRAIT_LENS_REGISTRY.find((e) => e.id === id)!;
    const comp = completions[id];
    const status = reg.comingSoon
      ? "empty"
      : lensStatusFromCompletion(comp, { comingSoon: reg.comingSoon });
    const canOpen = status === "ready";

    lenses.push({
      id,
      frameworkKey: reg.frameworkKey,
      systemKey: reg.systemKey,
      status,
      title: null,
      excerpt: null,
      eyebrow: reg.comingSoon ? null : null,
      accentColor: reg.accentColor,
      icon: reg.icon,
      progressFilled: comp?.answered,
      progressTotal: comp?.total && comp.total > 0 ? comp.total : undefined,
      detailKind: reg.detailKind,
      emptyDetailKey: reg.emptyDetailKey,
      comingSoon: reg.comingSoon,
      locked: status === "empty" && !reg.comingSoon,
      coverArtUrl: reg.coverArtUrl,
      actions: reg.comingSoon
        ? []
        : [
            {
              labelKey: canOpen ? reg.ctaOpenKey : reg.ctaStartKey,
              href: canOpen ? reg.routeReady : reg.routeStart,
              variant: "primary",
            },
          ],
    });
  }

  const byId = new Map(lenses.map((l) => [l.id, l]));
  return PORTRAIT_LENS_SHELF_ORDER.map((id) => byId.get(id)).filter(
    (l): l is PortraitLensCard => l != null,
  );
}

export function defaultPortraitLensId(lenses: PortraitLensCard[]): string {
  const ready = lenses.find((l) => l.status === "ready");
  if (ready) return ready.id;
  const partial = lenses.find((l) => l.status === "partial");
  if (partial) return partial.id;
  return lenses[0]?.id ?? "myss";
}

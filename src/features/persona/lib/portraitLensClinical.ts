import type { PortraitLensRegistryId } from "./portraitLensRegistry";
import type { UserReport } from "@/features/user-reports/types";

const LENS_PRISM_ALIASES: Record<PortraitLensRegistryId, string[]> = {
  myss: ["MYSS"],
  tao: ["TAO", "WUXIN", "WU_XING"],
  jung: ["JUNG"],
  blavatsky: ["BLAVATSKY", "BLAV"],
  manly_hall: ["HALL", "MANLY_HALL", "MANLY"],
};

function normalizePrism(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
}

export function findClinicalReportForLens(
  reports: UserReport[],
  lensId: string,
): UserReport | null {
  const aliases = LENS_PRISM_ALIASES[lensId as PortraitLensRegistryId];
  if (!aliases?.length) return null;

  const aliasSet = new Set(aliases.map(normalizePrism));

  for (const report of reports) {
    const prism = normalizePrism(report.prism_code || report.orientation);
    if (prism && aliasSet.has(prism)) return report;
    const tagHit = (report.tags ?? []).some((tag) => aliasSet.has(normalizePrism(tag)));
    if (tagHit) return report;
  }

  if (lensId === "myss" && reports.length === 1) {
    return reports[0];
  }

  return null;
}
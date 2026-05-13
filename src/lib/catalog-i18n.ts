import type { Locale } from "@/i18n/translations";
import { pickLocalizedText } from "@/lib/content-i18n";

function norm(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

/**
 * Known FR catalogue titles → EN display when `title_i18n.en` is missing or equals FR (legacy imports).
 * Extend this map when new seeded templates ship with FR-only titles.
 */
const CATALOG_TITLE_EN_BY_FR: Record<string, string> = {
  "Posture de Redéploiement": "Redeployment posture",
  "Focus sur l'Objet Unique": "Focus on the single object",
  "S.T.O.P. Saturation": "S.T.O.P. saturation",
  "Intention de Micro-Cycle": "Micro-cycle intention",
};

type CatalogTitleRow = {
  title?: string | null;
  name?: string | null;
  title_i18n?: unknown;
  name_i18n?: unknown;
};

/**
 * Display title for catalogue rows (toolbox_templates, journal_prompt_templates, habit_templates)
 * using `title`/`title_i18n` or `name`/`name_i18n`.
 */
export function pickCatalogTemplateDisplayTitle(
  locale: Locale,
  row: CatalogTitleRow,
  legacyField: "title" | "name" = "title"
): string {
  const legacy = String((legacyField === "name" ? row.name : row.title) ?? "").trim();
  const i18n = legacyField === "name" ? row.name_i18n : row.title_i18n;
  const fr = pickLocalizedText("fr", i18n as any, legacy);
  const en = pickLocalizedText("en", i18n as any, legacy);

  if (locale === "fr") return fr || legacy;

  if (en && en !== fr) return en;

  const mapped =
    CATALOG_TITLE_EN_BY_FR[norm(fr)] ?? CATALOG_TITLE_EN_BY_FR[norm(legacy)];

  return mapped ?? en ?? fr ?? legacy;
}

/**
 * Short description line for toolbox templates (optional).
 */
export function pickCatalogTemplateDescription(
  locale: Locale,
  row: { description?: string | null; description_i18n?: unknown }
): string {
  return pickLocalizedText(locale, row.description_i18n as any, row.description ?? null);
}

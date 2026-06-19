import type { Locale } from "@/i18n/translations";
import { pickLocalizedText } from "@/lib/content-i18n";
import {
  lookupCatalogFrToEn,
  normalizeCatalogFrKey,
  pickWidgetCatalogCopy,
} from "@/lib/toolbox-widget-i18n";

function catalogTitleKey(s: string) {
  return normalizeCatalogFrKey(s);
}

/**
 * Known FR catalogue titles → EN display when `title_i18n.en` is missing or equals FR (legacy imports).
 * Extend this map when new seeded templates ship with FR-only titles.
 */
const CATALOG_TITLE_EN_BY_FR: Record<string, string> = {
  "L'Ancrage de Volonté": "The Will Anchor",
  "Ancrage de l'Identité de Décision": "Decision Identity Anchor",
  "Le Shift Spinal": "The Spinal Shift",
  "Scan de Tension Résiduelle": "Residual Tension Scan",
  "La Cadence de Résonance (0,10 Hz)": "Resonance Cadence (0.10 Hz)",
  "Le Souffle du Sternum": "The Sternum Breath",
  "Respiration Carrée (Box Breathing)": "Box Breathing",
  "Le Switch Divergent": "The Divergent Switch",
  "La Retraite du Point Statique": "The Static Point Retreat",
  "Focus sur l'Objet Unique": "Single Object Focus",
  "Gratitude Stratégique": "Strategic Gratitude",
  "Intention de Micro-Cycle": "Micro-cycle Intention",
  "La Réallocation Stratégique": "Strategic Reallocation",
  "Le Reset Vagal Oculaire": "Ocular Vagal Reset",
  "Posture de Redéploiement": "Redeployment Posture",
  "Le Verrou d'Isolation": "The Isolation Lock",
  "Le Bouclier IgA": "The IgA Shield",
  "S.T.O.P. Saturation": "S.T.O.P. saturation",
  "S.T.O.P. Profond : L'Ancrage du Sanctuaire (Respect de Soi)":
    "Deep S.T.O.P.: Sanctuary Anchoring (Self-Respect)",
  "Le Flash de Pré-Accomplissement": "Pre-Accomplishment Flash",
  "Le Flux Syntropique": "The Syntropic Flow",
  Affirmations: "Affirmations",
  "Body scan": "Body Scan",
  "Breathwork 1 cycles": "Breathwork — 1 cycle",
  "Breathwork 4 cycles": "Breathwork — 4 cycles",
  "Check-in de gratitude": "Gratitude Check-in",
  "Gratitude Check-in": "Gratitude Check-in",
  "Invite de journal": "Journal Prompt",
  "Journal Prompt": "Journal Prompt",
};

/**
 * Résout un titre catalogue FR → EN connu (hors contenu widget).
 */
export function resolveToolboxTitleEnglish(frTitle: string): string | undefined {
  return CATALOG_TITLE_EN_BY_FR[catalogTitleKey(frTitle)];
}

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

  const frKey = catalogTitleKey(fr || legacy);
  const enKey = catalogTitleKey(en);
  const mapped =
    CATALOG_TITLE_EN_BY_FR[frKey] ??
    CATALOG_TITLE_EN_BY_FR[catalogTitleKey(legacy)] ??
    lookupCatalogFrToEn(fr) ??
    lookupCatalogFrToEn(legacy);

  if (mapped) return mapped;

  if (en && enKey !== frKey) return en;

  return en ?? fr ?? legacy;
}

/**
 * Short description line for toolbox templates (optional).
 */
export function pickCatalogTemplateDescription(
  locale: Locale,
  row: { description?: string | null; description_i18n?: unknown }
): string {
  return pickWidgetCatalogCopy(locale, row.description_i18n as Partial<Record<Locale, string>> | null, row.description ?? null);
}

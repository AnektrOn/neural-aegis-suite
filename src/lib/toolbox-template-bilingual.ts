import { bilingualPair } from "@/lib/content-i18n";
import { resolveToolboxTitleEnglish } from "@/lib/catalog-i18n";
import { lookupCatalogFrToEn } from "@/lib/toolbox-widget-i18n";

/**
 * Corrige les paires { fr, en } où `mergeI18nObject` a recopié le français dans les deux champs.
 * Complète `en` via les maps catalogue (titre + textes widget) quand c’est possible.
 */
export function dedupeToolboxTextI18n(
  pair: Record<string, string>,
  resolveEnFromFr: (fr: string) => string | undefined
): Record<string, string> {
  const fr = String(pair.fr ?? "").trim();
  let en = String(pair.en ?? "").trim();
  if (!fr) return pair;
  if (!en || en === fr) {
    const resolved = resolveEnFromFr(fr);
    if (resolved && resolved !== fr) return bilingualPair(fr, resolved);
  }
  return pair;
}

export function finalizeToolboxTemplateI18nChunks(
  titleI18nMerged: Record<string, string>,
  descriptionI18nMerged: Record<string, string>
): { title_i18n: Record<string, string>; description_i18n: Record<string, string> } {
  return {
    title_i18n: dedupeToolboxTextI18n(titleI18nMerged, (fr) => resolveToolboxTitleEnglish(fr) ?? lookupCatalogFrToEn(fr)),
    description_i18n: dedupeToolboxTextI18n(descriptionI18nMerged, (fr) => lookupCatalogFrToEn(fr)),
  };
}

export function assertToolboxTitleEnglishDistinct(titleI18n: Record<string, string>, titleLegacy: string): void {
  const fr = String(titleI18n.fr ?? titleLegacy ?? "").trim();
  const en = String(titleI18n.en ?? "").trim();
  if (!fr) return;
  if (!en || en === fr) {
    throw new Error(
      `Titre sans anglais distinct (fr="${fr.slice(0, 80)}${fr.length > 80 ? "…" : ""}"). ` +
        `Ajoutez title_en / title_i18n.en dans l’import, ou complétez resolveToolboxTitleEnglish / lookupCatalogFrToEn.`
    );
  }
}

/** Si une description est fournie, exige une variante EN distincte après normalisation. */
export function assertToolboxDescriptionEnglishIfPresent(
  descriptionI18n: Record<string, string>,
  descriptionLegacy: string | null | undefined
): void {
  const fr = String(descriptionI18n.fr ?? descriptionLegacy ?? "").trim();
  if (!fr) return;
  const en = String(descriptionI18n.en ?? "").trim();
  if (!en || en === fr) {
    throw new Error(
      "Description sans anglais distinct. Ajoutez description_en / description_i18n.en, ou une entrée dans lookupCatalogFrToEn pour ce texte."
    );
  }
}

import { bilingualPair } from "@/lib/content-i18n";
import { lookupCatalogFrToEn } from "@/lib/toolbox-widget-i18n";

function readI18n(v: unknown): { fr: string; en: string } {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  return {
    fr: typeof o.fr === "string" ? o.fr.trim() : "",
    en: typeof o.en === "string" ? o.en.trim() : "",
  };
}

function cloneConfig(c: Record<string, unknown>): Record<string, unknown> {
  return typeof structuredClone === "function"
    ? structuredClone(c)
    : (JSON.parse(JSON.stringify(c)) as Record<string, unknown>);
}

type AffirmationLine = { fr: string; en: string };

function parseAffirmationEntry(
  raw: unknown,
  i18nSlot?: { fr?: string; en?: string },
): AffirmationLine | null {
  let fr = "";
  let en = "";

  if (typeof raw === "string") {
    fr = raw.trim();
  } else if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    fr = String(o.fr ?? o.text ?? o.label ?? "").trim();
    en = String(o.en ?? "").trim();
  }

  if (i18nSlot?.fr?.trim()) fr = i18nSlot.fr.trim();
  if (i18nSlot?.en?.trim()) en = i18nSlot.en.trim();

  if (!fr) return null;
  return { fr, en };
}

function i18nSlotAtIndex(rawI18n: unknown, index: number): { fr?: string; en?: string } | undefined {
  if (Array.isArray(rawI18n)) {
    const item = rawI18n[index];
    if (!item || typeof item !== "object") return undefined;
    const o = item as Record<string, unknown>;
    return {
      fr: typeof o.fr === "string" ? o.fr : undefined,
      en: typeof o.en === "string" ? o.en : undefined,
    };
  }
  if (rawI18n && typeof rawI18n === "object") {
    const ai = rawI18n as { fr?: unknown[]; en?: unknown[] };
    const frVal = Array.isArray(ai.fr) ? ai.fr[index] : undefined;
    const enVal = Array.isArray(ai.en) ? ai.en[index] : undefined;
    return {
      fr: frVal != null ? String(frVal) : undefined,
      en: enVal != null ? String(enVal) : undefined,
    };
  }
  return undefined;
}

function collectAffirmationLines(out: Record<string, unknown>): AffirmationLine[] {
  const rawI18n = out.affirmations_i18n;
  const raw = Array.isArray(out.affirmations) ? (out.affirmations as unknown[]) : [];
  const lines: AffirmationLine[] = [];

  if (raw.length > 0) {
    raw.forEach((item, i) => {
      const parsed = parseAffirmationEntry(item, i18nSlotAtIndex(rawI18n, i));
      if (parsed) lines.push(parsed);
    });
    return lines;
  }

  if (Array.isArray(rawI18n) && rawI18n.length > 0) {
    rawI18n.forEach((item) => {
      const parsed = parseAffirmationEntry(item);
      if (parsed) lines.push(parsed);
    });
    return lines;
  }

  if (rawI18n && typeof rawI18n === "object" && !Array.isArray(rawI18n)) {
    const ai = rawI18n as { fr?: unknown[]; en?: unknown[] };
    const frFromI18n = Array.isArray(ai.fr)
      ? ai.fr.map((x) => String(x).trim()).filter(Boolean)
      : [];
    const enFromI18n = Array.isArray(ai.en) ? ai.en.map((x) => String(x).trim()) : [];
    frFromI18n.forEach((fr, i) => {
      lines.push({ fr, en: enFromI18n[i] ?? "" });
    });
  }

  return lines;
}

function hydrateAffirmationsWidgetConfig(
  out: Record<string, unknown>,
  unresolved: string[],
): void {
  const entries = collectAffirmationLines(out);
  if (!entries.length) return;

  const baseFr: string[] = [];
  const builtEn: string[] = [];
  let affirmOk = true;

  for (let i = 0; i < entries.length; i++) {
    const { fr, en } = entries[i];
    baseFr.push(fr);
    if (en && en !== fr) {
      builtEn.push(en);
      continue;
    }
    const mapped = lookupCatalogFrToEn(fr);
    if (!mapped) {
      unresolved.push(`widget_config.affirmations[${i}]`);
      affirmOk = false;
      builtEn.push("");
    } else {
      builtEn.push(mapped);
    }
  }

  if (affirmOk) {
    out.affirmations = baseFr;
    out.affirmations_i18n = { fr: baseFr, en: builtEn };
  }
}

/**
 * Complète les champs `*_i18n` du widget_config à partir des chaînes FR / legacy
 * et du dictionnaire `lookupCatalogFrToEn` (aligné sur le runtime UI).
 *
 * Les chemins encore sans traduction EN connue sont listés dans `unresolvedPaths`
 * (validation import / erreur à la création).
 */
export function hydrateToolboxWidgetConfigForPersistence(
  contentType: string,
  widgetConfig: Record<string, unknown> | null | undefined
): { widget_config: Record<string, unknown>; unresolvedPaths: string[] } {
  const unresolved: string[] = [];
  const out: Record<string, unknown> =
    widgetConfig && typeof widgetConfig === "object" ? cloneConfig(widgetConfig) : {};

  const mergeOn = (
    path: string,
    target: Record<string, unknown>,
    legacyKey: string,
    i18nKey: string
  ) => {
    const rawLegacy = target[legacyKey];
    const leg = typeof rawLegacy === "string" ? rawLegacy.trim() : "";
    const { fr: frI, en: enI } = readI18n(target[i18nKey]);
    const fr = frI || leg;
    if (!fr) return;
    if (enI) {
      target[i18nKey] = bilingualPair(fr, enI);
      return;
    }
    const mapped = lookupCatalogFrToEn(fr);
    if (mapped) {
      target[i18nKey] = bilingualPair(fr, mapped);
      return;
    }
    unresolved.push(path);
  };

  switch (contentType) {
    case "focus_introspectif":
      mergeOn("widget_config.intention_i18n", out, "intention", "intention_i18n");
      break;

    case "intention": {
      mergeOn("widget_config.question_i18n", out, "question", "question_i18n");
      const allowNote = out.allow_note !== false;
      if (allowNote && (typeof out.note_prompt === "string" || out.note_prompt_i18n)) {
        mergeOn("widget_config.note_prompt_i18n", out, "note_prompt", "note_prompt_i18n");
      }
      break;
    }

    case "micro_practice":
      mergeOn("widget_config.instructions_i18n", out, "instructions", "instructions_i18n");
      if (Array.isArray(out.steps)) {
        (out.steps as unknown[]).forEach((step, i) => {
          if (!step || typeof step !== "object") return;
          const s = step as Record<string, unknown>;
          mergeOn(`widget_config.steps[${i}].text_i18n`, s, "text", "text_i18n");
        });
      }
      break;

    case "visualization":
      if (Array.isArray(out.scenes)) {
        (out.scenes as unknown[]).forEach((sc, i) => {
          if (!sc || typeof sc !== "object") return;
          const s = sc as Record<string, unknown>;
          mergeOn(`widget_config.scenes[${i}].label_i18n`, s, "label", "label_i18n");
          mergeOn(`widget_config.scenes[${i}].instruction_i18n`, s, "instruction", "instruction_i18n");
        });
      }
      break;

    case "body_scan":
      if (Array.isArray(out.zones)) {
        (out.zones as unknown[]).forEach((z, i) => {
          if (!z || typeof z !== "object") return;
          const zn = z as Record<string, unknown>;
          mergeOn(`widget_config.zones[${i}].label_i18n`, zn, "label", "label_i18n");
          mergeOn(`widget_config.zones[${i}].instruction_i18n`, zn, "instruction", "instruction_i18n");
        });
      }
      break;

    case "affirmations":
      hydrateAffirmationsWidgetConfig(out, unresolved);
      break;

    case "journal_prompt":
      mergeOn("widget_config.prompt_i18n", out, "prompt", "prompt_i18n");
      break;

    case "stop_protocol":
      if (Array.isArray(out.steps)) {
        (out.steps as unknown[]).forEach((st, i) => {
          if (!st || typeof st !== "object") return;
          const s = st as Record<string, unknown>;
          if ("title" in s || "title_i18n" in s) {
            mergeOn(`widget_config.steps[${i}].title_i18n`, s, "title", "title_i18n");
          }
          if ("hint" in s || "hint_i18n" in s) {
            mergeOn(`widget_config.steps[${i}].hint_i18n`, s, "hint", "hint_i18n");
          }
        });
      }
      break;

    default:
      break;
  }

  return { widget_config: out, unresolvedPaths: unresolved };
}

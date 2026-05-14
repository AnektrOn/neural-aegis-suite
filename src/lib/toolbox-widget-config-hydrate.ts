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

    case "affirmations": {
      const ai = out.affirmations_i18n as { fr?: unknown[]; en?: unknown[] } | undefined;
      const frFromI18n = Array.isArray(ai?.fr) ? ai!.fr!.map((x) => String(x).trim()).filter(Boolean) : [];
      const enFromI18n = Array.isArray(ai?.en) ? ai!.en!.map((x) => String(x).trim()) : [];
      const legacyLines = Array.isArray(out.affirmations)
        ? (out.affirmations as unknown[]).map((x) => String(x).trim()).filter(Boolean)
        : [];
      const baseFr = frFromI18n.length ? frFromI18n : legacyLines;
      if (!baseFr.length) break;

      if (
        enFromI18n.length === baseFr.length &&
        enFromI18n.every((e, idx) => e.length > 0 && e !== baseFr[idx])
      ) {
        out.affirmations_i18n = { fr: baseFr, en: enFromI18n };
        break;
      }

      const builtEn: string[] = [];
      let affirmOk = true;
      for (let i = 0; i < baseFr.length; i++) {
        const line = baseFr[i];
        const m = lookupCatalogFrToEn(line);
        if (!m) {
          unresolved.push(`widget_config.affirmations[${i}]`);
          affirmOk = false;
        }
        builtEn.push(m ?? "");
      }
      if (affirmOk) out.affirmations_i18n = { fr: baseFr, en: builtEn };
      break;
    }

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

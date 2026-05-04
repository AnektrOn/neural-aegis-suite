/**
 * Builds a Markdown document of unified Deep Dive scores for admin export.
 * Pure function — no I/O.
 */
import type { Locale } from "@/i18n/translations";
import type { DeepDiveResult } from "./computeDeepDiveScores";
import { archLabel } from "./narrativeContent";
import type { AnyArchetypeKey } from "./types";

const T = {
  title: { fr: "Scores Deep Dive (unifié)", en: "Deep Dive scores (unified)" },
  metaUser: { fr: "Utilisateur", en: "User" },
  metaId: { fr: "Identifiant", en: "User ID" },
  metaGenerated: { fr: "Calculé le", en: "Computed at" },
  metaResultAt: { fr: "Horodatage résultat", en: "Result timestamp" },
  completion: { fr: "Complétion", en: "Completion" },
  topThree: { fr: "Top 3 archétypes", en: "Top 3 archetypes" },
  shadowAlerts: { fr: "Alertes ombre (shadow > light)", en: "Shadow alerts (shadow > light)" },
  none: { fr: "—", en: "—" },
  archetypesSection: { fr: "Archétypes (tous, tri par poids total)", en: "Archetypes (all, sorted by total weight)" },
  rank: { fr: "Rang", en: "Rank" },
  archetype: { fr: "Archétype", en: "Archetype" },
  light: { fr: "Lumière", en: "Light" },
  shadow: { fr: "Ombre", en: "Shadow" },
  net: { fr: "Net", en: "Net" },
  intensity: { fr: "Intensité %", en: "Intensity %" },
  lightPct: { fr: "Part lumière %", en: "Light share %" },
  shadowPct: { fr: "Part ombre %", en: "Shadow share %" },
  housesSection: { fr: "Maisons", en: "Houses" },
  house: { fr: "Maison", en: "House" },
  answered: { fr: "Répondues", en: "Answered" },
  total: { fr: "Total", en: "Total" },
  topInHouse: { fr: "Archétype dominant (maison)", en: "Top archetype (house)" },
  breakdown: { fr: "Répartition", en: "Breakdown" },
} as const;

function tr(locale: Locale, key: keyof typeof T): string {
  return T[key][locale];
}

function escCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function buildDeepDiveScoresMarkdown(opts: {
  userId: string;
  displayName: string | null;
  result: DeepDiveResult;
  locale: Locale;
}): string {
  const { userId, displayName, result, locale } = opts;
  const L = (k: keyof typeof T) => tr(locale, k);
  const label = (arch: AnyArchetypeKey | string) => archLabel(arch as AnyArchetypeKey, locale);

  const lines: string[] = [];
  lines.push(`# ${L("title")}`);
  lines.push("");
  lines.push(`- **${L("metaUser")}:** ${escCell(displayName ?? userId)}`);
  lines.push(`- **${L("metaId")}:** \`${userId}\``);
  lines.push(`- **${L("metaGenerated")}:** ${new Date().toISOString()}`);
  lines.push(`- **${L("metaResultAt")}:** \`${result.computedAt}\``);
  const answeredBit =
    locale === "fr"
      ? `${result.answeredCount}/${result.totalQuestions} réponses`
      : `${result.answeredCount}/${result.totalQuestions} answers`;
  lines.push(
    `- **${L("completion")}:** ${answeredBit} (${Math.round(result.completionPct)}%)`,
  );
  lines.push("");

  lines.push(`## ${L("topThree")}`);
  lines.push("");
  if (result.topThree.length === 0) {
    lines.push(L("none"));
  } else {
    result.topThree.forEach((k, i) => {
      lines.push(`${i + 1}. ${label(k)} (\`${k}\`)`);
    });
  }
  lines.push("");

  lines.push(`## ${L("shadowAlerts")}`);
  lines.push("");
  if (result.shadowAlerts.length === 0) {
    lines.push(L("none"));
  } else {
    result.shadowAlerts.forEach((k) => {
      lines.push(`- ${label(k)} (\`${k}\`)`);
    });
  }
  lines.push("");

  lines.push(`## ${L("archetypesSection")}`);
  lines.push("");
  lines.push(
    `| ${L("rank")} | ${L("archetype")} | ${L("light")} | ${L("shadow")} | ${L("net")} | ${L("intensity")} | ${L("lightPct")} | ${L("shadowPct")} |`,
  );
  lines.push("| ---: | :--- | ---: | ---: | ---: | ---: | ---: | ---: |");
  result.archetypes.forEach((a, i) => {
    lines.push(
      `| ${i + 1} | ${escCell(label(a.archetype))} | ${a.light.toFixed(2)} | ${a.shadow.toFixed(2)} | ${a.net.toFixed(2)} | ${Math.round(a.intensity * 100)} | ${a.lightPct.toFixed(1)} | ${a.shadowPct.toFixed(1)} |`,
    );
  });
  lines.push("");

  lines.push(`## ${L("housesSection")}`);
  lines.push("");
  for (const h of result.houses) {
    const houseTitle = locale === "fr" ? h.label_fr : h.label_en;
    lines.push(`### ${L("house")} ${h.house} — ${escCell(houseTitle)}`);
    lines.push("");
    lines.push(`- **${L("answered")}:** ${h.answered} / ${h.total}`);
    lines.push(
      `- **${L("topInHouse")}:** ${h.topArchetype ? `${label(h.topArchetype)} (\`${h.topArchetype}\`)` : L("none")} (${h.topArchetypeWeight.toFixed(2)})`,
    );
    lines.push("");
    lines.push(`#### ${L("breakdown")}`);
    lines.push("");
    const entries = Object.entries(h.archetypeBreakdown).sort(
      (a, b) => b[1].light + b[1].shadow - (a[1].light + a[1].shadow),
    );
    if (entries.length === 0) {
      lines.push(L("none"));
    } else {
      lines.push(`| ${L("archetype")} | ${L("light")} | ${L("shadow")} |`);
      lines.push("| :--- | ---: | ---: |");
      for (const [k, v] of entries) {
        lines.push(`| ${escCell(label(k))} | ${v.light.toFixed(2)} | ${v.shadow.toFixed(2)} |`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function slugifyForFilename(s: string): string {
  const out = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return out || "user";
}

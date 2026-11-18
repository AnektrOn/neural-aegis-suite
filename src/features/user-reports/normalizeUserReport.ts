import type { UserReport, UserReportV3PackFiles } from "./types";

function asPackObject(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value as Record<string, unknown>;
  return null;
}

export function coerceUserReportPackFiles(raw: unknown): UserReportV3PackFiles | null {
  const obj = asPackObject(raw);
  if (!obj) return null;

  const rapport =
    (typeof obj.rapport_md === "string" && obj.rapport_md) ||
    (typeof obj["00_rapport_md"] === "string" && obj["00_rapport_md"]) ||
    "";

  if (!rapport.trim() && !obj.resume_md && !obj.bullet_points_md) {
    return null;
  }

  return {
    rapport_md: rapport,
    resume_md: typeof obj.resume_md === "string" ? obj.resume_md : undefined,
    bullet_points_md: typeof obj.bullet_points_md === "string" ? obj.bullet_points_md : undefined,
    graphique_md: typeof obj.graphique_md === "string" ? obj.graphique_md : undefined,
    prompt_ai_md: typeof obj.prompt_ai_md === "string" ? obj.prompt_ai_md : undefined,
  };
}

/** Ensures pack_files is a structured object and content_md mirrors rapport when missing. */
export function normalizeUserReport(report: UserReport): UserReport {
  const pack = coerceUserReportPackFiles(report.pack_files);
  const contentMd = (report.content_md || "").trim();
  const rapportMd = (pack?.rapport_md || "").trim();

  if (!pack) {
    if (contentMd) {
      return {
        ...report,
        pack_files: { rapport_md: contentMd },
      };
    }
    return report;
  }

  const mergedRapport = rapportMd || contentMd;
  const nextPack: UserReportV3PackFiles = {
    ...pack,
    rapport_md: mergedRapport || pack.rapport_md,
  };

  return {
    ...report,
    pack_files: nextPack,
    content_md: contentMd || mergedRapport || report.content_md,
  };
}
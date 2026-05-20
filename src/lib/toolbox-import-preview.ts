import { hydrateToolboxWidgetConfigForPersistence } from "@/lib/toolbox-widget-config-hydrate";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import type { Locale } from "@/i18n/translations";
import {
  normalizeToolboxUserDeliveryStatus,
  resolveToolboxItemAssignments,
  validateToolboxCatalogPayload,
  type ToolboxCatalogImportPayload,
  type ToolboxUserDeliveryStatus,
  type ValidationIssue,
} from "@/services/programBuilderService";

export type ToolboxImportTemplateAction = "create" | "reuse_existing";
export type ToolboxImportAssignmentAction = "create" | "skip_duplicate" | "none";

export interface ToolboxImportPreviewRow {
  rowKey: string;
  itemIndex: number;
  externalKey: string | null;
  title: string;
  contentType: string;
  userId: string | null;
  userDisplayName: string;
  deliveryStatus: ToolboxUserDeliveryStatus | null;
  templateAction: ToolboxImportTemplateAction;
  assignmentAction: ToolboxImportAssignmentAction;
}

export interface ToolboxImportPreviewItem {
  itemIndex: number;
  externalKey: string | null;
  contentType: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string | null;
  descriptionEn: string | null;
  duration: string | null;
  externalUrl: string | null;
  templateAction: ToolboxImportTemplateAction;
  widgetConfigHydrated: Record<string, unknown>;
  textLines: Array<{ label: string; value: string }>;
  assignmentRows: ToolboxImportPreviewRow[];
}

export interface ToolboxImportPreviewContext {
  existingTemplateKeys: Map<string, string>;
  existingAssignmentPairs: Set<string>;
  profileNames: Map<string, string>;
}

export function buildToolboxImportPreview(
  payload: ToolboxCatalogImportPayload,
  ctx: ToolboxImportPreviewContext,
): ToolboxImportPreviewRow[] {
  const rows: ToolboxImportPreviewRow[] = [];

  (payload.toolbox_items || []).forEach((item, itemIndex) => {
    const externalKey = (item.external_key || "").trim() || null;
    const existingTemplateId = externalKey ? ctx.existingTemplateKeys.get(externalKey) : undefined;
    const templateAction: ToolboxImportTemplateAction = existingTemplateId ? "reuse_existing" : "create";
    const targets = resolveToolboxItemAssignments(item, payload);

    if (targets.length === 0) {
      rows.push({
        rowKey: `item-${itemIndex}-template`,
        itemIndex,
        externalKey,
        title: item.title?.trim() || "(sans titre)",
        contentType: item.content_type || "—",
        userId: null,
        userDisplayName: "—",
        deliveryStatus: null,
        templateAction,
        assignmentAction: "none",
      });
      return;
    }

    targets.forEach(({ userId, status }, targetIndex) => {
      let assignmentAction: ToolboxImportAssignmentAction = "create";
      if (existingTemplateId) {
        const pairKey = `${userId}::${existingTemplateId}`;
        if (ctx.existingAssignmentPairs.has(pairKey)) {
          assignmentAction = "skip_duplicate";
        }
      }
      rows.push({
        rowKey: `item-${itemIndex}-user-${userId}-${targetIndex}`,
        itemIndex,
        externalKey,
        title: item.title?.trim() || "(sans titre)",
        contentType: item.content_type || "—",
        userId,
        userDisplayName: ctx.profileNames.get(userId) || userId.slice(0, 8) + "…",
        deliveryStatus: status,
        templateAction,
        assignmentAction,
      });
    });
  });

  return rows;
}

function readLocalePair(
  fr?: string | null,
  en?: string | null,
  legacy?: string | null,
  i18n?: Record<string, string> | null,
): { fr: string; en: string } {
  const frVal = (fr || i18n?.fr || legacy || "").trim();
  const enVal = (en || i18n?.en || "").trim();
  return { fr: frVal, en: enVal || frVal };
}

function normalizeWidgetConfigForPreview(
  contentType: string,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...raw };
  if (contentType === "focus_introspectif") {
    if (typeof out.duration_min !== "number" && typeof out.duration_sec === "number") {
      out.duration_min = Math.max(1, Math.ceil((out.duration_sec as number) / 60));
    }
  }
  return out;
}

export function summarizeWidgetConfigForPreview(
  contentType: string,
  config: Record<string, unknown>,
  locale: Locale,
): Array<{ label: string; value: string }> {
  const lines: Array<{ label: string; value: string }> = [];
  const pick = (key: string, i18nKey?: string) => {
    const leg = config[key];
    const i18n = i18nKey ? config[i18nKey] : undefined;
    const v = pickWidgetCatalogCopy(
      locale,
      i18n as Record<string, string> | undefined,
      typeof leg === "string" ? leg : null,
    );
    if (v) lines.push({ label: key, value: v });
  };

  pick("instructions", "instructions_i18n");
  pick("intention", "intention_i18n");
  pick("prompt", "prompt_i18n");
  pick("question", "question_i18n");

  if (typeof config.duration_min === "number") {
    lines.push({ label: "duration_min", value: `${config.duration_min} min` });
  }
  if (typeof config.duration_sec === "number") {
    lines.push({ label: "duration_sec", value: `${config.duration_sec} s` });
  }

  if (contentType === "breathwork") {
    for (const k of ["cycles", "breath_in_sec", "pause1_sec", "breath_out_sec", "pause2_sec"] as const) {
      if (typeof config[k] === "number") {
        lines.push({ label: k, value: String(config[k]) });
      }
    }
  }

  if (contentType === "stop_protocol") {
    for (const k of ["mode", "stop_sec", "take_breath_sec", "observe_sec", "proceed_sec", "step_duration_sec"] as const) {
      if (config[k] !== undefined && config[k] !== null) {
        lines.push({ label: k, value: String(config[k]) });
      }
    }
  }

  const affirmations = config.affirmations;
  if (Array.isArray(affirmations)) {
    affirmations.forEach((a, i) => {
      if (typeof a === "string") {
        lines.push({ label: `affirmations[${i}]`, value: a });
      } else if (a && typeof a === "object") {
        const o = a as Record<string, unknown>;
        const fr = String(o.fr ?? "").trim();
        const en = String(o.en ?? "").trim();
        if (fr) lines.push({ label: `affirmations[${i}].fr`, value: fr });
        if (en) lines.push({ label: `affirmations[${i}].en`, value: en });
      }
    });
  }

  const ai = config.affirmations_i18n;
  if (ai && typeof ai === "object" && !Array.isArray(ai)) {
    const frArr = Array.isArray((ai as { fr?: unknown[] }).fr) ? (ai as { fr: unknown[] }).fr : [];
    const enArr = Array.isArray((ai as { en?: unknown[] }).en) ? (ai as { en: unknown[] }).en : [];
    frArr.forEach((fr, i) => {
      const f = String(fr).trim();
      const e = enArr[i] != null ? String(enArr[i]).trim() : "";
      if (f) lines.push({ label: `affirmations_i18n[${i}]`, value: e ? `${f} / ${e}` : f });
    });
  }

  if (Array.isArray(ai)) {
    ai.forEach((entry, i) => {
      if (entry && typeof entry === "object") {
        const o = entry as Record<string, unknown>;
        const fr = String(o.fr ?? "").trim();
        const en = String(o.en ?? "").trim();
        if (fr || en) lines.push({ label: `affirmations_i18n[${i}]`, value: en ? `${fr} → ${en}` : fr });
      }
    });
  }

  if (Array.isArray(config.steps)) {
    (config.steps as unknown[]).forEach((step, i) => {
      if (!step || typeof step !== "object") return;
      const s = step as Record<string, unknown>;
      const text = pickWidgetCatalogCopy(
        locale,
        s.text_i18n as Record<string, string> | undefined,
        typeof s.text === "string" ? s.text : typeof s.title === "string" ? s.title : null,
      );
      if (text) lines.push({ label: `steps[${i}]`, value: text });
    });
  }

  return lines;
}

export function buildToolboxImportPreviewItems(
  payload: ToolboxCatalogImportPayload,
  previewRows: ToolboxImportPreviewRow[],
  locale: Locale,
): ToolboxImportPreviewItem[] {
  return (payload.toolbox_items || []).map((item, itemIndex) => {
    const externalKey = (item.external_key || "").trim() || null;
    const templateAction: ToolboxImportTemplateAction =
      previewRows.find((r) => r.itemIndex === itemIndex)?.templateAction ?? "create";

    const { fr: titleFr, en: titleEn } = readLocalePair(
      item.title_fr,
      item.title_en,
      item.title,
      item.title_i18n ?? null,
    );
    const { fr: descFr, en: descEn } = readLocalePair(
      item.description_fr,
      item.description_en,
      item.description ?? null,
      item.description_i18n ?? null,
    );

    const rawConfig = normalizeWidgetConfigForPreview(
      item.content_type,
      (item.widget_config || {}) as Record<string, unknown>,
    );
    const { widget_config: widgetConfigHydrated } = hydrateToolboxWidgetConfigForPersistence(
      item.content_type,
      rawConfig,
    );

    const assignmentRows = previewRows.filter((r) => r.itemIndex === itemIndex);

    return {
      itemIndex,
      externalKey,
      contentType: item.content_type,
      titleFr,
      titleEn,
      descriptionFr: descFr || null,
      descriptionEn: descEn || null,
      duration: item.duration?.trim() || null,
      externalUrl: item.external_url?.trim() || null,
      templateAction,
      widgetConfigHydrated,
      textLines: summarizeWidgetConfigForPreview(item.content_type, rawConfig, locale),
      assignmentRows,
    };
  });
}

export function filterPreviewItems(
  items: ToolboxImportPreviewItem[],
  filterStatus: string,
  filterUserId: string,
): ToolboxImportPreviewItem[] {
  return items
    .map((item) => {
      const assignmentRows = item.assignmentRows.filter((row) => {
        if (filterStatus !== "all") {
          if (filterStatus === "template_only") {
            if (row.deliveryStatus !== null) return false;
          } else if (row.deliveryStatus !== filterStatus) {
            return false;
          }
        }
        if (filterUserId !== "all" && row.userId !== filterUserId) return false;
        return true;
      });
      return { ...item, assignmentRows };
    })
    .filter((item) => {
      if (filterStatus === "all" && filterUserId === "all") return true;
      return item.assignmentRows.length > 0;
    });
}

export function parseAndPreviewToolboxImport(
  rawJson: string,
  ctx: ToolboxImportPreviewContext,
  locale: Locale = "fr",
): {
  payload: ToolboxCatalogImportPayload | null;
  issues: ValidationIssue[];
  previewRows: ToolboxImportPreviewRow[];
  previewItems: ToolboxImportPreviewItem[];
  parseError: string | null;
} {
  try {
    const parsed = JSON.parse(rawJson) as ToolboxCatalogImportPayload;
    const issues = validateToolboxCatalogPayload(parsed);
    const previewRows = issues.length === 0 ? buildToolboxImportPreview(parsed, ctx) : [];
    const previewItems =
      issues.length === 0 ? buildToolboxImportPreviewItems(parsed, previewRows, locale) : [];
    return { payload: parsed, issues, previewRows, previewItems, parseError: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "JSON invalide.";
    return {
      payload: null,
      issues: [{ path: "$", message }],
      previewRows: [],
      previewItems: [],
      parseError: message,
    };
  }
}

export function groupPreviewRows(
  rows: ToolboxImportPreviewRow[],
  sortBy: "status_user" | "user_status",
): Array<{
  groupKey: string;
  groupLabel: string;
  rows: ToolboxImportPreviewRow[];
}> {
  const statusOrder: ToolboxUserDeliveryStatus[] = ["waiting", "assigned", "active", "inactive"];
  const templateOnlyLabel = "__template_only__";

  if (sortBy === "status_user") {
    const byStatus = new Map<string, ToolboxImportPreviewRow[]>();
    for (const row of rows) {
      const key = row.deliveryStatus ?? templateOnlyLabel;
      if (!byStatus.has(key)) byStatus.set(key, []);
      byStatus.get(key)!.push(row);
    }
    const keys = [
      ...statusOrder.filter((s) => byStatus.has(s)),
      ...(byStatus.has(templateOnlyLabel) ? [templateOnlyLabel] : []),
    ];
    return keys.map((statusKey) => {
      const groupRows = [...(byStatus.get(statusKey) || [])].sort((a, b) =>
        a.userDisplayName.localeCompare(b.userDisplayName, undefined, { sensitivity: "base" }),
      );
      return {
        groupKey: statusKey,
        groupLabel: statusKey,
        rows: groupRows,
      };
    });
  }

  const byUser = new Map<string, ToolboxImportPreviewRow[]>();
  for (const row of rows) {
    const key = row.userId ?? templateOnlyLabel;
    if (!byUser.has(key)) byUser.set(key, []);
    byUser.get(key)!.push(row);
  }
  return [...byUser.entries()]
    .sort(([a], [b]) => {
      const nameA = byUser.get(a)?.[0]?.userDisplayName ?? a;
      const nameB = byUser.get(b)?.[0]?.userDisplayName ?? b;
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    })
    .map(([userKey, groupRows]) => {
      const sorted = [...groupRows].sort((a, b) => {
        const ia = a.deliveryStatus ? statusOrder.indexOf(a.deliveryStatus) : 99;
        const ib = b.deliveryStatus ? statusOrder.indexOf(b.deliveryStatus) : 99;
        return ia - ib;
      });
      return {
        groupKey: userKey,
        groupLabel: sorted[0]?.userDisplayName ?? userKey,
        rows: sorted,
      };
    });
}

export function deliveryStatusLabelKey(
  status: ToolboxUserDeliveryStatus | null,
): string {
  if (!status) return "admin.toolboxMgmt.import.statusTemplateOnly";
  return `admin.toolboxMgmt.import.status.${status}`;
}

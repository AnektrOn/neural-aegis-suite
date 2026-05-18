// Edge Function: export-deep-dive-v2-to-drive
// Uploads a Deep Dive V2 report (user or admin variant) to Google Drive
// via the Lovable Google Drive connector gateway.
//
// Folder layout (markdown, default):
//   {ROOT_FOLDER_ID}/{ClientName}/DeepDiveV2/{ts}_{stem}/
//     00-lisez-moi.md
//     01-rapport.md
//     02-profil.md
//     03-deep-dive-70-questions.md
//     04-deep-dive-70-scores.md
//     05-quiz-30-sessions.md
//     06-snapshots-analyses-recommandations.md
//     07-dump-complet.json
//
// Legacy single-file markdown: set body.singleMarkdownFile: true
//
// POST body:
//   {
//     userId:       string  (required, target user)
//     assessmentId: string? (optional)
//     exportType:   "user" | "admin"
//     format?:      "markdown" | "json"   (default: markdown)
//     content?:     string                 (pre-rendered markdown)
//     payload?:     object                 (raw JSON when format=json)
//     filenameStem?: string                (optional override)
//     singleMarkdownFile?: boolean         (default false for markdown)
//   }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QUESTIONS_CATALOG from "./questions70.json" with { type: "json" };

type CatalogOption = { id: string; label_fr: string; label_en: string; weights: { archetype: string; polarity: "light" | "shadow"; weight: number }[] };
type CatalogQuestion = { id: string; position: number; house: number; prompt_fr: string; prompt_en: string; options: CatalogOption[] };
type CatalogHouse = { number: number; label_fr: string; label_en: string; theme_fr: string; theme_en: string };

const CATALOG_QUESTIONS: CatalogQuestion[] = (QUESTIONS_CATALOG as any).questions;
const CATALOG_HOUSES: CatalogHouse[] = (QUESTIONS_CATALOG as any).houses;
const CATALOG_OPT_BY_CODE = new Map<string, { q: CatalogQuestion; o: CatalogOption }>();
for (const q of CATALOG_QUESTIONS) for (const o of q.options) CATALOG_OPT_BY_CODE.set(o.id, { q, o });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const ROOT_FOLDER_ID = "1S9nImUA3zt3n8byGLmixpAl75lDdjGZg";

function gwHeaders(extra: Record<string, string> = {}): HeadersInit {
  const lov = Deno.env.get("LOVABLE_API_KEY");
  const gd = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!lov) throw new Error("LOVABLE_API_KEY is not configured");
  if (!gd) throw new Error("GOOGLE_DRIVE_API_KEY is not configured");
  return { Authorization: `Bearer ${lov}`, "X-Connection-Api-Key": gd, ...extra };
}

async function trashDriveFolder(id: string): Promise<boolean> {
  try {
    const r = await fetch(`${GATEWAY}/drive/v3/files/${id}?supportsAllDrives=true`, {
      method: "PATCH",
      headers: gwHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ trashed: true }),
    });
    return r.ok;
  } catch { return false; }
}

async function listChildFolders(parentId: string, name: string): Promise<string[]> {
  const safe = name.replace(/'/g, "\\'");
  const q = `name='${safe}' and mimeType='${FOLDER_MIME}' and '${parentId}' in parents and trashed=false`;
  const url = `${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,createdTime)&orderBy=createdTime&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const r = await fetch(url, { headers: gwHeaders() });
  if (!r.ok) throw new Error(`Drive list failed ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return (data.files || []).map((f: any) => f.id);
}

async function createDriveFolder(parentId: string, name: string): Promise<string> {
  const r = await fetch(`${GATEWAY}/drive/v3/files?supportsAllDrives=true`, {
    method: "POST",
    headers: gwHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
  if (!r.ok) throw new Error(`Drive create failed ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.id as string;
}

async function findOrCreateFolder(admin: any, parentId: string, name: string): Promise<string> {
  const { data: cached } = await admin
    .from("drive_folder_cache")
    .select("drive_id")
    .eq("parent_id", parentId)
    .eq("name", name)
    .maybeSingle();
  if (cached?.drive_id) return cached.drive_id;

  const existing = await listChildFolders(parentId, name);
  let driveId: string;
  if (existing.length > 0) {
    driveId = existing[0];
    for (const dup of existing.slice(1)) await trashDriveFolder(dup);
  } else {
    driveId = await createDriveFolder(parentId, name);
  }

  const { data: inserted, error } = await admin
    .from("drive_folder_cache")
    .insert({ parent_id: parentId, name, drive_id: driveId })
    .select("drive_id")
    .single();

  if (error) {
    const { data: winner } = await admin
      .from("drive_folder_cache")
      .select("drive_id")
      .eq("parent_id", parentId)
      .eq("name", name)
      .single();
    if (winner && winner.drive_id !== driveId && existing.length === 0) {
      await trashDriveFolder(driveId);
    }
    return winner!.drive_id;
  }
  return inserted!.drive_id;
}

async function uploadFile(
  parentId: string,
  filename: string,
  content: string,
  mimeType: string,
): Promise<{ id: string; name: string; webViewLink: string | null }> {
  const boundary = "aegis_" + crypto.randomUUID();
  const metadata = { name: filename, parents: [parentId], mimeType };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}; charset=UTF-8\r\n\r\n${content}\r\n--${boundary}--`;

  const r = await fetch(
    `${GATEWAY}/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink`,
    {
      method: "POST",
      headers: gwHeaders({ "Content-Type": `multipart/related; boundary=${boundary}` }),
      body,
    },
  );
  if (!r.ok) throw new Error(`Drive upload failed ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return { id: j.id, name: j.name, webViewLink: j.webViewLink ?? null };
}

function sanitize(s: string): string {
  return (s || "Inconnu").replace(/[\\/:*?"<>|]/g, "_").trim().slice(0, 120) || "Inconnu";
}

async function fetchFullDeepDiveData(admin: any, userId: string, assessmentId?: string) {
  const safe = async <T,>(p: Promise<{ data: T | null; error: any }>): Promise<T | null> => {
    try { const { data, error } = await p; if (error) console.error("query error:", error); return data ?? null; } catch (e) { console.error(e); return null; }
  };

  const profile = await safe(admin.from("profiles").select("*").eq("id", userId).maybeSingle());
  const deepdiveResponses = await safe(admin.from("deepdive_responses").select("*").eq("user_id", userId).order("created_at", { ascending: true }));

  const sessionsQ = admin.from("assessment_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  const sessions = await safe(sessionsQ);

  const sessionIds = (sessions ?? []).map((s: any) => s.id);
  const targetSessionId = assessmentId && sessionIds.includes(assessmentId) ? assessmentId : sessionIds[0];

  const responses = sessionIds.length
    ? await safe(admin.from("assessment_responses").select("*").in("session_id", sessionIds))
    : [];
  const questionIds = Array.from(new Set((responses ?? []).map((r: any) => r.question_id)));
  const optionIds = Array.from(new Set((responses ?? []).flatMap((r: any) => r.selected_option_ids ?? [])));

  const questions = questionIds.length
    ? await safe(admin.from("assessment_questions").select("*").in("id", questionIds).order("position"))
    : [];
  const options = optionIds.length
    ? await safe(admin.from("assessment_options").select("*").in("id", optionIds))
    : [];
  const templateIds = Array.from(new Set((sessions ?? []).map((s: any) => s.template_id).filter(Boolean)));
  const templates = templateIds.length
    ? await safe(admin.from("assessment_templates").select("*").in("id", templateIds))
    : [];

  const archetypeScores = sessionIds.length
    ? await safe(admin.from("archetype_scores").select("*").in("session_id", sessionIds).order("rank"))
    : [];
  const snapshots = await safe(admin.from("archetype_profile_snapshots").select("*").eq("user_id", userId).order("computed_at", { ascending: false }));
  const analysisResults = await safe(admin.from("analysis_results").select("*").eq("user_id", userId).order("created_at", { ascending: false }));
  const recommendations = await safe(admin.from("recommendation_tools").select("*").eq("user_id", userId).order("rank"));

  return {
    profile,
    targetSessionId,
    deepdive_responses: deepdiveResponses ?? [],
    assessment_sessions: sessions ?? [],
    assessment_responses: responses ?? [],
    assessment_questions: questions ?? [],
    assessment_options: options ?? [],
    assessment_templates: templates ?? [],
    archetype_scores: archetypeScores ?? [],
    archetype_profile_snapshots: snapshots ?? [],
    analysis_results: analysisResults ?? [],
    recommendation_tools: recommendations ?? [],
  };
}

type DeepDiveComputed = {
  ddByCode: Map<string, any>;
  archRanking: { archetype: string; light: number; shadow: number; net: number; total: number }[];
  answered: number;
};

function computeDeepDiveFromResponses(d: any): DeepDiveComputed {
  const ddByCode = new Map<string, any>();
  for (const r of d.deepdive_responses) ddByCode.set(r.question_code, r);

  const arch: Record<string, { light: number; shadow: number }> = {};
  let answered = 0;
  for (const r of d.deepdive_responses) {
    const codes: string[] = r.option_codes ?? [];
    if (codes.length === 0) continue;
    answered++;
    for (const c of codes) {
      const hit = CATALOG_OPT_BY_CODE.get(c);
      if (!hit) continue;
      for (const w of hit.o.weights) {
        const slot = (arch[w.archetype] ||= { light: 0, shadow: 0 });
        slot[w.polarity] += w.weight;
      }
    }
  }
  const archRanking = Object.entries(arch)
    .map(([k, v]) => ({ archetype: k, light: v.light, shadow: v.shadow, net: v.light - v.shadow, total: v.light + v.shadow }))
    .sort((a, b) => b.total - a.total);

  return { ddByCode, archRanking, answered };
}

function exportMetaComment(p: {
  exportType: string;
  userId: string;
  assessmentId: string | null;
  generatedBy: string;
  generatedAt: string;
}): string {
  return [
    `<!--`,
    `exportType: ${p.exportType}`,
    `generatedAt: ${p.generatedAt}`,
    `userId: ${p.userId}`,
    `assessmentId: ${p.assessmentId ?? "null"}`,
    `generatedBy: ${p.generatedBy}`,
    `-->`,
    "",
  ].join("\n");
}

function renderProfileMd(d: any, generatedAt: string): string {
  const lines: string[] = [];
  lines.push("---", "", "# Profil utilisateur", "");
  lines.push(`_Généré le ${generatedAt}_`, "");
  lines.push("```json", JSON.stringify(d.profile, null, 2), "```", "");
  return lines.join("\n");
}

function renderDeepDive70QuestionsMd(d: any, computed: DeepDiveComputed, generatedAt: string): string {
  const { ddByCode, answered } = computed;
  const lines: string[] = [];
  lines.push("---", "", "# Deep Dive (70) — Questions, options, pondérations, réponses", "");
  lines.push(`_Généré le ${generatedAt} · ${answered}/${CATALOG_QUESTIONS.length} questions avec réponse_`, "");

  for (const h of CATALOG_HOUSES) {
    const houseQs = CATALOG_QUESTIONS.filter((q) => q.house === h.number).sort((a, b) => a.position - b.position);
    if (houseQs.length === 0) continue;
    lines.push(`## Maison ${h.number} — ${h.label_fr} (${h.label_en})`);
    lines.push(`_${h.theme_fr}_`, "");
    for (const q of houseQs) {
      const r = ddByCode.get(q.id);
      const sel: string[] = r?.option_codes ?? [];
      lines.push(`### Q${q.position} · \`${q.id}\` — ${q.prompt_fr}`);
      lines.push(`*EN:* ${q.prompt_en}`, "");
      for (const o of q.options) {
        const mark = sel.includes(o.id) ? "✅" : "▫️";
        const wstr = o.weights.map((w) => `${w.archetype}/${w.polarity}=${w.weight}`).join(", ");
        lines.push(`- ${mark} \`${o.id}\` — **FR:** ${o.label_fr}`);
        lines.push(`  - *EN:* ${o.label_en}`);
        lines.push(`  - *Pondération:* ${wstr || "-"}`);
      }
      if (r) {
        if (r.text_value) lines.push(`- 📝 Texte libre: ${r.text_value}`);
        if (r.numeric_value != null) lines.push(`- 🔢 Numérique: ${r.numeric_value}`);
        lines.push(`- 🕒 Répondu: ${r.created_at}  ·  MAJ: ${r.updated_at}`);
      } else {
        lines.push(`- ⚠️ Non répondu`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

function renderDeepDive70ScoresMd(computed: DeepDiveComputed, generatedAt: string): string {
  const { archRanking } = computed;
  const lines: string[] = [];
  lines.push("---", "", "# Deep Dive (70) — Interprétation (scores par archétype)", "");
  lines.push(`_Généré le ${generatedAt}_`, "");

  if (archRanking.length === 0) {
    lines.push("_Aucune réponse exploitable._", "");
  } else {
    lines.push("| Rang | Archétype | Lumière | Ombre | Net | Total |", "|---|---|---|---|---|---|");
    archRanking.forEach((a, i) =>
      lines.push(`| ${i + 1} | ${a.archetype} | ${a.light} | ${a.shadow} | ${a.net} | ${a.total} |`),
    );
    lines.push("");
    const top3 = archRanking.slice(0, 3);
    const shadowDom = archRanking.filter((a) => a.shadow > a.light);
    lines.push(`**Top 3 archétypes (par poids total):** ${top3.map((a) => `${a.archetype} (net ${a.net})`).join(", ")}`);
    if (shadowDom.length) {
      lines.push(`**Alertes ombre (shadow > light):** ${shadowDom.map((a) => `${a.archetype} (L=${a.light}/S=${a.shadow})`).join(", ")}`);
    } else {
      lines.push(`**Alertes ombre:** _aucune_`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function renderQuiz30SessionsMd(d: any, generatedAt: string): string {
  const lines: string[] = [];
  lines.push("---", "", "# Quiz / assessment (30) — Sessions, réponses détaillées, scores", "");
  lines.push(`_Généré le ${generatedAt}_`, "");
  lines.push(`## Sessions (${d.assessment_sessions.length})`, "");

  for (const s of d.assessment_sessions) {
    const tpl = d.assessment_templates.find((t: any) => t.id === s.template_id);
    lines.push(`### Session ${s.id}${s.id === d.targetSessionId ? " ⭐ (cible export)" : ""}`);
    lines.push(`- **Template:** ${tpl?.title_fr ?? tpl?.slug ?? s.template_id}`);
    lines.push(`- **Statut:** ${s.status}  ·  **Démarrée:** ${s.started_at}  ·  **Soumise:** ${s.submitted_at ?? "-"}`);
    lines.push(`- **Durée:** ${s.duration_seconds ?? "-"}s  ·  **Confiance:** ${s.confidence_score ?? "-"}`, "");

    const sResp = d.assessment_responses.filter((r: any) => r.session_id === s.id);
    lines.push(`#### Réponses (${sResp.length})`, "");
    for (const r of sResp) {
      const q = d.assessment_questions.find((q: any) => q.id === r.question_id);
      const selOpts = (r.selected_option_ids ?? []).map((oid: string) => {
        const o = d.assessment_options.find((o: any) => o.id === oid);
        return o ? `[${o.position}] ${o.label_fr ?? o.label_en} (w=${JSON.stringify(o.archetype_weights)} shadow=${JSON.stringify(o.shadow_weights)})` : oid;
      });
      lines.push(`- **Q${q?.position ?? "?"} — ${q?.prompt_fr ?? q?.prompt_en ?? r.question_id}**`);
      lines.push(`  - House: ${q?.house ?? "-"} · Dim: ${q?.dimension ?? "-"} · Type: ${q?.question_type ?? "-"}`);
      if (selOpts.length) lines.push(`  - Sélection:\n    - ${selOpts.join("\n    - ")}`);
      if (r.text_value) lines.push(`  - Texte: ${r.text_value}`);
      if (r.numeric_value != null) lines.push(`  - Numérique: ${r.numeric_value}`);
      lines.push(`  - Raw: \`${JSON.stringify(r.raw_payload)}\``);
    }
    lines.push("");

    const sScores = d.archetype_scores.filter((x: any) => x.session_id === s.id);
    if (sScores.length) {
      lines.push(`#### Scores archétypes (session)`, "", "| Rang | Archétype | Brut | Normalisé |", "|---|---|---|---|");
      for (const sc of sScores) lines.push(`| ${sc.rank} | ${sc.archetype_key} | ${sc.raw_score} | ${sc.normalized_score} |`);
      lines.push("");
    }
  }
  return lines.join("\n");
}

function renderSnapshotsAnalysesMd(d: any, generatedAt: string): string {
  const lines: string[] = [];
  lines.push("---", "", "# Snapshots, analyses, recommandations", "");
  lines.push(`_Généré le ${generatedAt}_`, "");
  lines.push(`## Snapshots de profil archétype (${d.archetype_profile_snapshots.length})`, "```json", JSON.stringify(d.archetype_profile_snapshots, null, 2), "```", "");
  lines.push(`## Résultats d'analyse (${d.analysis_results.length})`, "```json", JSON.stringify(d.analysis_results, null, 2), "```", "");
  lines.push(`## Recommandations (${d.recommendation_tools.length})`, "```json", JSON.stringify(d.recommendation_tools, null, 2), "```", "");
  return lines.join("\n");
}

function renderReadmeIndexMd(p: {
  metaComment: string;
  generatedAt: string;
  clientName: string;
  bundleRelPath: string;
  files: { name: string; role: string }[];
}): string {
  const lines: string[] = [];
  lines.push(p.metaComment);
  lines.push("# Export Aegis — index", "");
  lines.push(`- **Client:** ${p.clientName}`);
  lines.push(`- **Dossier Drive:** \`${p.bundleRelPath}\``);
  lines.push(`- **Généré:** ${p.generatedAt}`, "");
  lines.push("## Fichiers", "");
  for (const f of p.files.filter((x) => x.name !== "00-lisez-moi.md")) {
    lines.push(`- \`${f.name}\` — ${f.role}`);
  }
  lines.push("", "---", "", "*Ouvrez `01-rapport.md` pour le rapport principal (vue Obsidian).*", "");
  return lines.join("\n");
}

/** Legacy: one markdown with report + full appendix + embedded JSON dump. */
function renderFullDataAppendix(d: any, computed: DeepDiveComputed): string {
  const lines: string[] = [];
  lines.push("---", "", "# 📦 Annexe — Données complètes (Deep Dive · Quiz · Archétypes)", "");
  lines.push(`_Généré le ${new Date().toISOString()}_`, "");

  lines.push("## Profil utilisateur", "```json", JSON.stringify(d.profile, null, 2), "```", "");

  const { ddByCode, archRanking, answered } = computed;

  lines.push(`## Deep Dive — Réponses (${answered}/${CATALOG_QUESTIONS.length}) avec questions, options et pondérations`, "");
  for (const h of CATALOG_HOUSES) {
    const houseQs = CATALOG_QUESTIONS.filter((q) => q.house === h.number).sort((a, b) => a.position - b.position);
    if (houseQs.length === 0) continue;
    lines.push(`### Maison ${h.number} — ${h.label_fr} (${h.label_en})`);
    lines.push(`_${h.theme_fr}_`, "");
    for (const q of houseQs) {
      const r = ddByCode.get(q.id);
      const sel: string[] = r?.option_codes ?? [];
      lines.push(`#### Q${q.position} · \`${q.id}\` — ${q.prompt_fr}`);
      lines.push(`*EN:* ${q.prompt_en}`, "");
      for (const o of q.options) {
        const mark = sel.includes(o.id) ? "✅" : "▫️";
        const wstr = o.weights.map((w) => `${w.archetype}/${w.polarity}=${w.weight}`).join(", ");
        lines.push(`- ${mark} \`${o.id}\` — **FR:** ${o.label_fr}`);
        lines.push(`  - *EN:* ${o.label_en}`);
        lines.push(`  - *Pondération:* ${wstr || "-"}`);
      }
      if (r) {
        if (r.text_value) lines.push(`- 📝 Texte libre: ${r.text_value}`);
        if (r.numeric_value != null) lines.push(`- 🔢 Numérique: ${r.numeric_value}`);
        lines.push(`- 🕒 Répondu: ${r.created_at}  ·  MAJ: ${r.updated_at}`);
      } else {
        lines.push(`- ⚠️ Non répondu`);
      }
      lines.push("");
    }
  }

  lines.push("## 🧭 Interprétation Deep Dive — Scores par archétype", "");
  if (archRanking.length === 0) {
    lines.push("_Aucune réponse exploitable._", "");
  } else {
    lines.push("| Rang | Archétype | Lumière | Ombre | Net | Total |", "|---|---|---|---|---|---|");
    archRanking.forEach((a, i) =>
      lines.push(`| ${i + 1} | ${a.archetype} | ${a.light} | ${a.shadow} | ${a.net} | ${a.total} |`),
    );
    lines.push("");
    const top3 = archRanking.slice(0, 3);
    const shadowDom = archRanking.filter((a) => a.shadow > a.light);
    lines.push(`**Top 3 archétypes (par poids total):** ${top3.map((a) => `${a.archetype} (net ${a.net})`).join(", ")}`);
    if (shadowDom.length) {
      lines.push(`**Alertes ombre (shadow > light):** ${shadowDom.map((a) => `${a.archetype} (L=${a.light}/S=${a.shadow})`).join(", ")}`);
    } else {
      lines.push(`**Alertes ombre:** _aucune_`);
    }
    lines.push("");
  }

  lines.push(`## Sessions d'évaluation (${d.assessment_sessions.length})`, "");
  for (const s of d.assessment_sessions) {
    const tpl = d.assessment_templates.find((t: any) => t.id === s.template_id);
    lines.push(`### Session ${s.id}${s.id === d.targetSessionId ? " ⭐ (cible)" : ""}`);
    lines.push(`- **Template:** ${tpl?.title_fr ?? tpl?.slug ?? s.template_id}`);
    lines.push(`- **Statut:** ${s.status}  ·  **Démarrée:** ${s.started_at}  ·  **Soumise:** ${s.submitted_at ?? "-"}`);
    lines.push(`- **Durée:** ${s.duration_seconds ?? "-"}s  ·  **Confiance:** ${s.confidence_score ?? "-"}`, "");

    const sResp = d.assessment_responses.filter((r: any) => r.session_id === s.id);
    lines.push(`#### Réponses (${sResp.length})`, "");
    for (const r of sResp) {
      const q = d.assessment_questions.find((q: any) => q.id === r.question_id);
      const selOpts = (r.selected_option_ids ?? []).map((oid: string) => {
        const o = d.assessment_options.find((o: any) => o.id === oid);
        return o ? `[${o.position}] ${o.label_fr ?? o.label_en} (w=${JSON.stringify(o.archetype_weights)} shadow=${JSON.stringify(o.shadow_weights)})` : oid;
      });
      lines.push(`- **Q${q?.position ?? "?"} — ${q?.prompt_fr ?? q?.prompt_en ?? r.question_id}**`);
      lines.push(`  - House: ${q?.house ?? "-"} · Dim: ${q?.dimension ?? "-"} · Type: ${q?.question_type ?? "-"}`);
      if (selOpts.length) lines.push(`  - Sélection:\n    - ${selOpts.join("\n    - ")}`);
      if (r.text_value) lines.push(`  - Texte: ${r.text_value}`);
      if (r.numeric_value != null) lines.push(`  - Numérique: ${r.numeric_value}`);
      lines.push(`  - Raw: \`${JSON.stringify(r.raw_payload)}\``);
    }
    lines.push("");

    const sScores = d.archetype_scores.filter((x: any) => x.session_id === s.id);
    if (sScores.length) {
      lines.push(`#### Scores Archétypes`, "", "| Rang | Archétype | Brut | Normalisé |", "|---|---|---|---|");
      for (const sc of sScores) lines.push(`| ${sc.rank} | ${sc.archetype_key} | ${sc.raw_score} | ${sc.normalized_score} |`);
      lines.push("");
    }
  }

  lines.push(`## Snapshots de profil archétype (${d.archetype_profile_snapshots.length})`, "```json", JSON.stringify(d.archetype_profile_snapshots, null, 2), "```", "");
  lines.push(`## Résultats d'analyse (${d.analysis_results.length})`, "```json", JSON.stringify(d.analysis_results, null, 2), "```", "");
  lines.push(`## Recommandations (${d.recommendation_tools.length})`, "```json", JSON.stringify(d.recommendation_tools, null, 2), "```", "");

  lines.push("", "---", "", "## 🗄️ Dump JSON brut complet", "```json", JSON.stringify(d, null, 2), "```");
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const userId: string | undefined = body.userId;
    const assessmentId: string | undefined = body.assessmentId ?? body.submissionId;
    const exportType: "user" | "admin" = body.exportType;
    const format: "markdown" | "json" = body.format === "json" ? "json" : "markdown";
    const content: string | undefined = body.content;
    const payload = body.payload;
    const filenameStem: string | undefined = body.filenameStem;

    if (!userId || !exportType || !["user", "admin"].includes(exportType)) {
      return new Response(JSON.stringify({ error: "Missing/invalid fields: userId, exportType" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow } = await admin
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    const isAdmin = !!roleRow;

    if (exportType === "admin" && !isAdmin) {
      return new Response(JSON.stringify({ error: "Admin role required for admin export" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (exportType === "user" && user.id !== userId && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: cannot export another user's report" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await admin
      .from("profiles").select("display_name")
      .eq("id", userId).maybeSingle();
    const clientName = sanitize(profile?.display_name || userId);

    const generatedAtIso = new Date().toISOString();
    const ts = generatedAtIso.replace(/[:.]/g, "-").slice(0, 19);
    const stem = sanitize(filenameStem || `deep-dive-v2-${exportType}-${clientName}`);
    const singleMarkdownFile = body.singleMarkdownFile === true;

    const metaComment = exportMetaComment({
      exportType,
      generatedAt: generatedAtIso,
      userId,
      assessmentId: assessmentId ?? null,
      generatedBy: user.id,
    });

    // ---- Fetch ALL related data (deep dive + quiz + archetypes) ----
    const fullData = await fetchFullDeepDiveData(admin, userId, assessmentId);
    const computed = computeDeepDiveFromResponses(fullData);

    const clientFolderId = await findOrCreateFolder(admin, ROOT_FOLDER_ID, clientName);
    const ddFolderId = await findOrCreateFolder(admin, clientFolderId, "DeepDiveV2");

    if (format === "json") {
      const obj = payload ?? { note: "no payload provided", content: content ?? null };
      let fileBody = JSON.stringify(
        {
          exportType,
          generatedAt: generatedAtIso,
          userId,
          assessmentId: assessmentId ?? null,
          generatedBy: user.id,
          data: obj,
        },
        null,
        2,
      );
      const parsed = JSON.parse(fileBody);
      parsed.data = { client: parsed.data, fullExport: fullData };
      fileBody = JSON.stringify(parsed, null, 2);
      const fileName = `${ts}_${stem}.json`;
      const uploaded = await uploadFile(ddFolderId, fileName, fileBody, "application/json");
      return new Response(
        JSON.stringify({
          success: true,
          exportType,
          bundleFolder: null,
          fileId: uploaded.id,
          fileName: uploaded.name,
          webViewLink: uploaded.webViewLink,
          path: `${clientName}/DeepDiveV2/${fileName}`,
          files: [{ id: uploaded.id, name: uploaded.name, webViewLink: uploaded.webViewLink, path: `${clientName}/DeepDiveV2/${fileName}` }],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (typeof content !== "string" || !content.trim()) {
      return new Response(JSON.stringify({ error: "Missing 'content' (markdown report) for format=markdown" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (singleMarkdownFile) {
      const appendix = renderFullDataAppendix(fullData, computed);
      const fileBody = metaComment + content.trim() + "\n\n" + appendix;
      const fileName = `${ts}_${stem}.md`;
      const uploaded = await uploadFile(ddFolderId, fileName, fileBody, "text/markdown");
      return new Response(
        JSON.stringify({
          success: true,
          exportType,
          bundleFolder: null,
          fileId: uploaded.id,
          fileName: uploaded.name,
          webViewLink: uploaded.webViewLink,
          path: `${clientName}/DeepDiveV2/${fileName}`,
          files: [{ id: uploaded.id, name: uploaded.name, webViewLink: uploaded.webViewLink, path: `${clientName}/DeepDiveV2/${fileName}` }],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const bundleName = `${ts}_${stem}`;
    const bundleFolderId = await findOrCreateFolder(admin, ddFolderId, bundleName);
    const bundleRelPath = `${clientName}/DeepDiveV2/${bundleName}`;

    const manifest: { name: string; role: string }[] = [
      { name: "00-lisez-moi.md", role: "Index, métadonnées, liste des fichiers" },
      { name: "01-rapport.md", role: "Rapport principal (markdown généré dans l'app)" },
      { name: "02-profil.md", role: "Profil utilisateur (JSON)" },
      { name: "03-deep-dive-70-questions.md", role: "Quiz 70 — chaque question, options, pondérations, réponse" },
      { name: "04-deep-dive-70-scores.md", role: "Quiz 70 — agrégation / interprétation par archétype" },
      { name: "05-quiz-30-sessions.md", role: "Quiz 30 — sessions, réponses détaillées, scores par session" },
      { name: "06-snapshots-analyses-recommandations.md", role: "Snapshots, analysis_results, recommendation_tools" },
      { name: "07-dump-complet.json", role: "Dump JSON unique (toutes les tables exportées)" },
    ];

    const pieces: { name: string; body: string; mimeType: string }[] = [
      {
        name: "00-lisez-moi.md",
        body: renderReadmeIndexMd({
          metaComment,
          generatedAt: generatedAtIso,
          clientName,
          bundleRelPath,
          files: manifest,
        }),
        mimeType: "text/markdown",
      },
      { name: "01-rapport.md", body: metaComment + content.trim(), mimeType: "text/markdown" },
      { name: "02-profil.md", body: metaComment + renderProfileMd(fullData, generatedAtIso), mimeType: "text/markdown" },
      {
        name: "03-deep-dive-70-questions.md",
        body: metaComment + renderDeepDive70QuestionsMd(fullData, computed, generatedAtIso),
        mimeType: "text/markdown",
      },
      {
        name: "04-deep-dive-70-scores.md",
        body: metaComment + renderDeepDive70ScoresMd(computed, generatedAtIso),
        mimeType: "text/markdown",
      },
      { name: "05-quiz-30-sessions.md", body: metaComment + renderQuiz30SessionsMd(fullData, generatedAtIso), mimeType: "text/markdown" },
      {
        name: "06-snapshots-analyses-recommandations.md",
        body: metaComment + renderSnapshotsAnalysesMd(fullData, generatedAtIso),
        mimeType: "text/markdown",
      },
      { name: "07-dump-complet.json", body: JSON.stringify(fullData, null, 2), mimeType: "application/json" },
    ];

    const uploadedList: { id: string; name: string; webViewLink: string | null; path: string }[] = [];
    for (const p of pieces) {
      const up = await uploadFile(bundleFolderId, p.name, p.body, p.mimeType);
      uploadedList.push({
        id: up.id,
        name: up.name,
        webViewLink: up.webViewLink,
        path: `${bundleRelPath}/${p.name}`,
      });
    }

    const primary = uploadedList[1] ?? uploadedList[0];
    return new Response(
      JSON.stringify({
        success: true,
        exportType,
        bundleFolder: bundleName,
        fileId: primary.id,
        fileName: primary.name,
        webViewLink: primary.webViewLink,
        path: bundleRelPath,
        files: uploadedList,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("export-deep-dive-v2-to-drive error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

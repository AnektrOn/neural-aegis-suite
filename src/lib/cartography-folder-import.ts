import type { AnalysisMode, ArchetypePole } from "@/lib/archetype-cartography/types";
import { sanitizeCartographyMarkdown } from "@/lib/cartography-document-parse";

export type CartographySectionKey = "cartographie" | "guardians" | "synthesis" | "detailed";

export interface CartographyManifest {
  user_id?: string;
  publish?: boolean;
  meta?: {
    title?: string;
    subtitle?: string;
    user_label?: string;
    user_value?: string;
    date?: string;
    stage?: string;
    pole_label?: string;
  };
}

export interface ParsedCartographyFile {
  relativePath: string;
  pole: ArchetypePole;
  mode: AnalysisMode;
  sectionKey: CartographySectionKey;
  reportCode: string;
  title: string | null;
  markdown: string;
  sortOrder: number;
}

export interface FolderImportPreview {
  manifest: CartographyManifest | null;
  files: ParsedCartographyFile[];
  issues: Array<{ path: string; message: string }>;
  bundleKeys: string[];
  /** true si import format Myss/2026-05/… détecté */
  myssLayout: boolean;
  /** true si import format HIGH_RES_ANALYSIS/… détecté (mode clinique) */
  highResLayout: boolean;
  skippedOutsideMyss: number;
}

export interface CartographyImportDefaults {
  pole?: ArchetypePole;
  mode?: AnalysisMode;
}

const POLE_ALIASES: Record<string, ArchetypePole> = {
  balance: "balance",
  lumiere: "light",
  lumière: "light",
  light: "light",
  ombre: "shadow",
  shadow: "shadow",
};

const MODE_ALIASES: Record<string, AnalysisMode> = {
  analyse: "analyse",
  analysis: "analyse",
  clinique: "clinique",
  clinical: "clinique",
};

const SKIP_PATH_PARTS = new Set([
  "__macosx",
  ".ds_store",
  "node_modules",
  "promptnotebooklm",
  "notebooklm",
]);

function normalizePathSegment(seg: string): string {
  return seg
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function shouldSkipCartographyPath(rel: string): boolean {
  const lower = normalizePath(rel);
  if (lower.includes("notebooklm")) return true;
  const name = basename(lower);
  if (/^prompt[-_]?video/i.test(name)) return true;
  if (/^prompt[-_]/i.test(name) && /overview|notebook/i.test(name)) return true;
  const segments = lower.split("/");
  return segments.some((s) => SKIP_PATH_PARTS.has(normalizePathSegment(s)));
}
const MYSS_SEGMENT = /(^|\/)myss(\/|$)/i;
/** Parent folders: high-res/, 03_HIGH_RES_ANALYSIS/, HIGH_RES_ANALYSIS/, etc. */
const HIGH_RES_PARENT_SEGMENT = /(^|\/)(\d+[-_])?high[-_]?res([-_]analysis)?(\/|$)/i;
/** Ancien dossier clinique — ignoré au profit de high-res */
const ECHOLS_SEGMENT = /(^|\/)echols(\/|$)/i;
/** Parent "analysis/" au-dessus de Myss/ → analyse explicite */
const ANALYSIS_PARENT_SEGMENT = /(^|\/)analysis(\/|$)/i;

const FLAT_FILE_RE =
  /^(balance|lumiere|lumière|light|ombre|shadow)[-_.](analyse|analysis|clinique|clinical)[-_.](.+)\.md$/i;

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function basename(path: string): string {
  const parts = normalizePath(path).split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

export function isUnderMyss(rel: string): boolean {
  return MYSS_SEGMENT.test(normalizePath(rel));
}

/** high-res/Myss/… ou HIGH_RES_ANALYSIS/… */
export function isUnderHighRes(rel: string): boolean {
  return HIGH_RES_PARENT_SEGMENT.test(normalizePath(rel));
}

/** analysis/Myss/… */
function isUnderAnalysisParent(rel: string): boolean {
  return ANALYSIS_PARENT_SEGMENT.test(normalizePath(rel));
}

function isUnderAllowedPoleFolder(rel: string): boolean {
  return isUnderMyss(rel) || isUnderHighRes(rel);
}

function isUnderEchols(rel: string): boolean {
  return ECHOLS_SEGMENT.test(normalizePath(rel));
}

/**
 * Priorité :
 * 1. Mode explicite (sélecteur admin)
 * 2. Parent high-res/ → clinique
 * 3. Parent analysis/ → analyse
 * 4. Myss seul → analyse
 */
export function resolveModeFromImportPath(
  rel: string,
  defaults?: CartographyImportDefaults,
): AnalysisMode {
  if (defaults?.mode) return defaults.mode;
  if (isUnderHighRes(rel)) return "clinique";
  if (isUnderAnalysisParent(rel)) return "analyse";
  if (isUnderMyss(rel)) return "analyse";
  return "analyse";
}

function parsePoleSegment(seg: string): ArchetypePole | null {
  const key = seg
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return POLE_ALIASES[key] ?? null;
}

/** Dossiers ⚖️ BALANCE, 🌑 SHADOW, 🌕 LIGHT, etc. */
function parsePoleFromFolderSegment(seg: string): ArchetypePole | null {
  const n = seg
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (n.includes("balance")) return "balance";
  if (n.includes("shadow") || n.includes("ombre")) return "shadow";
  if (n.includes("light") || n.includes("lumiere")) return "light";
  return parsePoleSegment(n);
}

/** Suffixe ·BALANCE.md dans le nom de fichier */
function parsePoleFromFilename(name: string): ArchetypePole | null {
  const upper = name.toUpperCase();
  if (/[·.\-_]BALANCE\b/.test(upper) || upper.endsWith("BALANCE")) return "balance";
  if (/[·.\-_]SHADOW\b/.test(upper) || upper.endsWith("SHADOW")) return "shadow";
  if (/[·.\-_]LIGHT\b/.test(upper) || upper.endsWith("LIGHT")) return "light";
  return null;
}

function parseModeSegment(seg: string): AnalysisMode | null {
  return MODE_ALIASES[seg.toLowerCase()] ?? null;
}

function extractPeriodFromPath(rel: string): string | null {
  const m = normalizePath(rel).match(/\/(20\d{2}-\d{2})\//);
  return m?.[1] ?? null;
}

/** Fichiers Myss : 00-Cartographie…, GLOBAL-MYSS…, P01·ARC… */
function classifyMyssFilename(filename: string): {
  sectionKey: CartographySectionKey;
  reportCode: string;
  sortOrder: number;
} {
  const base = filename.replace(/\.md$/i, "");
  const upper = base.toUpperCase();

  if (/^00[-·.]?CARTOGRAPHIE/i.test(base) || /CARTOGRAPHIE_INTEGRALE/i.test(upper)) {
    return { sectionKey: "cartographie", reportCode: "", sortOrder: 10 };
  }
  if (/GLOBAL[-·.]?MYSS/i.test(upper) || /^GLOBAL[-·.]?MYSS/i.test(base)) {
    return { sectionKey: "synthesis", reportCode: "", sortOrder: 30 };
  }

  const pMatch = base.match(/^P0?([1-5])\b/i);
  if (pMatch) {
    const n = pMatch[1];
    return {
      sectionKey: "detailed",
      reportCode: `p0${n}`,
      sortOrder: 100 + Number(n),
    };
  }

  return classifyMarkdownFilename(filename);
}

/** Fichiers HIGH_RES_ANALYSIS : P01·RES·…, GLOBAL-ECHOLS / HIGH-RES… */
function classifyClinicalFilename(filename: string): {
  sectionKey: CartographySectionKey;
  reportCode: string;
  sortOrder: number;
} {
  const base = filename.replace(/\.md$/i, "");
  const upper = base.toUpperCase();

  if (/^00[-·.]?CARTOGRAPHIE/i.test(base) || /CARTOGRAPHIE_INTEGRALE/i.test(upper)) {
    return { sectionKey: "cartographie", reportCode: "", sortOrder: 10 };
  }
  if (
    /GLOBAL[-·.]?(ECHOLS|HIGH[-·_]?RES|CLINICAL|RES)/i.test(upper) ||
    /^GLOBAL[-·.]/i.test(base)
  ) {
    return { sectionKey: "synthesis", reportCode: "", sortOrder: 30 };
  }

  const pMatch = base.match(/^P0?([1-5])\b/i);
  if (pMatch) {
    const n = pMatch[1];
    return {
      sectionKey: "detailed",
      reportCode: `p0${n}`,
      sortOrder: 100 + Number(n),
    };
  }

  return classifyMarkdownFilename(filename);
}

function classifyPoleFolderFilename(filename: string, mode: AnalysisMode): {
  sectionKey: CartographySectionKey;
  reportCode: string;
  sortOrder: number;
} {
  return mode === "clinique"
    ? classifyClinicalFilename(filename)
    : classifyMyssFilename(filename);
}

export function classifyMarkdownFilename(filename: string): {
  sectionKey: CartographySectionKey;
  reportCode: string;
  sortOrder: number;
} {
  const base = filename.replace(/\.md$/i, "").toLowerCase();

  if (/cartographie|maisons|12-maisons|matrice/.test(base)) {
    return { sectionKey: "cartographie", reportCode: "", sortOrder: 10 };
  }
  if (/gardiens|guardians|4-gardiens/.test(base)) {
    return { sectionKey: "guardians", reportCode: "", sortOrder: 20 };
  }
  if (/synthesis|synthese|global|overview/.test(base)) {
    return { sectionKey: "synthesis", reportCode: "", sortOrder: 30 };
  }

  const pMatch = base.match(/^p0?([1-5])(?:[-_.·].*)?$/i);
  if (pMatch) {
    const n = pMatch[1];
    return {
      sectionKey: "detailed",
      reportCode: `p0${n}`,
      sortOrder: 100 + Number(n),
    };
  }

  return { sectionKey: "synthesis", reportCode: "", sortOrder: 50 };
}

function titleFromMarkdown(md: string, fallback: string): string | null {
  const cleaned = sanitizeCartographyMarkdown(md);
  const m = cleaned.match(/^#\s+(.+)$/m) ?? cleaned.match(/^([⚖️🌑🌕]?\s*[^\n#]{8,})/m);
  return m?.[1]?.trim() ?? fallback;
}

function prepareImportMarkdown(content: string): string {
  return sanitizeCartographyMarkdown(content);
}

function parsePoleFolderMarkdownEntry(
  rel: string,
  content: string,
  defaults?: CartographyImportDefaults,
): ParsedCartographyFile | null {
  const parts = normalizePath(rel).split("/").filter(Boolean);
  const name = basename(rel);

  let pole: ArchetypePole | null = null;
  for (const seg of parts) {
    const p = parsePoleFromFolderSegment(seg);
    if (p) {
      pole = p;
      break;
    }
  }
  if (!pole) pole = parsePoleFromFilename(name);
  if (!pole && defaults?.pole) pole = defaults.pole;
  if (!pole) return null;

  const mode = resolveModeFromImportPath(rel, defaults);
  const { sectionKey, reportCode, sortOrder } = classifyPoleFolderFilename(name, mode);

  return {
    relativePath: rel,
    pole,
    mode,
    sectionKey,
    reportCode,
    title: titleFromMarkdown(content, name),
    markdown: prepareImportMarkdown(content),
    sortOrder,
  };
}

function parseFlatFilename(
  name: string,
): { pole: ArchetypePole; mode: AnalysisMode; sectionPart: string } | null {
  const m = name.match(FLAT_FILE_RE);
  if (!m) return null;
  const pole = parsePoleSegment(m[1]);
  const mode = parseModeSegment(m[2]);
  if (!pole || !mode) return null;
  return { pole, mode, sectionPart: m[3] };
}

function parseLegacyMarkdownEntry(
  rel: string,
  content: string,
  defaults?: CartographyImportDefaults,
): ParsedCartographyFile | null {
  const name = basename(rel);
  const flat = parseFlatFilename(name);
  if (flat) {
    const { sectionKey, reportCode, sortOrder } = classifyMarkdownFilename(
      `${flat.sectionPart}.md`,
    );
    return {
      relativePath: rel,
      pole: flat.pole,
      mode: flat.mode,
      sectionKey,
      reportCode,
      title: titleFromMarkdown(content, name),
      markdown: prepareImportMarkdown(content),
      sortOrder,
    };
  }

  const parts = normalizePath(rel).split("/").filter(Boolean);
  let pole: ArchetypePole | null = null;
  let mode: AnalysisMode | null = null;
  let sectionName = name;

  if (parts.length >= 3) {
    pole = parsePoleSegment(parts[0]) ?? parsePoleFromFolderSegment(parts[0]);
    mode = parseModeSegment(parts[1]);
    sectionName = parts[parts.length - 1];
  }

  if ((!pole || !mode) && defaults?.pole && defaults?.mode) {
    pole = defaults.pole;
    mode = defaults.mode;
  }

  if (!pole || !mode) return null;

  const { sectionKey, reportCode, sortOrder } = classifyMarkdownFilename(sectionName);
  return {
    relativePath: rel,
    pole,
    mode,
    sectionKey,
    reportCode,
    title: titleFromMarkdown(content, sectionName),
    markdown: prepareImportMarkdown(content),
    sortOrder,
  };
}

function parseMarkdownEntry(
  rel: string,
  content: string,
  defaults: CartographyImportDefaults | undefined,
  poleFolderLayout: boolean,
): ParsedCartographyFile | null {
  if (poleFolderLayout || isUnderAllowedPoleFolder(rel) || defaults?.mode) {
    const result = parsePoleFolderMarkdownEntry(rel, content, defaults);
    if (result) return result;
  }
  return parseLegacyMarkdownEntry(rel, content, defaults);
}

export function parseManifestJson(text: string): { manifest: CartographyManifest | null; error?: string } {
  try {
    const raw = JSON.parse(text) as CartographyManifest;
    if (raw.user_id && typeof raw.user_id === "string") {
      return { manifest: raw };
    }
    return { manifest: null, error: "manifest.json : user_id manquant." };
  } catch {
    return { manifest: null, error: "manifest.json invalide." };
  }
}

function buildMyssMetaHint(files: ParsedCartographyFile[]): Partial<CartographyManifest["meta"]> {
  const period = files.map((f) => extractPeriodFromPath(f.relativePath)).find(Boolean);
  return {
    title: "Cartographie Archétypale Intégrale",
    subtitle: period ? `Myss · ${period}` : "Myss · Analyse",
    user_label: "Utilisateur",
    stage: "Blueprint Alchimique (Synthèse)",
  };
}

function buildHighResMetaHint(files: ParsedCartographyFile[]): Partial<CartographyManifest["meta"]> {
  const period = files.map((f) => extractPeriodFromPath(f.relativePath)).find(Boolean);
  return {
    title: "Cartographie Archétypale Intégrale",
    subtitle: period ? `HIGH_RES_ANALYSIS · ${period}` : "HIGH_RES_ANALYSIS · Clinique",
    user_label: "Utilisateur",
    stage: "Analyse clinique haute résolution",
  };
}

function extractUserHintFromFilenames(files: ParsedCartographyFile[]): string | undefined {
  for (const f of files) {
    const name = basename(f.relativePath);
    const globalMyss = name.match(/GLOBAL-MYSS-ANALYSE-([^·.]+)/i)?.[1];
    if (globalMyss) return globalMyss;
    const globalClinical = name.match(/GLOBAL[-·.]?(?:ECHOLS|HIGH[-·_]?RES)[-·.]?([^·.]+)/i)?.[1];
    if (globalClinical) return globalClinical;
    const pRes = name.match(/^P0?\d[-·.]?RES[-·.](?:ECHOLS|HIGH[-·_]?RES)?[-·.]?([^·.]+)/i)?.[1];
    if (pRes) return pRes;
  }
  return undefined;
}

export function previewCartographyFolder(
  entries: Array<{ path: string; content: string }>,
  defaults?: CartographyImportDefaults,
): FolderImportPreview {
  const issues: FolderImportPreview["issues"] = [];
  const files: ParsedCartographyFile[] = [];
  let manifest: CartographyManifest | null = null;
  let skippedOutsideMyss = 0;

  const hasMyssFiles = entries.some((e) => isUnderMyss(e.path));
  const hasHighResFiles = entries.some((e) => isUnderHighRes(e.path));
  const myssLayout = hasMyssFiles;
  const highResLayout = hasHighResFiles;
  const poleFolderLayout = myssLayout || highResLayout;
  const hasExplicitMode = Boolean(defaults?.mode);

  for (const entry of entries) {
    const rel = normalizePath(entry.path);
    const lower = rel.toLowerCase();
    if (shouldSkipCartographyPath(rel)) continue;
    if (lower.includes("/__macosx/") || lower.endsWith(".ds_store")) continue;

    if (isUnderEchols(rel)) continue;

    if (poleFolderLayout && !hasExplicitMode && !isUnderAllowedPoleFolder(rel)) {
      if (lower.endsWith(".md")) skippedOutsideMyss++;
      continue;
    }

    if (lower === "manifest.json" || lower.endsWith("/manifest.json")) {
      const { manifest: m, error } = parseManifestJson(entry.content);
      if (error) issues.push({ path: rel, message: error });
      else manifest = m;
      continue;
    }

    if (!lower.endsWith(".md")) continue;

    const parsed = parseMarkdownEntry(rel, entry.content, defaults, poleFolderLayout);
    if (parsed) {
      files.push(parsed);
    } else if (!poleFolderLayout) {
      issues.push({
        path: rel,
        message: `Non reconnu (essayez Myss/… ou HIGH_RES_ANALYSIS/…/BALANCE/fichier.md)`,
      });
    }
  }

  if (files.length === 0 && !manifest) {
    issues.push({
      path: "(import)",
      message: defaults?.mode
        ? `Aucun .md reconnu pour le mode ${defaults.mode}. Vérifiez que le dossier contient ⚖️ BALANCE/, 🌑 SHADOW/ ou 🌕 LIGHT/ avec des fichiers .md`
        : poleFolderLayout
          ? "Aucun .md sous Myss/ ou HIGH_RES_ANALYSIS/. Vérifiez Myss/2026-05/⚖️ BALANCE/… ou HIGH_RES_ANALYSIS/…"
          : "Aucun fichier reconnu. Déposez Myss (analyse) et/ou HIGH_RES_ANALYSIS (clinique), ou balance-analyse-cartographie.md",
    });
  }

  if ((poleFolderLayout || hasExplicitMode) && files.length > 0 && !manifest) {
    const period = extractPeriodFromPath(files[0].relativePath);
    const userHint = extractUserHintFromFilenames(files);
    const hasClinical = files.some((f) => f.mode === "clinique");
    const hasAnalyse = files.some((f) => f.mode === "analyse");
    const metaHint =
      hasClinical && !hasAnalyse
        ? buildHighResMetaHint(files)
        : hasAnalyse && !hasClinical
          ? buildMyssMetaHint(files)
          : {
              ...buildMyssMetaHint(files),
              subtitle: period
                ? `Myss + HIGH_RES · ${period}`
                : "Myss · Analyse + HIGH_RES_ANALYSIS · Clinique",
            };
    manifest = {
      meta: {
        ...metaHint,
        date: period ? `${period}-01` : undefined,
        user_value: userHint,
      },
    } as CartographyManifest;
  }

  const bundleKeys = [...new Set(files.map((f) => `${f.pole}-${f.mode}`))];
  return { manifest, files, issues, bundleKeys, myssLayout, highResLayout, skippedOutsideMyss };
}

export async function readFolderFromFileList(
  fileList: FileList,
): Promise<Array<{ path: string; content: string }>> {
  const entries: Array<{ path: string; content: string }> = [];
  await Promise.all(
    Array.from(fileList).map(async (file) => {
      const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      entries.push({ path, content: await file.text() });
    }),
  );
  return entries;
}

export async function readZipFile(zipFile: File): Promise<Array<{ path: string; content: string }>> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(zipFile);
  const entries: Array<{ path: string; content: string }> = [];
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  await Promise.all(
    names.map(async (name) => {
      const normalized = normalizePath(name);
      if (!normalized.endsWith(".md") && !normalized.endsWith("manifest.json")) return;
      entries.push({ path: normalized, content: await zip.files[name].async("string") });
    }),
  );
  return entries;
}

export function suggestedFilenames(pole: ArchetypePole, mode: AnalysisMode): string[] {
  const p = pole === "light" ? "lumiere" : pole === "shadow" ? "ombre" : "balance";
  return [
    `${p}-${mode}-cartographie.md`,
    `${p}-${mode}-synthesis.md`,
    `${p}-${mode}-p01.md`,
    `${p}-${mode}-p02.md`,
    `${p}-${mode}-p03.md`,
    `${p}-${mode}-p04.md`,
    `${p}-${mode}-p05.md`,
  ];
}

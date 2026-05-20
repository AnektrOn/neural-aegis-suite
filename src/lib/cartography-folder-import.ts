import type { AnalysisMode, ArchetypePole } from "@/lib/archetype-cartography/types";

export type CartographySectionKey = "cartographie" | "guardians" | "synthesis" | "detailed";

export interface CartographyManifest {
  user_id: string;
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

const SKIP_PATH_PARTS = new Set(["__macosx", ".ds_store", "node_modules"]);
const MYSS_SEGMENT = /(^|\/)myss(\/|$)/i;
const ECHOLS_SEGMENT = /(^|\/)echols(\/|$)/i;

const FLAT_FILE_RE =
  /^(balance|lumiere|lumière|light|ombre|shadow)[-_.](analyse|analysis|clinique|clinical)[-_.](.+)\.md$/i;

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function basename(path: string): string {
  const parts = normalizePath(path).split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

function isUnderMyss(rel: string): boolean {
  return MYSS_SEGMENT.test(normalizePath(rel));
}

function isUnderEchols(rel: string): boolean {
  return ECHOLS_SEGMENT.test(normalizePath(rel));
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
  if (/GLOBAL[-·.]?MYSS/i.test(upper) || /^GLOBAL[-·.]/i.test(base)) {
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
  const m = md.match(/^#\s+(.+)$/m);
  return m?.[1]?.trim() ?? fallback;
}

function parseMyssMarkdownEntry(
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

  const mode: AnalysisMode = defaults?.mode ?? "analyse";
  const { sectionKey, reportCode, sortOrder } = classifyMyssFilename(name);

  return {
    relativePath: rel,
    pole,
    mode,
    sectionKey,
    reportCode,
    title: titleFromMarkdown(content, name),
    markdown: content.trim(),
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
      markdown: content.trim(),
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
    markdown: content.trim(),
    sortOrder,
  };
}

function parseMarkdownEntry(
  rel: string,
  content: string,
  defaults: CartographyImportDefaults | undefined,
  myssOnly: boolean,
): ParsedCartographyFile | null {
  if (myssOnly || isUnderMyss(rel)) {
    if (!isUnderMyss(rel)) return null;
    return parseMyssMarkdownEntry(rel, content, defaults);
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

export function previewCartographyFolder(
  entries: Array<{ path: string; content: string }>,
  defaults?: CartographyImportDefaults,
): FolderImportPreview {
  const issues: FolderImportPreview["issues"] = [];
  const files: ParsedCartographyFile[] = [];
  let manifest: CartographyManifest | null = null;
  let skippedOutsideMyss = 0;

  const hasMyssFiles = entries.some((e) => isUnderMyss(e.path));
  const myssLayout = hasMyssFiles;

  for (const entry of entries) {
    const rel = normalizePath(entry.path);
    const lower = rel.toLowerCase();
    if (SKIP_PATH_PARTS.has(lower.split("/")[0]?.toLowerCase() ?? "")) continue;
    if (lower.includes("/__macosx/") || lower.endsWith(".ds_store")) continue;

    if (isUnderEchols(rel)) continue;

    if (myssLayout && !isUnderMyss(rel)) {
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

    const parsed = parseMarkdownEntry(rel, entry.content, defaults, myssLayout);
    if (parsed) {
      files.push(parsed);
    } else if (!myssLayout) {
      issues.push({
        path: rel,
        message: `Non reconnu (essayez le format Myss/…/BALANCE/fichier.md)`,
      });
    }
  }

  if (files.length === 0 && !manifest) {
    issues.push({
      path: "(import)",
      message: myssLayout
        ? "Aucun .md sous Myss/. Vérifiez que le zip contient Myss/2026-05/⚖️ BALANCE/…"
        : "Aucun fichier reconnu. Déposez le dossier Myss tel quel, ou utilisez balance-analyse-cartographie.md",
    });
  }

  if (myssLayout && files.length > 0 && !manifest) {
    const period = extractPeriodFromPath(files[0].relativePath);
    manifest = {
      user_id: "",
      meta: {
        ...buildMyssMetaHint(files),
        date: period ? `${period}-01` : undefined,
      },
    };
  }

  const bundleKeys = [...new Set(files.map((f) => `${f.pole}-${f.mode}`))];
  return { manifest, files, issues, bundleKeys, myssLayout, skippedOutsideMyss };
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

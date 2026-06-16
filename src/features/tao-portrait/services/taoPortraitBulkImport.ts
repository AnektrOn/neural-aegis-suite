import JSZip from "jszip";
import type { PolePartId, WuXingPole } from "../domain/types";
import { mapTaoPortraitPath } from "../lib/taoPortraitPathMapper";
import { upsertTaoPortraitPart } from "./taoPortraitService";

export interface TaoBulkImportEntry {
  relativePath: string;
  pole: WuXingPole;
  partId: PolePartId;
  contentMd: string;
}

export interface TaoBulkImportPreview {
  entries: TaoBulkImportEntry[];
  skipped: Array<{ relativePath: string; reason: string }>;
}

function relativePathFromFile(file: File): string {
  const webkit = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return (webkit || file.name).replace(/\\/g, "/");
}

export async function buildTaoBulkImportPreview(files: File[]): Promise<TaoBulkImportPreview> {
  const entries: TaoBulkImportEntry[] = [];
  const skipped: TaoBulkImportPreview["skipped"] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const relativePath = relativePathFromFile(file);
    const { mapping, reason } = mapTaoPortraitPath(relativePath);

    if (!mapping) {
      skipped.push({ relativePath, reason: reason ?? "Non mappé" });
      continue;
    }

    const key = `${mapping.pole}:${mapping.partId}`;
    if (seen.has(key)) {
      skipped.push({ relativePath, reason: `Doublon pour ${key}` });
      continue;
    }

    const contentMd = await file.text();
    if (!contentMd.trim()) {
      skipped.push({ relativePath, reason: "Fichier vide" });
      continue;
    }

    seen.add(key);
    entries.push({
      relativePath,
      pole: mapping.pole,
      partId: mapping.partId,
      contentMd,
    });
  }

  return { entries, skipped };
}

export async function extractMdFilesFromZip(zipFile: File): Promise<File[]> {
  const zip = await JSZip.loadAsync(await zipFile.arrayBuffer());
  const files: File[] = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || !/\.md$/i.test(path)) continue;
    const content = await entry.async("string");
    const blob = new Blob([content], { type: "text/markdown" });
    const file = new File([blob], path.split("/").pop() ?? path, { type: "text/markdown" });
    Object.defineProperty(file, "webkitRelativePath", { value: path.replace(/\\/g, "/") });
    files.push(file);
  }

  return files;
}

export async function importTaoPortraitBundle(
  userId: string,
  entries: TaoBulkImportEntry[],
): Promise<{ saved: number; errors: string[] }> {
  let saved = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    try {
      await upsertTaoPortraitPart(userId, entry.pole, entry.partId, entry.contentMd);
      saved++;
    } catch (e) {
      errors.push(
        `${entry.relativePath}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  return { saved, errors };
}

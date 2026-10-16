import JSZip from "jszip";
import type { PrismTextureSlot, PrismTextureUrls } from "./prismMaterialConfig";
import {
  matchFileToMaterialXPath,
  parseMaterialX,
  type MaterialXParsed,
} from "./parseMaterialX";

export type MaterialXImportResult = {
  textures: PrismTextureUrls;
  parsed: MaterialXParsed;
  missing: string[];
};

function isImageFile(name: string): boolean {
  return /\.(png|jpe?g|webp|tif|tiff|exr|hdr)$/i.test(name);
}

function isMaterialXFile(name: string): boolean {
  return /\.(mtlx|materialx)$/i.test(name);
}

function mimeFromPath(path: string): string | undefined {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return undefined;
}

async function readMtlxText(file: File): Promise<string> {
  return await file.text();
}

function fileToObjectUrl(file: File | Blob): string {
  return URL.createObjectURL(file);
}

function resolvePathsFromFileList(
  parsed: MaterialXParsed,
  files: File[],
): MaterialXImportResult {
  const textures: PrismTextureUrls = {};
  const missing: string[] = [];

  const entries = Object.entries(parsed.texturePaths) as [
    PrismTextureSlot,
    string,
  ][];

  for (const [slot, refPath] of entries) {
    const match = files.find(
      (f) =>
        isImageFile(f.name) &&
        matchFileToMaterialXPath(refPath, f.webkitRelativePath || f.name),
    );
    if (match) {
      textures[slot] = fileToObjectUrl(match);
    } else {
      missing.push(refPath);
    }
  }

  return { textures, parsed, missing };
}

/** .mtlx + tous les fichiers du même dossier (input webkitdirectory ou multi-select). */
export async function loadMaterialXFromFileBundle(
  mtlxFile: File,
  siblingFiles: File[],
): Promise<MaterialXImportResult> {
  const xml = await readMtlxText(mtlxFile);
  const parsed = parseMaterialX(xml);
  const pool = siblingFiles.length > 0 ? siblingFiles : [mtlxFile];
  return resolvePathsFromFileList(parsed, pool);
}

/** Archive .zip contenant un .mtlx et les textures. */
export async function loadMaterialXFromZip(
  zipFile: File,
): Promise<MaterialXImportResult> {
  const zip = await JSZip.loadAsync(zipFile);
  const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);

  const mtlxPath = paths.find((p) => isMaterialXFile(p));
  if (!mtlxPath) {
    throw new Error("Aucun fichier .mtlx dans le zip");
  }

  const xml = await zip.file(mtlxPath)!.async("string");
  const parsed = parseMaterialX(xml);
  const textures: PrismTextureUrls = {};
  const missing: string[] = [];

  for (const [slot, refPath] of Object.entries(parsed.texturePaths) as [
    PrismTextureSlot,
    string,
  ][]) {
    const match = paths.find(
      (p) => isImageFile(p) && matchFileToMaterialXPath(refPath, p),
    );
    if (!match) {
      missing.push(refPath);
      continue;
    }
    const raw = await zip.file(match)!.async("blob");
    const mime = mimeFromPath(match);
    const blob = mime && raw.type !== mime ? new Blob([raw], { type: mime }) : raw;
    textures[slot] = URL.createObjectURL(blob);
  }

  return { textures, parsed, missing };
}

export async function loadMaterialXFromUserFile(
  file: File,
  siblingFiles?: File[],
): Promise<MaterialXImportResult> {
  if (/\.zip$/i.test(file.name)) {
    return loadMaterialXFromZip(file);
  }
  if (isMaterialXFile(file.name)) {
    return loadMaterialXFromFileBundle(file, siblingFiles ?? []);
  }
  throw new Error("Choisis un .mtlx ou un .zip MaterialX");
}

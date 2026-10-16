import type { PrismTextureSlot } from "./prismMaterialConfig";

export type MaterialXScalarHints = {
  roughness?: number;
  metalness?: number;
  baseColorHex?: string;
};

export type MaterialXTexturePaths = Partial<Record<PrismTextureSlot, string>>;

export type MaterialXParsed = {
  texturePaths: MaterialXTexturePaths;
  scalars: MaterialXScalarHints;
  /** Chemins référencés dans le MTLX mais non résolus (import zip/dossier). */
  unresolved: string[];
};

const INPUT_TO_SLOT: Record<string, PrismTextureSlot> = {
  base_color: "map",
  diffuse_color: "map",
  color: "map",
  normal: "normalMap",
  roughness: "roughnessMap",
  metalness: "metalnessMap",
  specular_roughness: "roughnessMap",
  occlusion: "aoMap",
};

function basename(path: string): string {
  const norm = path.replace(/\\/g, "/");
  return norm.split("/").pop() ?? path;
}

function slotFromFilename(path: string): PrismTextureSlot | null {
  const name = basename(path).toLowerCase();
  if (
    /base[_-]?color|albedo|diffuse|color\.|_col\.|_bc\./.test(name)
  ) {
    return "map";
  }
  if (/normal|_nrm|_n\./.test(name)) return "normalMap";
  if (/rough|rgh|_r\./.test(name)) return "roughnessMap";
  if (/metal|metallic|_m\./.test(name)) return "metalnessMap";
  if (/ao|occlusion|ambient/.test(name)) return "aoMap";
  return null;
}

function parseFloatInput(el: Element | null): number | undefined {
  if (!el) return undefined;
  const value = el.getAttribute("value");
  if (value == null) return undefined;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseColor3Hex(el: Element | null): string | undefined {
  if (!el) return undefined;
  const value = el.getAttribute("value");
  if (!value) return undefined;
  const parts = value.trim().split(/[\s,]+/).map(Number);
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return undefined;
  const [r, g, b] = parts.map((c) =>
    Math.round(Math.min(1, Math.max(0, c)) * 255),
  );
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Parse MaterialX (.mtlx) XML → slots Three.js (chemins fichiers relatifs).
 * Couvre standard_surface / open_pbr_surface + nœuds image usuels.
 */
export function parseMaterialX(xml: string): MaterialXParsed {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error("Fichier MTLX XML invalide");
  }

  const imagePathByNode = new Map<string, string>();
  for (const image of doc.querySelectorAll("image")) {
    const name = image.getAttribute("name");
    const fileInput = image.querySelector('input[name="file"]');
    const file =
      fileInput?.getAttribute("value") ??
      image.querySelector("filename")?.textContent?.trim();
    if (name && file) {
      imagePathByNode.set(name, file);
    }
  }

  const texturePaths: MaterialXTexturePaths = {};
  const unresolved: string[] = [];
  const scalars: MaterialXScalarHints = {};

  const surfaces = doc.querySelectorAll(
    'standard_surface, open_pbr_surface, ND_standard_surface_surfaceshader, surfaceshader',
  );

  const surface =
    surfaces.length > 0
      ? surfaces[0]
      : doc.querySelector('[type="surfaceshader"]');

  if (surface) {
    for (const input of surface.querySelectorAll(":scope > input")) {
      const inputName = input.getAttribute("name");
      if (!inputName) continue;

      const slot = INPUT_TO_SLOT[inputName];
      const nodename = input.getAttribute("nodename");

      if (inputName === "roughness" && !nodename) {
        const v = parseFloatInput(input);
        if (v !== undefined) scalars.roughness = v;
      }
      if (inputName === "metalness" && !nodename) {
        const v = parseFloatInput(input);
        if (v !== undefined) scalars.metalness = v;
      }
      if (
        (inputName === "base_color" || inputName === "diffuse_color") &&
        !nodename
      ) {
        const hex = parseColor3Hex(input);
        if (hex) scalars.baseColorHex = hex;
      }

      if (!slot || !nodename) continue;

      const path = resolveImagePath(nodename, imagePathByNode, doc);
      if (path) {
        texturePaths[slot] = path;
      } else {
        unresolved.push(nodename);
      }
    }
  }

  // Fallback: toutes les images du document, classées par nom de fichier
  if (Object.keys(texturePaths).length === 0) {
    for (const path of imagePathByNode.values()) {
      const slot = slotFromFilename(path);
      if (slot && !texturePaths[slot]) {
        texturePaths[slot] = path;
      }
    }
  }

  return { texturePaths, scalars, unresolved };
}

function resolveImagePath(
  nodename: string,
  imagePathByNode: Map<string, string>,
  doc: Document,
): string | undefined {
  if (imagePathByNode.has(nodename)) {
    return imagePathByNode.get(nodename);
  }

  const node = [...doc.querySelectorAll("[name]")].find(
    (el) => el.getAttribute("name") === nodename,
  );
  if (!node) return undefined;

  if (node.tagName.toLowerCase() === "image") {
    const fileInput = node.querySelector('input[name="file"]');
    return fileInput?.getAttribute("value") ?? undefined;
  }

  // texcoord → image chain (one hop)
  const fileChild = node.querySelector('input[name="file"]');
  if (fileChild?.getAttribute("value")) {
    return fileChild.getAttribute("value") ?? undefined;
  }

  const upstream = node.querySelector('input[nodename]');
  const upName = upstream?.getAttribute("nodename");
  if (upName) {
    return resolveImagePath(upName, imagePathByNode, doc);
  }

  return undefined;
}

export function normalizeMaterialXPath(refPath: string): string {
  return refPath.replace(/\\/g, "/").replace(/^\.\//, "");
}

export function matchFileToMaterialXPath(
  refPath: string,
  candidatePath: string,
): boolean {
  const ref = normalizeMaterialXPath(refPath);
  const cand = normalizeMaterialXPath(candidatePath);
  if (cand === ref) return true;
  if (cand.endsWith(`/${ref}`)) return true;
  return basename(cand) === basename(ref);
}

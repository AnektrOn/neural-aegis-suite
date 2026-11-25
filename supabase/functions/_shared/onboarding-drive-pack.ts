/**
 * Obsidian → Drive : dossier membre (username) + pack rapport à emplacement fixe
 * (ex. LEVEL_1/00_RAPPORT.md et fichiers voisins du même dossier).
 */

export type DriveMdFile = { id: string; name: string; relativePath: string };

const FOLDER_MIME = "application/vnd.google-apps.folder";
const REPORT_FILE = /^00[_-]?RAPPORT\.md$/i;

export type DriveListPage = {
  files?: { id: string; name: string; mimeType: string }[];
  nextPageToken?: string;
};

export type DriveListFn = (folderId: string, pageToken: string) => Promise<DriveListPage>;

/** Chemins relatifs typiques depuis la racine dossier user (si le pack n’est pas trouvé par scan). */
export const ONBOARDING_DRIVE_FIXED_RELATIVE_PATHS = [
  "LEVEL_1/00_RAPPORT.md",
  "LEVEL_0/00_RAPPORT.md",
  "Sacred_Archetypes/BALANCE/LEVEL_1/00_RAPPORT.md",
  "Sacred_Archetypes/LIGHT/LEVEL_1/00_RAPPORT.md",
  "Sacred_Archetypes/SHADOW/LEVEL_1/00_RAPPORT.md",
];

async function listAllInFolder(
  folderId: string,
  relativePrefix: string,
  listPage: DriveListFn,
): Promise<{ folders: { id: string; name: string; relativePath: string }[]; files: DriveMdFile[] }> {
  const folders: { id: string; name: string; relativePath: string }[] = [];
  const files: DriveMdFile[] = [];
  let token = "";
  do {
    const page = await listPage(folderId, token);
    for (const entry of page.files ?? []) {
      const rel = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
      if (entry.mimeType === FOLDER_MIME) {
        folders.push({ id: entry.id, name: entry.name, relativePath: rel });
      } else if (entry.name.toLowerCase().endsWith(".md")) {
        files.push({ id: entry.id, name: entry.name, relativePath: rel });
      }
    }
    token = page.nextPageToken ?? "";
  } while (token);
  return { folders, files };
}

/** Collecte tous les .md du dossier qui contient 00_RAPPORT.md (pack LEVEL_X). */
export async function discoverOnboardingLevelPack(
  userRootFolderId: string,
  listPage: DriveListFn,
  maxDepth = 6,
): Promise<DriveMdFile[]> {
  type Q = { folderId: string; relativePath: string; depth: number };
  const queue: Q[] = [{ folderId: userRootFolderId, relativePath: "", depth: 0 }];
  let reportParent: { folderId: string; relativePath: string } | null = null;

  while (queue.length && !reportParent) {
    const { folderId, relativePath, depth } = queue.shift()!;
    const { folders, files } = await listAllInFolder(folderId, relativePath, listPage);
    for (const f of files) {
      if (REPORT_FILE.test(f.name)) {
        reportParent = { folderId, relativePath };
        break;
      }
    }
    if (reportParent) break;
    if (depth >= maxDepth) continue;
    for (const child of folders) {
      queue.push({ folderId: child.id, relativePath: child.relativePath, depth: depth + 1 });
    }
  }

  if (!reportParent) return [];

  const pack = await listAllInFolder(reportParent.folderId, reportParent.relativePath, listPage);
  return pack.files;
}

/** Résout un fichier par segments de chemin depuis la racine user. */
export async function resolveDriveFileByRelativePath(
  userRootFolderId: string,
  relativePath: string,
  listPage: DriveListFn,
): Promise<DriveMdFile | null> {
  const segments = relativePath.split("/").filter(Boolean);
  if (!segments.length) return null;
  let parentId = userRootFolderId;
  let built = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isLast = i === segments.length - 1;
    const { folders, files } = await listAllInFolder(parentId, built, listPage);
    if (isLast) {
      const hit = files.find((f) => f.name === segment);
      return hit ?? null;
    }
    const next = folders.find((f) => f.name === segment);
    if (!next) return null;
    parentId = next.id;
    built = next.relativePath;
  }
  return null;
}

export async function collectOnboardingDriveMarkdown(
  userRootFolderId: string,
  listPage: DriveListFn,
): Promise<DriveMdFile[]> {
  const byId = new Map<string, DriveMdFile>();

  const pack = await discoverOnboardingLevelPack(userRootFolderId, listPage);
  for (const f of pack) byId.set(f.id, f);

  for (const rel of ONBOARDING_DRIVE_FIXED_RELATIVE_PATHS) {
    const hit = await resolveDriveFileByRelativePath(userRootFolderId, rel, listPage);
    if (hit) byId.set(hit.id, hit);
    if (hit && pack.length === 0) {
      const parentPath = rel.includes("/") ? rel.replace(/\/[^/]+$/, "") : "";
      const parentSegments = parentPath.split("/").filter(Boolean);
      if (parentSegments.length) {
        let parentId = userRootFolderId;
        let built = "";
        for (const seg of parentSegments) {
          const { folders } = await listAllInFolder(parentId, built, listPage);
          const next = folders.find((f) => f.name === seg);
          if (!next) break;
          parentId = next.id;
          built = next.relativePath;
        }
        const siblings = await listAllInFolder(parentId, built, listPage);
        for (const f of siblings.files) byId.set(f.id, f);
      }
    }
  }

  return [...byId.values()].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
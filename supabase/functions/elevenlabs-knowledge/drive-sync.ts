export type DriveEntry = { id: string; name: string; mimeType: string };
export type DrivePage = { files?: DriveEntry[]; nextPageToken?: string };
export type DriveFolder = DriveEntry & { parentId: string | null; relativePath: string };
export type DriveMarkdown = DriveEntry & { parentId: string; relativePath: string };

export async function collectDriveTree(
  rootId: string,
  rootName: string,
  listPage: (folderId: string, pageToken: string) => Promise<DrivePage>,
): Promise<{ folders: DriveFolder[]; files: DriveMarkdown[] }> {
  const folders: DriveFolder[] = [{ id: rootId, name: rootName, mimeType: "application/vnd.google-apps.folder", parentId: null, relativePath: "" }];
  const seen = new Set([rootId]);
  const files = new Map<string, DriveMarkdown>();
  for (let index = 0; index < folders.length; index++) {
    const folder = folders[index];
    let token = "";
    do {
      const page = await listPage(folder.id, token);
      for (const entry of page.files ?? []) {
        const relativePath = [folder.relativePath, entry.name].filter(Boolean).join("/");
        if (entry.mimeType === "application/vnd.google-apps.folder") {
          if (seen.has(entry.id)) continue;
          seen.add(entry.id);
          folders.push({ ...entry, parentId: folder.id, relativePath });
        } else if (entry.name.toLowerCase().endsWith(".md") || entry.mimeType === "text/markdown") {
          files.set(entry.id, { ...entry, parentId: folder.id, relativePath });
        }
      }
      token = page.nextPageToken ?? "";
    } while (token);
  }
  if (!files.size) throw new Error("Aucun fichier Markdown trouvé dans ce dossier ou ses sous-dossiers.");
  return { folders, files: [...files.values()] };
}

/** Mapping lookup is scoped to user, agent and Drive root by the caller. */
export async function ensureDriveFolder(
  folder: DriveFolder,
  lookup: (id: string) => Promise<string | null>,
  create: (name: string, parentId: string | null) => Promise<string>,
  save: (folder: DriveFolder, id: string) => Promise<void>,
): Promise<string> {
  const existing = await lookup(folder.id);
  if (existing) return existing;
  const parent = folder.parentId ? await lookup(folder.parentId) : null;
  if (folder.parentId && !parent) throw new Error(`Dossier parent non synchronisé : ${folder.relativePath}`);
  const id = await create(folder.name, parent);
  await save(folder, id);
  return id;
}

/** Walk only descendants of the selected user's folder, including every page. */
export async function collectDriveMarkdown(
  rootId: string,
  listPage: (folderId: string, pageToken: string) => Promise<DrivePage>,
): Promise<DriveEntry[]> {
  const folders = [rootId];
  const visited = new Set<string>();
  const files = new Map<string, DriveEntry>();
  for (let index = 0; index < folders.length; index++) {
    const folderId = folders[index];
    if (visited.has(folderId)) continue;
    visited.add(folderId);
    let pageToken = "";
    do {
      const page = await listPage(folderId, pageToken);
      for (const file of page.files ?? []) {
        if (file.mimeType === "application/vnd.google-apps.folder") folders.push(file.id);
        else if (file.name.toLowerCase().endsWith(".md") || file.mimeType === "text/markdown") files.set(file.id, file);
      }
      pageToken = page.nextPageToken ?? "";
    } while (pageToken);
  }
  if (!files.size) throw new Error("Aucun fichier Markdown trouvé dans ce dossier ou ses sous-dossiers.");
  return [...files.values()];
}
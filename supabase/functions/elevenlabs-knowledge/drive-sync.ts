export type DriveEntry = { id: string; name: string; mimeType: string };
export type DrivePage = { files?: DriveEntry[]; nextPageToken?: string };

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
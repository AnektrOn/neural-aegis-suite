import { describe, expect, it } from "vitest";
import { collectDriveMarkdown, collectDriveTree, ensureDriveFolder, type DrivePage } from "../../supabase/functions/elevenlabs-knowledge/drive-sync";

describe("ElevenLabs personal Drive traversal", () => {
  it("preserves the common folder nomenclature, empty folders and distinct paths for identical filenames", async () => {
    const pages: Record<string, DrivePage> = {
      root: { files: [
        { id: "raw", name: "01_RAW", mimeType: "application/vnd.google-apps.folder" },
        { id: "empty", name: "05_OUTPUTS", mimeType: "application/vnd.google-apps.folder" },
        { id: "quiz", name: "QUIZ", mimeType: "application/vnd.google-apps.folder" },
      ] },
      raw: { files: [{ id: "a", name: "2605.md", mimeType: "text/markdown" }] },
      quiz: { files: [{ id: "b", name: "2605.md", mimeType: "text/markdown" }] }, empty: { files: [] },
    };
    const tree = await collectDriveTree("root", "note", async (id) => pages[id]);
    expect(tree.folders.map((f) => f.name)).toEqual(["note", "01_RAW", "05_OUTPUTS", "QUIZ"]);
    expect(tree.files.map((f) => f.relativePath)).toEqual(["01_RAW/2605.md", "QUIZ/2605.md"]);
    expect(tree.files.map((f) => f.parentId)).toEqual(["raw", "quiz"]);
  });
  it("reuses folders on repeated syncs and creates parents before children", async () => {
    const map = new Map<string, string>();
    const creations: [string, string | null][] = [];
    const create = async (name: string, parent: string | null) => { creations.push([name, parent]); return `el-${name}`; };
    const save = async (f: { id: string }, id: string) => { map.set(f.id, id); };
    const lookup = async (id: string) => map.get(id) ?? null;
    const root = { id: "root", name: "note", mimeType: "application/vnd.google-apps.folder", parentId: null, relativePath: "" };
    const child = { ...root, id: "raw", name: "01_RAW", parentId: "root", relativePath: "01_RAW" };
    await ensureDriveFolder(root, lookup, create, save);
    await ensureDriveFolder(child, lookup, create, save);
    await ensureDriveFolder(child, lookup, create, save);
    expect(creations).toEqual([["note", null], ["01_RAW", "el-note"]]);
    expect(map.get("raw")).toBe("el-01_RAW");
  });
  it("does not reuse another user's folders with the same nomenclature", async () => {
    const root = { id: "root", name: "note", mimeType: "application/vnd.google-apps.folder", parentId: null, relativePath: "" };
    const mappings = new Map<string, string>();
    for (const user of ["alice", "bob"]) {
      await ensureDriveFolder(root, async (id) => mappings.get(`${user}:${id}`) ?? null,
        async () => `el-${user}`, async (f, id) => { mappings.set(`${user}:${f.id}`, id); });
    }
    expect([...mappings.values()]).toEqual(["el-alice", "el-bob"]);
  });
  it("includes Markdown in nested folders without leaving the selected root", async () => {
    const visited: string[] = [];
    const pages: Record<string, DrivePage> = {
      note: { files: [{ id: "raw", name: "01_RAW", mimeType: "application/vnd.google-apps.folder" }] },
      raw: { files: [{ id: "digest", name: "_DIGEST_TIMELINE.md", mimeType: "text/markdown" }, { id: "deep", name: "03_DEEPDIVES", mimeType: "application/vnd.google-apps.folder" }] },
      deep: { files: [{ id: "report", name: "report.MD", mimeType: "text/plain" }, { id: "photo", name: "photo.jpg", mimeType: "image/jpeg" }] },
    };
    const result = await collectDriveMarkdown("note", async (folder) => { visited.push(folder); return pages[folder]; });
    expect(result.map((f) => f.id)).toEqual(["digest", "report"]);
    expect(visited).toEqual(["note", "raw", "deep"]);
  });
  it("processes every page and deduplicates folders and files", async () => {
    const result = await collectDriveMarkdown("root", async (_folder, token) => token
      ? { files: [{ id: "two", name: "two.md", mimeType: "text/markdown" }, { id: "one", name: "one.md", mimeType: "text/markdown" }] }
      : { nextPageToken: "next", files: [{ id: "one", name: "one.md", mimeType: "text/markdown" }, { id: "root", name: "root", mimeType: "application/vnd.google-apps.folder" }] });
    expect(result.map((f) => f.id)).toEqual(["one", "two"]);
  });
  it("rejects zero-document sync instead of reporting success", async () => {
    await expect(collectDriveMarkdown("empty", async () => ({ files: [] }))).rejects.toThrow("Aucun fichier Markdown");
  });
  it("propagates unreadable nested-folder errors", async () => {
    await expect(collectDriveMarkdown("root", async (folder) => {
      if (folder === "private") throw new Error("Drive 403: permission denied");
      return { files: [{ id: "private", name: "private", mimeType: "application/vnd.google-apps.folder" }] };
    })).rejects.toThrow("Drive 403: permission denied");
  });
});
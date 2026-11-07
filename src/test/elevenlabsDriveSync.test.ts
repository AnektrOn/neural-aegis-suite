import { describe, expect, it } from "vitest";
import { collectDriveMarkdown, type DrivePage } from "../../supabase/functions/elevenlabs-knowledge/drive-sync";

describe("ElevenLabs personal Drive traversal", () => {
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
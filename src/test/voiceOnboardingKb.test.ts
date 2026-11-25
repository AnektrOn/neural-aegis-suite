import { describe, expect, it } from "vitest";
import {
  discoverOnboardingLevelPack,
  type DriveListFn,
} from "../../supabase/functions/_shared/onboarding-drive-pack";
import { mergeOnboardingKnowledgeOverrides } from "@/features/logos/logosSessionInjection";

function mockDrive(tree: Record<string, { folders?: string[]; files?: string[] }>): DriveListFn {
  return async (folderId) => {
    const node = tree[folderId];
    const files = [
      ...(node?.files ?? []).map((name) => ({
        id: `file-${folderId}-${name}`,
        name,
        mimeType: "text/markdown",
      })),
      ...(node?.folders ?? []).map((name) => ({
        id: `folder-${folderId}-${name}`,
        name,
        mimeType: "application/vnd.google-apps.folder",
      })),
    ];
    return { files };
  };
}

describe("onboardingDrivePack", () => {
  it("collects all md in folder that contains 00_RAPPORT.md", async () => {
    const tree = {
      root: { folders: ["LEVEL_1"] },
      "folder-root-LEVEL_1": {
        files: ["00_RAPPORT.md", "01_RESUME.md", "notes.txt"],
      },
    };
    const files = await discoverOnboardingLevelPack("root", mockDrive(tree));
    expect(files.map((f) => f.name).sort()).toEqual(["00_RAPPORT.md", "01_RESUME.md"]);
    expect(files[0].relativePath).toContain("LEVEL_1");
  });
});

describe("voiceOnboardingKb overrides", () => {
  it("merges KB locators into session overrides", () => {
    const merged = mergeOnboardingKnowledgeOverrides(undefined, [
      { type: "folder", id: "fld_1", name: "Vault", usage_mode: "auto" },
    ]);
    expect(merged?.agent.prompt?.knowledge_base).toHaveLength(1);
    expect(merged?.agent.prompt?.knowledge_base?.[0].id).toBe("fld_1");
  });
});
import { userIsPlatformAdmin } from "./platform-admin.ts";

const DEFAULT_LAB_DRIVE_FOLDER_IDS = ["1Oa5e2i0nsz8E_l0jJsmjQMUGSkefSk3D"];

export function parseDriveFolderId(raw: string): string {
  const trimmed = raw.trim();
  const m = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  return (m?.[1] ?? trimmed) || "";
}

export function onboardingLabDriveFolderIds(): string[] {
  const fromEnv = Deno.env.get("ONBOARDING_LAB_DRIVE_FOLDER_IDS");
  const list = (fromEnv ? fromEnv.split(",") : DEFAULT_LAB_DRIVE_FOLDER_IDS)
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : DEFAULT_LAB_DRIVE_FOLDER_IDS;
}

export function isOnboardingLabDriveFolderId(folderId: string): boolean {
  const id = parseDriveFolderId(folderId);
  return id.length > 0 && onboardingLabDriveFolderIds().includes(id);
}

// deno-lint-ignore no-explicit-any
type Admin = any;

/** Membre : dossier lab autorisé. Sinon admin / superadmin. */
export async function mayUseOnboardingDriveOverride(
  admin: Admin,
  userId: string,
  folderId: string,
): Promise<boolean> {
  if (isOnboardingLabDriveFolderId(folderId)) return true;
  return userIsPlatformAdmin(admin, userId);
}
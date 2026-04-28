/**
 * DEPRECATED: The appendix module has been retired in favor of the unified
 * 30-question Aegis V1 onboarding assessment. The underlying tables were
 * dropped. These functions remain as no-ops so legacy callers don't crash
 * until the UI is fully removed.
 */
import type {
  AppendixCategoryWithQuestions,
  AppendixResponse,
} from "./types";

export async function loadAppendix(): Promise<AppendixCategoryWithQuestions[]> {
  return [];
}

export async function loadUserResponses(
  _userId: string
): Promise<Map<string, AppendixResponse>> {
  return new Map();
}

export async function upsertResponse(
  _userId: string,
  _response: AppendixResponse
): Promise<void> {
  // no-op
}

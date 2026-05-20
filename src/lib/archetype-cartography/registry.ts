import type { AnalysisMode, ArchetypePole, CartographyBundle } from "./types";
import { BALANCE_ANALYSE_DOCUMENT } from "./content/balance-analyse";

const DOCUMENTS: Partial<Record<string, CartographyBundle>> = {
  "balance-analyse": { available: true, document: BALANCE_ANALYSE_DOCUMENT },
};

export function cartographyKey(pole: ArchetypePole, mode: AnalysisMode): string {
  return `${pole}-${mode}`;
}

export function getCartographyBundle(
  pole: ArchetypePole,
  mode: AnalysisMode,
): CartographyBundle {
  return DOCUMENTS[cartographyKey(pole, mode)] ?? { available: false };
}

export function parsePoleParam(value: string | undefined): ArchetypePole | null {
  if (value === "balance") return "balance";
  if (value === "lumiere" || value === "light") return "light";
  if (value === "ombre" || value === "shadow") return "shadow";
  return null;
}

export function parseModeParam(value: string | undefined): AnalysisMode | null {
  if (!value || value === "analyse") return "analyse";
  if (value === "clinique" || value === "clinical") return "clinique";
  return null;
}

export function poleToPath(pole: ArchetypePole): string {
  return pole === "light" ? "lumiere" : pole === "shadow" ? "ombre" : "balance";
}

export function modeToPath(mode: AnalysisMode): string {
  return mode === "clinique" ? "clinique" : "analyse";
}

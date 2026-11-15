import type { ToolId } from "@/components/tools/toolsRegistry";
import { TOOLS_REGISTRY } from "@/components/tools/toolsRegistry";

export interface ToolSuggestion {
  toolId: ToolId;
  reason: string;
}

export function suggestNextTool(
  currentToolId: ToolId,
  outputs: Record<string, unknown>,
): ToolSuggestion | null {
  const index = outputs.index;
  const hours = outputs.hoursPerWeek;
  const clarity = outputs.clarity;
  const wasteScore =
    typeof outputs.wasteScore === "number"
      ? outputs.wasteScore
      : typeof outputs.cognitiveIndex === "number"
        ? outputs.cognitiveIndex
        : typeof outputs.wastePct === "number"
          ? outputs.wastePct
          : undefined;
  const monthlyTotal =
    typeof outputs.monthly === "number"
      ? outputs.monthly
      : typeof outputs.monthlyTotal === "number"
        ? outputs.monthlyTotal
        : undefined;

  if (currentToolId === "ceo-decision-fatigue-index" && typeof index === "number") {
    if (index > 55) {
      return {
        toolId: "executive-context-switching-calculator",
        reason: "Fatigue élevée — vérifiez si le context switching n'est pas le driver principal.",
      };
    }
    return {
      toolId: "decision-bias-reframe-tool",
      reason: "Anticiper les arbitrages difficiles avant la fin de journée.",
    };
  }

  if (currentToolId === "executive-context-switching-calculator" && typeof hours === "number") {
    if (hours >= 6) {
      return {
        toolId: "executive-saas-runrate-calculator",
        reason: "Beaucoup d'heures perdues — cartographiez si la fragmentation d'outils les amplifie.",
      };
    }
    return {
      toolId: "ceo-decision-fatigue-index",
      reason: "Mesurer l'impact de ces bascules sur votre fatigue en fin de journée.",
    };
  }

  if (currentToolId === "decision-bias-reframe-tool" && typeof clarity === "number") {
    if (clarity >= 65) {
      return {
        toolId: "founder-prioritization-matrix",
        reason: "Clarté retrouvée — valider que l'option choisie respecte votre cap stratégique.",
      };
    }
    return {
      toolId: "cost-of-delayed-decision-calculator",
      reason: "Quantifier le prix du report pendant que l'arbitrage reste flou.",
    };
  }

  if (currentToolId === "second-brain-waste-audit" && typeof wasteScore === "number" && wasteScore > 50) {
    return {
      toolId: "executive-saas-runrate-calculator",
      reason: "Notes mortes + abonnements dispersés = même douleur, deux lignes de facture.",
    };
  }

  if (currentToolId === "executive-saas-runrate-calculator" && typeof monthlyTotal === "number") {
    if (monthlyTotal > 400) {
      return {
        toolId: "cloud-ai-privacy-risk-checker",
        reason: "Stack coûteuse — vérifiez aussi où transitent vos données sensibles.",
      };
    }
    return {
      toolId: "second-brain-waste-audit",
      reason: "Auditer si ces outils produisent des décisions ou seulement des notes.",
    };
  }

  if (currentToolId === "cost-of-delayed-decision-calculator") {
    return {
      toolId: "decision-bias-reframe-tool",
      reason: "Lever les blocages intérieurs qui alimentent le report.",
    };
  }

  return null;
}

export function getToolPath(toolId: ToolId): string {
  return TOOLS_REGISTRY.find((t) => t.id === toolId)?.path ?? `/tools/${toolId}`;
}
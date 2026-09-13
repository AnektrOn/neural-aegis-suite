import type { QuantumNebulaFigure, QuantumNebulaState } from "@/components/ui/quantum-nebula";

export type BreathPhase = "breath_in" | "pause1" | "breath_out" | "pause2";

export function nebulaStateForBreathPhase(phase: BreathPhase, isRunning: boolean): QuantumNebulaState {
  if (!isRunning) return "repos";
  return phase === "breath_in" || phase === "breath_out" ? "mouvement" : "repos";
}

export function nebulaStateForVisualizationScene(sceneId: string): QuantumNebulaState {
  switch (sceneId) {
    case "place":
    case "scene":
      return "mouvement";
    case "success":
      return "reflexion";
    default:
      return "repos";
  }
}

export function nebulaFigureForVisualizationScene(sceneId: string): QuantumNebulaFigure | undefined {
  return sceneId === "success" ? "metatron" : undefined;
}

export function nebulaStateForStopStep(stepIndex: number): QuantumNebulaState {
  if (stepIndex <= 0) return "mouvement";
  if (stepIndex === 1) return "mouvement";
  if (stepIndex === 2) return "repos";
  return "reflexion";
}

export function nebulaStateForBodyScan(isRunning: boolean, zoneIndex: number): QuantumNebulaState {
  if (!isRunning) return "repos";
  return zoneIndex % 2 === 0 ? "mouvement" : "repos";
}

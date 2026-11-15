import type { ToolId } from "@/components/tools/toolsRegistry";

const SESSIONS_STORAGE_KEY = "aegis:tools:sessions:v1";
const MAX_SESSIONS = 80;

export interface ToolSession {
  toolId: ToolId;
  timestamp: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
}

export function loadToolSessions(): ToolSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ToolSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveToolSession(session: Omit<ToolSession, "timestamp"> & { timestamp?: string }): void {
  const full: ToolSession = {
    ...session,
    timestamp: session.timestamp ?? new Date().toISOString(),
  };
  try {
    const existing = loadToolSessions();
    const next = [full, ...existing.filter((s) => !(s.toolId === full.toolId && s.timestamp === full.timestamp))]
      .slice(0, MAX_SESSIONS);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getLatestSession(toolId: ToolId): ToolSession | null {
  const sessions = loadToolSessions().filter((s) => s.toolId === toolId);
  if (sessions.length === 0) return null;
  return sessions.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0] ?? null;
}

export interface CrossToolInsights {
  fatigueIndex?: number;
  contextSwitchHoursPerWeek?: number;
  biasClarity?: number;
  stackRunrateMonthly?: number;
  wasteScore?: number;
  delayCost?: number;
}

export function getCrossToolInsights(): CrossToolInsights {
  const sessions = loadToolSessions();
  const pick = (id: ToolId) =>
    sessions
      .filter((s) => s.toolId === id)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

  const fatigue = pick("ceo-decision-fatigue-index");
  const ctx = pick("executive-context-switching-calculator");
  const bias = pick("decision-bias-reframe-tool");
  const stack = pick("executive-saas-runrate-calculator");
  const waste = pick("second-brain-waste-audit");
  const delay = pick("cost-of-delayed-decision-calculator");

  return {
    fatigueIndex:
      typeof fatigue?.outputs.index === "number" ? fatigue.outputs.index : undefined,
    contextSwitchHoursPerWeek:
      typeof ctx?.outputs.hoursPerWeek === "number" ? ctx.outputs.hoursPerWeek : undefined,
    biasClarity: typeof bias?.outputs.clarity === "number" ? bias.outputs.clarity : undefined,
    stackRunrateMonthly:
      typeof stack?.outputs.monthly === "number"
        ? stack.outputs.monthly
        : typeof stack?.outputs.monthlyTotal === "number"
          ? stack.outputs.monthlyTotal
          : undefined,
    wasteScore:
      typeof waste?.outputs.cognitiveIndex === "number"
        ? waste.outputs.cognitiveIndex
        : typeof waste?.outputs.wastePct === "number"
          ? waste.outputs.wastePct
          : undefined,
    delayCost:
      typeof delay?.outputs.total === "number"
        ? delay.outputs.total
        : typeof delay?.outputs.totalCost === "number"
          ? delay.outputs.totalCost
          : undefined,
  };
}

export function getTimelineForTool(toolId: ToolId, limit = 6): ToolSession[] {
  return loadToolSessions()
    .filter((s) => s.toolId === toolId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-limit);
}
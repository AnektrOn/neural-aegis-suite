import type { BreathworkConfig } from "@/components/widgets/BreathworkWidget";
import { resolveBreathworkAlias } from "@/lib/toolbox-breath-alias";

const FALLBACK_BREATH: BreathworkConfig = {
  cycles: 4,
  breath_in_sec: 4,
  pause1_sec: 4,
  breath_out_sec: 6,
  pause2_sec: 2,
};

export function resolveMatterBreathConfig(
  slug: string,
  cfg: Record<string, unknown>,
): BreathworkConfig {
  const alias = resolveBreathworkAlias(slug, cfg);
  if (alias) return alias.config;
  const cycles = cfg.cycles;
  const breathIn = cfg.breath_in_sec;
  if (typeof cycles === "number" && typeof breathIn === "number") {
    return {
      cycles,
      breath_in_sec: breathIn,
      pause1_sec: typeof cfg.pause1_sec === "number" ? cfg.pause1_sec : 0,
      breath_out_sec: typeof cfg.breath_out_sec === "number" ? cfg.breath_out_sec : 4,
      pause2_sec: typeof cfg.pause2_sec === "number" ? cfg.pause2_sec : 0,
      instructions: typeof cfg.instructions === "string" ? cfg.instructions : undefined,
    };
  }
  return FALLBACK_BREATH;
}

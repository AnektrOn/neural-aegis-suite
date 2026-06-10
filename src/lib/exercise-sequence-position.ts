export interface SequenceSegment {
  id: string;
  durationSec: number;
}

export function resolveSequenceFromElapsed(
  elapsedSec: number,
  segments: SequenceSegment[],
): {
  index: number;
  phaseProgress: number;
  completedIds: Set<string>;
  completed: boolean;
} {
  if (segments.length === 0) {
    return { index: 0, phaseProgress: 0, completedIds: new Set(), completed: true };
  }

  let remaining = elapsedSec;
  for (let i = 0; i < segments.length; i++) {
    const dur = segments[i].durationSec;
    if (remaining < dur) {
      return {
        index: i,
        phaseProgress: dur > 0 ? remaining / dur : 0,
        completedIds: new Set(segments.slice(0, i).map((s) => s.id)),
        completed: false,
      };
    }
    remaining -= dur;
  }

  return {
    index: segments.length - 1,
    phaseProgress: 1,
    completedIds: new Set(segments.map((s) => s.id)),
    completed: true,
  };
}

export function resolveCyclicSequenceFromElapsed<T extends string>(
  elapsedSec: number,
  phases: { phase: T; durationSec: number }[],
  cycles: number,
): {
  cycle: number;
  phase: T;
  phaseProgress: number;
  completed: boolean;
} {
  if (phases.length === 0 || cycles <= 0) {
    return { cycle: 0, phase: phases[0]?.phase ?? ("" as T), phaseProgress: 0, completed: true };
  }

  const cycleTime = phases.reduce((sum, p) => sum + p.durationSec, 0);
  const total = cycleTime * cycles;
  if (elapsedSec >= total) {
    return {
      cycle: Math.max(0, cycles - 1),
      phase: phases[phases.length - 1].phase,
      phaseProgress: 1,
      completed: true,
    };
  }

  const cycle = Math.floor(elapsedSec / cycleTime);
  let remaining = elapsedSec % cycleTime;
  for (const p of phases) {
    if (remaining < p.durationSec) {
      return {
        cycle,
        phase: p.phase,
        phaseProgress: p.durationSec > 0 ? remaining / p.durationSec : 0,
        completed: false,
      };
    }
    remaining -= p.durationSec;
  }

  return {
    cycle,
    phase: phases[phases.length - 1].phase,
    phaseProgress: 1,
    completed: false,
  };
}

let audioCtx: AudioContext | null = null;
let lastPlayedAt = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new Ctx();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Soft two-tone chime when a toolbox exercise timer reaches zero.
 * Uses Web Audio (no asset file). Safe to call from any widget timer completion.
 */
export function playToolboxTimerCompleteSound(): void {
  const nowMs = Date.now();
  if (nowMs - lastPlayedAt < 400) return;
  lastPlayedAt = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const t0 = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.18, t0 + 0.05);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.35);
    master.connect(ctx.destination);

    const notes = [392, 523.25]; // G4 → C5, warm major third
    notes.forEach((freq, i) => {
      const start = t0 + i * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.85);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + 0.9);
    });
  } catch {
    // Autoplay policy or missing audio support — ignore silently.
  }
}

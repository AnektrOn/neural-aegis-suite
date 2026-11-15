/** Class names aligned with `.stitch/DESIGN.md` (Palette Obsidienne + or solaire). */
export const toolsPageShell =
  "min-h-screen bg-[color:var(--aegis-bg)] text-[color:var(--aegis-ink)] font-body";

export const toolsHeaderShell =
  "border-b border-[color:var(--aegis-cardline)] bg-[color:var(--aegis-surface)]";

export const toolsKicker =
  "font-cinzel text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--aegis-gold)]";

export const toolsTitle =
  "font-cormorant text-[clamp(1.75rem,4vw,2.5rem)] font-light tracking-tight text-[color:var(--aegis-ink)]";

export const toolsLead = "font-body text-base leading-relaxed text-[color:var(--aegis-ink-muted)] md:text-lg";

export const toolsBento =
  "rounded-2xl border border-[color:var(--aegis-cardline)] bg-[color:var(--aegis-surface)] p-5 shadow-[0_4px_28px_rgba(0,0,0,0.32)] sm:p-6 md:p-8 [box-shadow:0_4px_28px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(233,228,216,0.05)]";

export const toolsBentoHover =
  "transition-colors hover:border-[color:var(--aegis-cardline-hover)]";

export const toolsBentoElevated =
  "rounded-2xl border border-[color:var(--aegis-cardline)] bg-[color:var(--aegis-surface-elevated)] p-5 sm:p-6";

export const toolsSlider =
  "[&_[role=slider]]:border-[color:var(--aegis-gold)] [&_[role=slider]]:bg-[color:var(--aegis-bg)] [&_.bg-primary]:bg-[color:var(--aegis-gold)] [&_.bg-secondary]:bg-[color:var(--aegis-surface-elevated)]";

export const toolsMetricValue =
  "font-display text-2xl font-medium tabular-nums tracking-wide text-[color:var(--aegis-ink)]";

export const toolsMetricLabel =
  "font-cinzel text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--aegis-ink-subtle)]";

export const toolsChipBase =
  "rounded-lg border px-4 py-2 font-body text-sm transition-colors";

export const toolsChipInactive =
  `${toolsChipBase} border-[color:var(--aegis-cardline)] bg-[color:var(--aegis-surface)] text-[color:var(--aegis-ink-muted)] hover:border-[color:var(--aegis-cardline-hover)]`;

export const toolsChipActive =
  `${toolsChipBase} border-transparent bg-[color:var(--aegis-ink)] text-[color:var(--aegis-bg)]`;

export const toolsProse =
  "prose prose-invert max-w-none prose-headings:font-cormorant prose-headings:font-light prose-headings:text-[color:var(--aegis-ink)] prose-p:font-body prose-p:text-[color:var(--aegis-ink-muted)]";
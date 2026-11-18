/** Public tools — landing typography + warm page shell. */

export const toolsPageShell =
  "aegis-landing tools-route min-h-screen flex flex-col relative overflow-x-hidden bg-[color:var(--aegis-page)] text-[color:var(--aegis-text)]";

export const toolsHeaderShell =
  "border-b border-[color:var(--aegis-hairline)] bg-[color:var(--aegis-page)]/90 backdrop-blur-md";

/** Nav chip, section labels — DM Mono (matches `.aegis-landing__section-label`). */
export const toolsKicker =
  "font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-[color:var(--aegis-text-secondary)]";

/** Page & hero titles — Cormorant (matches `.aegis-landing__headline`). */
export const toolsTitle =
  "font-cormorant-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.08] text-[color:var(--aegis-text)]";

export const toolsCardTitle =
  "font-cormorant-display text-xl leading-snug text-[color:var(--aegis-text)]";

export const toolsLead =
  "text-base leading-relaxed text-[color:var(--aegis-text-secondary)] md:text-lg";

export const publicBrandMark =
  "font-mono text-xs uppercase tracking-[0.12em] text-[color:var(--aegis-bronze-ink)]";

export const toolsBento =
  "rounded-2xl border border-[color:var(--aegis-hairline)] bg-white/70 p-5 shadow-[0_8px_28px_rgba(18,18,18,0.06)] backdrop-blur-sm sm:p-6 md:p-8";

export const toolsBentoHover =
  "transition-all duration-200 hover:border-[color:var(--aegis-bronze)]/35 hover:shadow-[0_8px_32px_rgba(18,18,18,0.1)]";

export const toolsBentoElevated =
  "rounded-xl border border-[color:var(--aegis-hairline)] bg-white/60 p-5 sm:p-6 backdrop-blur-sm";

export const toolsSlider =
  "[&_[role=slider]]:border-[color:var(--aegis-bronze)] [&_[role=slider]]:bg-white [&_.bg-primary]:bg-[color:var(--aegis-bronze)]";

/** Large result numbers in calculators. */
export const toolsMetricHero =
  "font-cormorant-display text-3xl tabular-nums leading-none text-[color:var(--aegis-bronze-ink)]";

export const toolsMetricValue =
  "font-cormorant-display text-2xl font-light tabular-nums text-[color:var(--aegis-text)]";

export const toolsMetricLabel =
  "font-mono text-[10px] font-normal uppercase tracking-[0.14em] text-[color:var(--aegis-text-secondary)]";

const toolsChipBase =
  "rounded-lg border px-4 py-2 text-sm transition-colors duration-200";

export const toolsChipInactive = `${toolsChipBase} border border-[#e4e4e7] bg-[#f3eeec]/80 text-[#5c5c61] hover:border-[#d19d7b]/50 hover:text-[#121212]`;

export const toolsChipActive = `${toolsChipBase} border border-[#c38155] bg-[#d19d7b] text-[#121212] font-medium shadow-[0_4px_18px_rgba(211,157,123,0.25)]`;

export const toolsProse =
  "prose prose-neutral max-w-none prose-headings:font-cormorant-display prose-headings:font-light prose-headings:text-[color:var(--aegis-text)] prose-p:text-[color:var(--aegis-text-secondary)]";

export const toolsSectionHeading =
  "font-cormorant-display text-2xl font-light text-[color:var(--aegis-text)]";

export const toolsPrimaryButton =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#d19d7b] px-5 text-sm font-medium text-[#121212] shadow-[0_4px_18px_rgba(211,157,123,0.3)] transition hover:bg-[#c38155] disabled:opacity-40";

export const toolsSecondaryButton =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[color:var(--aegis-hairline)] bg-white/60 px-4 font-mono text-xs uppercase tracking-[0.12em] text-[color:var(--aegis-text-secondary)] transition hover:border-[color:var(--aegis-bronze)]/40 hover:text-[color:var(--aegis-text)]";

export const toolsInput =
  "w-full rounded-lg border border-[color:var(--aegis-hairline)] bg-white px-3 py-2.5 text-sm text-[color:var(--aegis-text)] placeholder:text-[color:var(--aegis-text-secondary)] focus:border-[color:var(--aegis-bronze)]/50 focus:outline-none focus:ring-1 focus:ring-[color:var(--aegis-bronze)]/20";

/** Modals opened from public tools (portaled to `body`). */
export const toolsDialogContent =
  "aegis-landing aegis-tools-dialog max-h-[90dvh] overflow-y-auto border p-6 sm:max-w-lg";

export const toolsDialogOverlay = "aegis-tools-dialog-overlay";

export const toolsSectionLabel = "text-sm font-medium text-[color:var(--aegis-text)]";
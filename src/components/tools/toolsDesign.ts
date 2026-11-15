/** Public tools — aligned with Auth, Pricing, and member dashboard tokens. */
export const toolsPageShell =
  "min-h-screen bg-aegis-gradient text-foreground flex flex-col relative overflow-x-hidden";

export const toolsHeaderShell =
  "border-b border-border/40 bg-background/50 backdrop-blur-md";

export const toolsKicker =
  "font-display text-[10px] font-medium uppercase tracking-[0.2em] text-primary";

export const toolsTitle =
  "font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-wide text-foreground";

export const toolsLead = "text-base leading-relaxed text-muted-foreground md:text-lg";

export const toolsBento =
  "rounded-2xl glass-card border border-border/25 bg-card/80 p-5 sm:p-6 md:p-8";

export const toolsBentoHover =
  "transition-all duration-200 hover:border-primary/35 hover:shadow-[0_8px_32px_hsl(var(--primary)/0.08)]";

export const toolsBentoElevated =
  "rounded-xl border border-border/30 bg-muted/25 p-5 sm:p-6 backdrop-blur-sm";

export const toolsSlider =
  "[&_[role=slider]]:border-primary [&_[role=slider]]:bg-background [&_.bg-primary]:bg-primary [&_.bg-secondary]:bg-muted";

export const toolsMetricValue =
  "font-display text-2xl font-medium tabular-nums tracking-wide text-foreground";

export const toolsMetricLabel =
  "font-display text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground";

const toolsChipBase =
  "rounded-lg border px-4 py-2 text-sm transition-colors duration-200";

export const toolsChipInactive = `${toolsChipBase} border-border/50 bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground`;

export const toolsChipActive = `${toolsChipBase} border-primary/45 bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.22)]`;

export const toolsProse =
  "prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground";

/** Primary CTA — same family as Auth submit, optional Cinzel variant via btn-solaire elsewhere. */
export const toolsPrimaryButton =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition hover:bg-primary/90 disabled:opacity-40";

export const toolsSecondaryButton =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-border/60 bg-card/60 px-4 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground transition hover:border-primary/40 hover:text-foreground";

export const toolsInput =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20";
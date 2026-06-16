import { cn } from "@/lib/utils";
import type { TaoPortraitFrontmatter } from "../lib/taoMarkdownPrepare";

function humanizeToken(value: string): string {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function TaoPortraitMetaStrip({
  frontmatter,
  accentColor,
  className,
}: {
  frontmatter: TaoPortraitFrontmatter;
  accentColor?: string;
  className?: string;
}) {
  const chips = [
    frontmatter.principeDominant
      ? { label: humanizeToken(frontmatter.principeDominant), tone: "accent" as const }
      : null,
    ...(frontmatter.principesSecondaires ?? []).map((p) => ({
      label: humanizeToken(p),
      tone: "soft" as const,
    })),
    ...(frontmatter.tags ?? []).map((t) => ({
      label: humanizeToken(t),
      tone: "tag" as const,
    })),
  ].filter(Boolean) as Array<{ label: string; tone: "accent" | "soft" | "tag" }>;

  if (!frontmatter.glyphe && chips.length === 0) return null;

  return (
    <div
      className={cn(
        "mb-8 flex gap-4 rounded-xl border border-border/35 bg-muted/15 p-4 sm:p-5",
        className,
      )}
      style={
        accentColor
          ? ({
              borderColor: `color-mix(in srgb, ${accentColor} 22%, transparent)`,
              background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 6%, transparent), transparent)`,
            } as React.CSSProperties)
          : undefined
      }
    >
      {frontmatter.glyphe ? (
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-background/60 text-2xl font-display"
          style={
            accentColor
              ? { color: accentColor, borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)` }
              : undefined
          }
          aria-hidden
        >
          {frontmatter.glyphe}
        </div>
      ) : null}

      <div className="min-w-0 flex-1 space-y-3">
        {(frontmatter.stade || frontmatter.domaine) && (
          <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {[frontmatter.stade, frontmatter.domaine].filter(Boolean).map(humanizeToken).join(" · ")}
          </p>
        )}

        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.label}
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-display uppercase tracking-wider",
                  chip.tone === "accent" &&
                    "border-[var(--tao-accent)]/35 bg-[var(--tao-accent)]/10 text-foreground",
                  chip.tone === "soft" && "border-border/30 bg-background/40 text-muted-foreground",
                  chip.tone === "tag" && "border-border/25 text-muted-foreground/80",
                )}
              >
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

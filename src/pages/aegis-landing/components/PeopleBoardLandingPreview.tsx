import type { AegisLandingLocale } from "../i18n/aegisLandingCopy";
import {
  DECISION_NETWORK_EDGES,
  DECISION_NETWORK_NODES,
} from "./decisionNetworkGraph";

const COPY = {
  fr: {
    product: "People Board 3D",
    illustrative: "Exemple illustratif",
    tension: "Tension · COO",
    clarity: "Clarté 42 %",
    aria: "Carte des relations : nœud COO en tension, score de clarté 42 pour cent",
  },
  en: {
    product: "3D People Board",
    illustrative: "Illustrative example",
    tension: "Tension · COO",
    clarity: "Clarity 42%",
    aria: "Relationship map: COO node in tension, clarity score 42 percent",
  },
} as const;

type Variant = "hero" | "heroOverlay" | "compact";

export function PeopleBoardLandingPreview({
  locale,
  variant = "hero",
  className = "",
}: {
  locale: AegisLandingLocale;
  variant?: Variant;
  className?: string;
}) {
  const c = COPY[locale];
  const compact = variant === "compact";
  const overlay = variant === "heroOverlay";
  const lightSurface = !compact && !overlay;

  return (
    <div
      className={`overflow-hidden rounded-[16px] border ${
        compact
          ? "border-[color:var(--aegis-dark-border)] bg-[color:var(--aegis-dark-elevated)]"
          : lightSurface
            ? "border-[#375362]/35 bg-white/75 shadow-[0_24px_64px_-28px_rgba(12,20,24,0.35)] backdrop-blur-md"
            : "border-white/20 bg-[#162127]/88 shadow-[0_20px_48px_-24px_rgba(0,0,0,0.45)] backdrop-blur-md"
      } ${className}`}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 md:px-4 ${
          compact || overlay
            ? "border-[color:var(--aegis-dark-border)]"
            : "border-[#375362]/30"
        }`}
      >
        <p
          className={`font-mono text-[9px] uppercase tracking-[0.16em] md:text-[10px] ${
            compact || overlay ? "text-[color:var(--aegis-bronze)]" : "text-[color:var(--aegis-bronze-ink)]"
          }`}
        >
          {c.product}
        </p>
        <span
          className={`font-mono text-[9px] uppercase tracking-[0.12em] ${
            compact || overlay ? "text-[color:var(--aegis-dark-secondary)]" : "text-[color:var(--aegis-text-secondary)]"
          }`}
        >
          {c.illustrative}
        </span>
      </div>

      <div className={`relative ${compact ? "px-2 pb-2 pt-1" : "p-3 md:p-4"}`}>
        <svg
          viewBox="0 0 320 210"
          className={compact ? "h-[120px] w-full" : "h-[min(42vw,220px)] w-full md:h-[200px]"}
          role="img"
          aria-label={c.aria}
        >
          {DECISION_NETWORK_EDGES.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={DECISION_NETWORK_NODES[a].x}
              y1={DECISION_NETWORK_NODES[a].y}
              x2={DECISION_NETWORK_NODES[b].x}
              y2={DECISION_NETWORK_NODES[b].y}
              stroke={overlay || compact ? "#5a6a72" : "#C9BDB4"}
              strokeWidth="1"
            />
          ))}
          {DECISION_NETWORK_NODES.map((n, i) =>
            n.alert ? (
              <g key={i}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r + 6}
                  fill="none"
                  stroke="var(--aegis-alert)"
                  strokeWidth="1.5"
                />
                <circle cx={n.x} cy={n.y} r={n.r} fill="var(--aegis-alert)" />
              </g>
            ) : (
              <circle
                key={i}
                cx={n.x}
                cy={n.y}
                r={n.r}
                fill={overlay || compact ? "#8A9AA4" : "#8A7D74"}
              />
            ),
          )}
          <g transform="translate(194, 132)">
            <rect
              x={0}
              y={0}
              width={112}
              height={52}
              rx={8}
              fill={overlay || compact ? "#1c2931" : "#162127"}
              stroke="var(--aegis-alert)"
              strokeWidth="1"
              opacity="0.95"
            />
            <text
              x={10}
              y={18}
              fill="#f8f1ec"
              fontFamily="DM Mono, ui-monospace, monospace"
              fontSize="9"
              letterSpacing="0.08em"
            >
              {c.tension}
            </text>
            <text
              x={10}
              y={38}
              fill="#d19d7b"
              fontFamily="Barlow, ui-sans-serif, sans-serif"
              fontSize="13"
              fontWeight="600"
            >
              {c.clarity}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
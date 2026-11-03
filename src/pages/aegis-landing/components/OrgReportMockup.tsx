import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";

const HEAT = [
  [0.2, 0.3, 0.25, 0.4, 0.55, 0.5, 0.7, 0.65, 0.8, 0.75],
  [0.15, 0.2, 0.35, 0.3, 0.45, 0.6, 0.55, 0.5, 0.4, 0.35],
  [0.4, 0.5, 0.55, 0.7, 0.65, 0.8, 0.85, 0.7, 0.6, 0.55],
  [0.3, 0.25, 0.2, 0.35, 0.4, 0.45, 0.5, 0.6, 0.55, 0.5],
  [0.5, 0.55, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2],
  [0.2, 0.25, 0.3, 0.28, 0.35, 0.4, 0.38, 0.42, 0.5, 0.48],
  [0.1, 0.15, 0.12, 0.18, 0.22, 0.2, 0.25, 0.3, 0.28, 0.24],
  [0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9],
];

const LINE = [18, 22, 20, 28, 34, 31, 42, 48, 45, 58, 62, 70];

function heatColor(v: number) {
  const t = Math.min(1, Math.max(0, v));
  const r = Math.round(90 + t * 140);
  const g = Math.round(70 + t * 70);
  const b = Math.round(60 + t * 30);
  return `rgb(${r},${g},${b})`;
}

export function OrgReportMockup() {
  const { copy } = useAegisLandingLocale();
  const mockup = copy.recevez.mockup;
  const rows = mockup.heatmapRows ?? [];
  const ill = copy.recevez.illustrative;
  const legend = copy.recevez.heatmapLegend;
  const w = 220;
  const h = 88;
  const max = Math.max(...LINE);
  const pts = LINE.map((v, i) => {
    const x = (i / (LINE.length - 1)) * w;
    const y = h - (v / (max + 8)) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="aegis-landing__glass mt-10 overflow-hidden rounded-[18px] border border-[#375362]/60 p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#375362]/50 pb-4">
        <h3 className="font-cormorant text-2xl text-[color:var(--aegis-dark-text)]">{copy.recevez.reportTitle}</h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-dark-secondary)]">
          {copy.recevez.weekLabel}{" "}
          <span>{copy.recevez.weekPlaceholder}</span>
        </p>
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze)]">
            {mockup.heatmapTitle}
          </p>
          <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5">
            {rows.map((row, ri) => (
              <div key={row} className="contents">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[color:var(--aegis-dark-secondary)]">
                  {row}
                </span>
                <div className="flex gap-1">
                  {(HEAT[ri] ?? HEAT[0]).map((v, ci) => (
                    <span
                      key={ci}
                      className="h-3.5 w-3.5 shrink-0 rounded-[2px] md:h-4 md:w-4"
                      style={{
                        background: heatColor(v),
                        opacity: 0.45 + v * 0.55,
                      }}
                      title={`${Math.round(v * 100)}%`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {legend ? (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--aegis-dark-secondary)]">
              {legend}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-[color:var(--aegis-dark-secondary)]">{ill}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze)]">
            {mockup.chartTitle}
          </p>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="mt-6 w-full text-[color:var(--aegis-bronze)]"
            role="img"
            aria-label={mockup.chartTitle}
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              points={pts}
            />
            <circle
              cx={w}
              cy={h - (LINE[LINE.length - 1] / (max + 8)) * h}
              r="3"
              fill="var(--aegis-alert)"
            />
            <text
              x={w - 4}
              y={h - (LINE[LINE.length - 1] / (max + 8)) * h - 8}
              textAnchor="end"
              fill="var(--aegis-dark-secondary)"
              fontSize="9"
              fontFamily="DM Mono, monospace"
            >
              {LINE[LINE.length - 1]}
            </text>
          </svg>
          <p className="mt-4 text-sm leading-relaxed text-[color:var(--aegis-dark-secondary)]">{mockup.synthesisBody}</p>
          <p className="mt-2 text-xs text-[color:var(--aegis-dark-secondary)]">{ill}</p>
        </div>
      </div>
    </div>
  );
}

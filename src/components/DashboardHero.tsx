interface DashboardHeroProps {
  greeting: string;
  sessionLabel: string;
  /** 0–100 */
  progress: number;
}

const R = 20;
const CIRC = 2 * Math.PI * R;

export default function DashboardHero({ greeting, sessionLabel, progress }: DashboardHeroProps) {
  const pct = Math.min(100, Math.max(0, progress));
  const dash = (pct / 100) * CIRC;
  const gap = CIRC - dash;

  return (
    <div className="dashboard-hero">
      <div className="dashboard-hero-overlay" aria-hidden />
      <div className="dashboard-hero-ray" aria-hidden />

      <div className="dashboard-hero-halo" aria-hidden />

      <div className="pointer-events-none absolute left-1/2 bottom-[22px] -translate-x-1/2 flex flex-col items-center gap-[3px]">
        <div className="w-[6px] h-[6px] rounded-full bg-foreground/35" />
        <div className="h-[14px] w-[4px] rounded-[1px] bg-foreground/25" />
      </div>

      <div className="absolute top-3 right-3 w-[52px] h-[52px] text-primary">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48" aria-hidden>
          <circle
            cx="24"
            cy="24"
            r={R}
            fill="none"
            stroke="hsl(var(--border))"
            strokeOpacity={0.65}
            strokeWidth="2.5"
          />
          <circle
            cx="24"
            cy="24"
            r={R}
            fill="none"
            className="stroke-current"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
          />
        </svg>
      </div>

      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-8 rounded-b-[20px] dashboard-hero-fade">
        <p className="font-barlow text-[9px] font-medium uppercase tracking-[0.28em] text-primary/90">{sessionLabel}</p>
        <p className="font-cormorant text-[28px] font-light leading-tight tracking-tight text-primary mt-0.5">{greeting}</p>
      </div>
    </div>
  );
}

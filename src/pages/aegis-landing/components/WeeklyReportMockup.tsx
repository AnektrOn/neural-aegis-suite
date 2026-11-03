import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";

function Gauge({
  label,
  value,
  illustrative,
}: {
  label: string;
  value: string;
  illustrative: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#375362]"
        style={{
          background: `conic-gradient(var(--aegis-bronze) ${value}%, transparent 0)`,
        }}
      >
        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-[color:var(--aegis-dark-card)] text-[color:var(--aegis-dark-text)]">
          <span className="font-mono text-sm">{value}%</span>
        </div>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--aegis-dark-secondary)]">
        {label}
      </p>
      <p className="text-xs text-[color:var(--aegis-dark-secondary)]">{illustrative}</p>
    </div>
  );
}

export function WeeklyReportMockup() {
  const { copy } = useAegisLandingLocale();
  const ill = copy.recevez.illustrative;
  const mockup = copy.recevez.mockup;

  return (
    <div className="aegis-landing__glass mt-10 overflow-hidden rounded-[18px] border border-[#375362]/60 p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#375362]/50 pb-4">
        <h3 className="font-cormorant text-2xl text-[color:var(--aegis-dark-text)]">{copy.recevez.reportTitle}</h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-dark-secondary)]">
          {copy.recevez.weekLabel}{" "}
          <span>{copy.recevez.weekPlaceholder}</span>
        </p>
      </div>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <Gauge label={mockup.risk} value="62" illustrative={ill} />
        <Gauge label={mockup.opportunity} value="41" illustrative={ill} />
        <Gauge label={mockup.alignment} value="78" illustrative={ill} />
      </div>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze)]">
            {mockup.alerts}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--aegis-dark-secondary)]">
            {mockup.alertsItems.map((item, i) => (
              <li key={item} className={i === 1 ? "text-[color:var(--aegis-alert)]" : undefined}>
                {i === 1 ? (
                  <span className="mr-1 font-mono text-[10px] uppercase tracking-wider">!</span>
                ) : null}
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[color:var(--aegis-dark-secondary)]">{ill}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze)]">
            {mockup.synthesis}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--aegis-dark-secondary)]">{mockup.synthesisBody}</p>
          <p className="mt-2 text-xs text-[color:var(--aegis-dark-secondary)]">{ill}</p>
          <div className="mt-6">
            <div className="flex justify-between font-mono text-[10px] text-[color:var(--aegis-dark-secondary)]">
              <span>{mockup.load}</span>
              <span>71% · {ill}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--aegis-dark-elevated)]">
              <div className="h-full w-[71%] bg-[color:var(--aegis-bronze)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

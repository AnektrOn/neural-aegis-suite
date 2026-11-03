import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingCheckIcon } from "./LandingCheckIcon";

function CellMark({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  if (on) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[color:var(--aegis-bronze-ink)]">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--aegis-bronze)]/20">
          <LandingCheckIcon />
        </span>
        <span className="sr-only">{yes}</span>
      </span>
    );
  }
  return (
    <span className="text-[color:var(--aegis-text-secondary)]">
      <span aria-hidden>—</span>
      <span className="sr-only">{no}</span>
    </span>
  );
}

export function ComparisonTable() {
  const { copy } = useAegisLandingLocale();
  const { headers, rows, yes, no } = copy.comparatif;

  return (
    <div className="overflow-x-auto rounded-[18px] border border-[color:var(--aegis-hairline)] bg-white/80">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[color:var(--aegis-hairline)]">
            <th scope="col" className="p-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--aegis-text-secondary)]">
              {headers.feature}
            </th>
            <th
              scope="col"
              className="bg-[color:var(--aegis-page)]/80 p-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--aegis-text)]"
            >
              {headers.aegis}
            </th>
            <th scope="col" className="p-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--aegis-text-secondary)]">
              {headers.autres}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-b border-[color:var(--aegis-hairline)] last:border-0">
              <th scope="row" className="p-4 font-normal text-[color:var(--aegis-muted)]">
                {row.feature}
              </th>
              <td className="bg-[color:var(--aegis-page)]/50 p-4">
                <CellMark on={row.aegis} yes={yes} no={no} />
              </td>
              <td className="p-4">
                <CellMark on={row.autres} yes={yes} no={no} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

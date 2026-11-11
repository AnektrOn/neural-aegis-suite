import { useEffect, useState } from "react";
import { FileText, ScrollText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { listUserReports, markUserReportRead } from "./service";
import type { UserReport } from "./types";
import { UserReportModal } from "./UserReportModal";

interface Props {
  userId: string;
}

export function UserReportsSection({ userId }: Props) {
  const { t, locale } = useLanguage();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserReport | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listUserReports(userId)
      .then((rows) => alive && setReports(rows))
      .catch((e) => console.error("[UserReports] list failed", e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId]);

  if (loading || reports.length === 0) return null;

  const isFR = locale === "fr";

  return (
    <section
      className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-xl p-5 space-y-4"
      aria-labelledby="user-reports-heading"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ScrollText size={16} strokeWidth={1.5} className="text-primary" aria-hidden />
          <h2
            id="user-reports-heading"
            className="font-display text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
          >
            {isFR ? "Dossiers & Bilans Cliniques" : "Clinical Reports & Dossiers"}
          </h2>
        </div>
        <span className="font-display text-[10px] text-muted-foreground/80 uppercase tracking-widest">
          {reports.length} {isFR ? "bilan(s)" : "dossier(s)"}
        </span>
      </div>

      <ul className="space-y-2">
        {reports.map((r) => {
          const isUnread = !r.read_at;
          const levelCode = r.level_code || (r.tier ? `LEVEL_${r.tier}` : null);
          const hasV3Pack = Boolean(r.pack_files);

          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(r);
                  if (isUnread) {
                    void markUserReportRead(r.id);
                    setReports((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, read_at: new Date().toISOString() } : x,
                      ),
                    );
                  }
                }}
                className="w-full text-left group flex items-center gap-3 rounded-xl border border-border/30 bg-background/40 hover:bg-background/60 hover:border-primary/40 transition-all p-3 relative"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-white/5 text-lg shadow-sm"
                  aria-hidden
                >
                  {r.glyph || <FileText size={16} strokeWidth={1.5} className="text-primary" />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 mb-0.5">
                    <span className="font-cormorant-display text-lg text-foreground truncate font-medium">
                      {r.title}
                    </span>
                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" title="Nouveau" />
                    )}
                  </span>

                  <span className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-[0.12em] flex-wrap">
                    <span>
                      {new Date(r.created_at).toLocaleDateString(isFR ? "fr-FR" : "en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    {levelCode ? (
                      <Badge
                        variant="outline"
                        className="border-primary/30 bg-primary/5 text-primary text-[9px] px-1.5 py-0 h-4"
                      >
                        {levelCode}
                      </Badge>
                    ) : null}

                    {r.prism_code || r.orientation ? (
                      <span>· {r.prism_code || r.orientation}</span>
                    ) : null}

                    {r.has_safeguard ? (
                      <span className="text-amber-400 flex items-center gap-0.5 text-[10px]">
                        <ShieldCheck size={11} />
                        Safeguard
                      </span>
                    ) : null}

                    {hasV3Pack ? (
                      <Badge
                        variant="outline"
                        className="border-purple-500/30 bg-purple-500/5 text-purple-300 text-[9px] px-1.5 py-0 h-4"
                      >
                        Pack 5
                      </Badge>
                    ) : null}
                  </span>
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  tabIndex={-1}
                  className="pointer-events-none opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                >
                  {isFR ? "Consulter" : "Inspect"}
                </Button>
              </button>
            </li>
          );
        })}
      </ul>

      <UserReportModal
        report={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </section>
  );
}

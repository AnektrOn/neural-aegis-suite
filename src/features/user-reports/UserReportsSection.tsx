import { useEffect, useState } from "react";
import { FileText, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center gap-2">
        <ScrollText size={16} strokeWidth={1.5} className="text-primary" aria-hidden />
        <h2
          id="user-reports-heading"
          className="font-display text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
        >
          {isFR ? "Rapports personnels" : "Personal reports"}
        </h2>
      </div>

      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => {
                setSelected(r);
                if (!r.read_at) {
                  void markUserReportRead(r.id);
                  setReports((prev) =>
                    prev.map((x) =>
                      x.id === r.id ? { ...x, read_at: new Date().toISOString() } : x,
                    ),
                  );
                }
              }}
              className="w-full text-left group flex items-center gap-3 rounded-xl border border-border/30 bg-background/40 hover:bg-background/60 transition-colors p-3"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/40 text-lg"
                aria-hidden
              >
                {r.glyph || <FileText size={16} strokeWidth={1.5} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-cormorant-display text-base text-foreground truncate">
                  {r.title}
                </span>
                <span className="block text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
                  {new Date(r.created_at).toLocaleDateString(isFR ? "fr-FR" : "en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  {r.orientation ? ` · ${r.orientation}` : ""}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                tabIndex={-1}
                className="pointer-events-none opacity-80 group-hover:opacity-100"
              >
                {isFR ? "Lire" : "Read"}
              </Button>
            </button>
          </li>
        ))}
      </ul>

      <UserReportModal
        report={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </section>
  );
}

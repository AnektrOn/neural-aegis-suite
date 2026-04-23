import { useEffect, useMemo, useState } from "react";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getSnapshotHistory,
  compareSnapshots,
  type ArchetypeProfileSnapshot,
  type SnapshotDelta,
} from "@/features/archetype-assessment/services/snapshotService";
import { ARCHETYPES } from "@/features/archetype-assessment/domain/archetypes";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";
import { useLanguage } from "@/i18n/LanguageContext";

function archetypeColor(key: ArchetypeKey): string {
  return ARCHETYPES.find((a) => a.key === key)?.color ?? "hsl(var(--primary))";
}

function archetypeName(key: ArchetypeKey, lang: "fr" | "en"): string {
  const def = ARCHETYPES.find((a) => a.key === key);
  if (!def) return key;
  return lang === "fr" ? def.name_fr : def.name_en;
}

interface Props {
  userId: string;
}

export function AdminSnapshotHistoryTab({ userId }: Props) {
  const { t, locale } = useLanguage();
  const lang: "fr" | "en" = locale === "en" ? "en" : "fr";
  const [snapshots, setSnapshots] = useState<ArchetypeProfileSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");
  const [delta, setDelta] = useState<SnapshotDelta | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSnapshotHistory(userId)
      .then((rows) => {
        setSnapshots(rows);
        if (rows.length >= 2) {
          setAId(rows[1].id);
          setBId(rows[0].id);
        } else if (rows.length === 1) {
          setAId(rows[0].id);
          setBId(rows[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleCompare = async () => {
    if (!aId || !bId || aId === bId) return;
    setComparing(true);
    try {
      setDelta(await compareSnapshots(aId, bId));
    } finally {
      setComparing(false);
    }
  };

  const sortedDeltas = useMemo(
    () =>
      delta
        ? [...delta.archetypeDeltas].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        : [],
    [delta],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (snapshots.length === 0) {
    return <p className="text-sm text-muted-foreground py-6">{t("admin.snapshots.empty")}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {snapshots.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-md border border-border/40 bg-secondary/10 px-3 py-2 text-xs"
          >
            <span className="font-display tabular-nums text-foreground min-w-[150px]">
              {new Date(s.computed_at).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
            </span>
            <span className="text-text-tertiary uppercase tracking-[0.14em] text-[10px]">
              v{s.snapshot_version} · {s.trigger_event}
            </span>
            <div className="flex flex-wrap gap-1.5 ml-auto">
              {s.top_archetypes.slice(0, 3).map((a) => (
                <span
                  key={a.key}
                  className="text-[10px] px-2 py-0.5 rounded-full border"
                  style={{ borderColor: archetypeColor(a.key), color: archetypeColor(a.key) }}
                >
                  {archetypeName(a.key, lang)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-border/40 bg-secondary/5 p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
              {t("admin.snapshots.pickA")}
            </label>
            <select
              value={aId}
              onChange={(e) => setAId(e.target.value)}
              className="bg-background border border-border/40 rounded px-2 py-1 text-xs"
            >
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  v{s.snapshot_version} — {new Date(s.computed_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
              {t("admin.snapshots.pickB")}
            </label>
            <select
              value={bId}
              onChange={(e) => setBId(e.target.value)}
              className="bg-background border border-border/40 rounded px-2 py-1 text-xs"
            >
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  v{s.snapshot_version} — {new Date(s.computed_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <Button size="sm" onClick={handleCompare} disabled={!aId || !bId || aId === bId || comparing}>
            {comparing && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
            {t("admin.snapshots.compare")}
          </Button>
        </div>

        {delta && (
          <div className="space-y-2 pt-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
              {t("admin.snapshots.delta")}
            </p>
            {delta.topGain && (
              <p className="text-xs text-accent-positive flex items-center gap-1.5">
                <TrendingUp size={12} /> {archetypeName(delta.topGain.key, lang)} +{delta.topGain.delta}
              </p>
            )}
            {delta.topLoss && (
              <p className="text-xs text-accent-danger flex items-center gap-1.5">
                <TrendingDown size={12} /> {archetypeName(delta.topLoss.key, lang)} {delta.topLoss.delta}
              </p>
            )}
            <div className="space-y-1.5 pt-1">
              {sortedDeltas.map((d) => {
                const positive = d.delta > 0;
                return (
                  <div key={d.key} className="flex items-center gap-2 text-[11px]">
                    <span className="w-28 truncate text-text-secondary">
                      {archetypeName(d.key, lang)}
                    </span>
                    <span className="w-10 text-right tabular-nums text-text-tertiary">{d.scoreA}</span>
                    <span className="text-text-tertiary">→</span>
                    <span className="w-10 text-right tabular-nums text-text-tertiary">{d.scoreB}</span>
                    <span
                      className={`w-12 text-right font-display tabular-nums ${
                        positive ? "text-accent-positive" : d.delta < 0 ? "text-accent-danger" : "text-text-tertiary"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {d.delta}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

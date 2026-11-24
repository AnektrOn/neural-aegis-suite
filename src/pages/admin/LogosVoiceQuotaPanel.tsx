import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { formatVoiceDuration } from "@/features/logos/voiceSessionCost";
import {
  fetchLogosVoiceQuotaOverview,
  updateDefaultVoiceLimit,
  updateProfileVoiceLimit,
  type LogosVoiceQuotaAdminRow,
} from "@/features/logos/voiceBudgetAdminService";
import { Button } from "@/components/ui/button";

const card = "rounded-2xl border border-border/20 bg-secondary/10 p-5 space-y-4";
const input =
  "w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none";

function pctUsed(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function barClass(pct: number): string {
  if (pct >= 95) return "bg-destructive";
  if (pct >= 80) return "bg-amber-500/90";
  return "bg-primary/70";
}

type Props = {
  searchQuery?: string;
  selectedUserId?: string | null;
  onSelectUser?: (userId: string) => void;
};

export function LogosVoiceQuotaPanel({
  searchQuery = "",
  selectedUserId,
  onSelectUser,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LogosVoiceQuotaAdminRow[]>([]);
  const [periodLabel, setPeriodLabel] = useState("");
  const [defaultLimitMinutes, setDefaultLimitMinutes] = useState("");
  const [overrideDraft, setOverrideDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const overview = await fetchLogosVoiceQuotaOverview(searchQuery);
    if (!overview) {
      toast.error(
        "Quota vocal indisponible — appliquez les migrations get_voice_usage_budget / list_logos_voice_usage_budgets.",
      );
      setRows([]);
      setLoading(false);
      return;
    }
    setRows(overview.users);
    setDefaultLimitMinutes(String(Math.round(overview.default_limit_seconds / 60)));
    const start = overview.period_start ? new Date(overview.period_start) : null;
    setPeriodLabel(
      start
        ? start.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" })
        : "Mois en cours (UTC)",
    );
    const drafts: Record<string, string> = {};
    for (const u of overview.users) {
      drafts[u.user_id] =
        u.profile_limit_seconds != null ? String(Math.round(u.profile_limit_seconds / 60)) : "";
    }
    setOverrideDraft(drafts);
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.used += r.used_seconds;
        acc.remaining += r.remaining_seconds;
        return acc;
      },
      { used: 0, remaining: 0 },
    );
  }, [rows]);

  const saveDefault = async () => {
    const minutes = Number(defaultLimitMinutes);
    if (!Number.isFinite(minutes) || minutes < 1) {
      toast.error("Quota par défaut invalide (minutes ≥ 1)");
      return;
    }
    setBusy("default");
    const { error } = await updateDefaultVoiceLimit(Math.round(minutes * 60));
    setBusy(null);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Quota vocal par défaut enregistré");
    await load();
  };

  const saveOverride = async (userId: string) => {
    const raw = overrideDraft[userId]?.trim() ?? "";
    const minutes = raw === "" ? null : Number(raw);
    if (raw !== "" && (!Number.isFinite(minutes) || minutes < 0)) {
      toast.error("Override invalide — laissez vide pour le défaut global");
      return;
    }
    setBusy(`user-${userId}`);
    const { error } = await updateProfileVoiceLimit(
      userId,
      raw === "" || minutes === null ? null : Math.round(minutes * 60),
    );
    setBusy(null);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Quota membre mis à jour");
    await load();
  };

  return (
    <section className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg text-foreground">
            <Clock size={16} aria-hidden />
            Quota vocal LOGOS
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Membres avec agent ElevenLabs actif — période :{" "}
            <span className="text-foreground">{periodLabel}</span>
            {rows.length > 0 ? (
              <>
                {" "}
                · {rows.length} agent(s) · {formatVoiceDuration(totals.used)} consommées ·{" "}
                {formatVoiceDuration(totals.remaining)} restantes (agrégat)
              </>
            ) : null}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualiser
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border/15 bg-background/30 p-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Quota par défaut (minutes / mois / membre)
          <input
            type="number"
            min={1}
            className={`${input} w-40`}
            value={defaultLimitMinutes}
            onChange={(e) => setDefaultLimitMinutes(e.target.value)}
          />
        </label>
        <Button type="button" size="sm" disabled={busy === "default"} onClick={() => void saveDefault()}>
          {busy === "default" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer défaut
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement des quotas…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun membre avec agent ElevenLabs lié.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Membre</th>
                <th className="pr-3">Utilisé</th>
                <th className="pr-3">Restant</th>
                <th className="pr-3">Plafond</th>
                <th className="pr-3">Override (min)</th>
                <th className="pr-3">Dernier appel</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const pct = pctUsed(row.used_seconds, row.limit_seconds);
                const selected = selectedUserId === row.user_id;
                return (
                  <tr
                    key={row.user_id}
                    className={`border-t border-border/10 align-middle ${selected ? "bg-primary/5" : ""}`}
                  >
                    <td className="py-2 pr-3">
                      {onSelectUser ? (
                        <button
                          type="button"
                          className="text-left hover:underline"
                          onClick={() => onSelectUser(row.user_id)}
                        >
                          <div className="font-medium text-foreground">
                            {row.display_name || row.user_id.slice(0, 8)}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {row.elevenlabs_agent_id.slice(0, 22)}…
                          </div>
                        </button>
                      ) : (
                        <div>
                          <div className="font-medium text-foreground">
                            {row.display_name || row.user_id.slice(0, 8)}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {row.elevenlabs_agent_id.slice(0, 22)}…
                          </div>
                        </div>
                      )}
                      <div className="mt-1.5 h-1 w-full max-w-[140px] overflow-hidden rounded-full bg-border/40">
                        <div className={`h-full ${barClass(pct)}`} style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="pr-3 font-mono tabular-nums">{formatVoiceDuration(row.used_seconds)}</td>
                    <td
                      className={`pr-3 font-mono tabular-nums ${
                        row.remaining_seconds < 60 ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {formatVoiceDuration(row.remaining_seconds)}
                    </td>
                    <td className="pr-3 font-mono tabular-nums text-muted-foreground">
                      {formatVoiceDuration(row.limit_seconds)}
                    </td>
                    <td className="pr-3">
                      <input
                        type="number"
                        min={0}
                        placeholder="défaut"
                        className={`${input} w-24 py-1`}
                        value={overrideDraft[row.user_id] ?? ""}
                        onChange={(e) =>
                          setOverrideDraft((s) => ({ ...s, [row.user_id]: e.target.value }))
                        }
                      />
                    </td>
                    <td className="pr-3 text-xs text-muted-foreground">
                      {row.last_feedback_at
                        ? new Date(row.last_feedback_at).toLocaleString("fr-FR")
                        : "—"}
                    </td>
                    <td>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy === `user-${row.user_id}`}
                        onClick={() => void saveOverride(row.user_id)}
                      >
                        {busy === `user-${row.user_id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Shield,
  User as UserIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  getActiveAlerts,
  resolveAlert,
  runAlertScan,
  type AdminAlert,
  type AlertSeverity,
} from "@/services/alertService";

type SeverityFilter = "all" | AlertSeverity;

const SEVERITY_ORDER: AlertSeverity[] = ["critical", "high", "medium", "low"];

const SEVERITY_STYLES: Record<
  AlertSeverity,
  { dot: string; chip: string; text: string; emoji: string }
> = {
  critical: {
    dot: "bg-destructive",
    chip: "border-destructive/30 bg-destructive/10 text-destructive",
    text: "text-destructive",
    emoji: "🔴",
  },
  high: {
    dot: "bg-orange-500",
    chip: "border-orange-500/30 bg-orange-500/10 text-orange-500",
    text: "text-orange-500",
    emoji: "🟠",
  },
  medium: {
    dot: "bg-yellow-500",
    chip: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
    text: "text-yellow-500",
    emoji: "🟡",
  },
  low: {
    dot: "bg-muted-foreground",
    chip: "border-border/40 bg-secondary/30 text-muted-foreground",
    text: "text-muted-foreground",
    emoji: "⚪",
  },
};

function formatRelative(iso: string, locale: "fr" | "en"): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 1) return locale === "fr" ? "à l'instant" : "just now";
  if (min < 60) return locale === "fr" ? `il y a ${min} min` : `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return locale === "fr" ? `il y a ${h} h` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return locale === "fr" ? `il y a ${d} j` : `${d}d ago`;
}

function formatDetail(detail: Record<string, unknown>, locale: "fr" | "en"): string {
  if (!detail || typeof detail !== "object") return "";
  const fr = locale === "fr";
  const parts: string[] = [];
  if ("days" in detail) parts.push(fr ? `${detail.days} j` : `${detail.days}d`);
  if ("count" in detail) parts.push(`${detail.count}`);
  if ("delta" in detail)
    parts.push(fr ? `Δ ${detail.delta} pts` : `Δ ${detail.delta} pts`);
  if ("threshold" in detail)
    parts.push(fr ? `seuil ${detail.threshold}` : `threshold ${detail.threshold}`);
  if ("from" in detail && "to" in detail)
    parts.push(`${detail.from} → ${detail.to}`);
  return parts.join(" · ");
}

export default function AdminAlertsPanel() {
  const navigate = useNavigate();
  const { locale, t } = useLanguage();
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [profileMap, setProfileMap] = useState<
    Map<string, { name: string; companyName: string | null; companyId: string | null }>
  >(new Map());
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getActiveAlerts({ includeResolved: showResolved });
      setAlerts(rows);

      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const [profRes, compRes] = await Promise.all([
        userIds.length
          ? supabase
              .from("profiles")
              .select("id, display_name, company_id")
              .in("id", userIds)
          : Promise.resolve({ data: [], error: null } as { data: never[]; error: null }),
        supabase.from("companies" as never).select("id, name"),
      ]);
      const comps = ((compRes.data ?? []) as { id: string; name: string }[]) || [];
      setCompanies(comps);
      const compNameById = new Map(comps.map((c) => [c.id, c.name]));
      const map = new Map<
        string,
        { name: string; companyName: string | null; companyId: string | null }
      >();
      ((profRes.data ?? []) as Array<{
        id: string;
        display_name: string | null;
        company_id: string | null;
      }>).forEach((p) => {
        map.set(p.id, {
          name: p.display_name?.trim() || (locale === "fr" ? "Sans nom" : "No name"),
          companyId: p.company_id,
          companyName: p.company_id ? compNameById.get(p.company_id) ?? null : null,
        });
      });
      setProfileMap(map);
    } catch (e) {
      console.error(e);
      toast.error(locale === "fr" ? "Erreur de chargement" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [showResolved, locale]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return alerts
      .filter((a) => {
        if (severityFilter !== "all" && a.severity !== severityFilter) return false;
        if (typeFilter && a.alert_type !== typeFilter) return false;
        if (companyFilter) {
          const p = profileMap.get(a.user_id);
          if (!p || p.companyId !== companyFilter) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ra = SEVERITY_ORDER.indexOf(a.severity);
        const rb = SEVERITY_ORDER.indexOf(b.severity);
        if (ra !== rb) return ra - rb;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [alerts, severityFilter, typeFilter, companyFilter, profileMap]);

  const counts = useMemo(() => {
    const active = alerts.filter((a) => !a.is_resolved);
    return {
      critical: active.filter((a) => a.severity === "critical").length,
      high: active.filter((a) => a.severity === "high").length,
      medium: active.filter((a) => a.severity === "medium").length,
      low: active.filter((a) => a.severity === "low").length,
    };
  }, [alerts]);

  const types = useMemo(
    () => Array.from(new Set(alerts.map((a) => a.alert_type))).sort(),
    [alerts],
  );

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await runAlertScan();
      toast.success(
        locale === "fr"
          ? `Scan terminé · ${res.created} nouvelle(s) alerte(s)`
          : `Scan done · ${res.created} new alert(s)`,
      );
      await load();
    } catch (e) {
      console.error(e);
      toast.error(locale === "fr" ? "Échec du scan" : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      await resolveAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id || showResolved));
      if (showResolved) await load();
      toast.success(locale === "fr" ? "Alerte résolue" : "Alert resolved");
    } catch (e) {
      console.error(e);
      toast.error(locale === "fr" ? "Échec" : "Failed");
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-neural-label mb-3 text-neural-accent/60">
            {locale === "fr" ? "Administration" : "Administration"}
          </p>
          <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground flex items-center gap-3">
            <Shield size={22} className="text-accent-warning" />
            {t("admin.alerts.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            {t("admin.alerts.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleScan}
          disabled={scanning}
          className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-xl text-xs uppercase tracking-wider border border-border/30 bg-secondary/20 text-foreground hover:border-primary/30 transition-colors disabled:opacity-50"
        >
          {scanning ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {t("admin.alerts.runScan")}
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["critical", "high", "medium", "low"] as AlertSeverity[]).map((sev) => {
          const st = SEVERITY_STYLES[sev];
          return (
            <div
              key={sev}
              className={`ethereal-glass px-4 py-3 border ${st.chip}`}
            >
              <span className="text-neural-label text-[10px] opacity-80">
                {st.emoji} {t(`admin.alerts.sev.${sev}` as never)}
              </span>
              <p className={`font-cinzel text-2xl tabular-nums ${st.text}`}>
                {counts[sev]}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="ethereal-glass p-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "critical", "high", "medium", "low"] as SeverityFilter[]).map(
            (id) => (
              <button
                key={id}
                type="button"
                onClick={() => setSeverityFilter(id)}
                className={`text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded-full border transition-all ${
                  severityFilter === id
                    ? "text-neural-accent border-neural-accent/30 bg-neural-accent/5"
                    : "text-muted-foreground border-border hover:border-muted-foreground/30"
                }`}
              >
                {id === "all"
                  ? t("admin.alerts.filter.all")
                  : t(`admin.alerts.sev.${id}` as never)}
              </button>
            ),
          )}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-secondary/20 border border-border/20 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/30"
        >
          <option value="">{t("admin.alerts.filter.allTypes")}</option>
          {types.map((tt) => (
            <option key={tt} value={tt}>
              {tt}
            </option>
          ))}
        </select>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="bg-secondary/20 border border-border/20 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/30"
        >
          <option value="">{t("admin.alerts.filter.allCompanies")}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="accent-primary"
          />
          {t("admin.alerts.filter.showResolved")}
        </label>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="ethereal-glass p-16 text-center border border-primary/15"
        >
          <CheckCircle2 className="mx-auto mb-4 text-primary" size={40} strokeWidth={1.25} />
          <p className="text-neural-title text-lg text-foreground">
            {t("admin.alerts.empty")}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a, i) => {
            const st = SEVERITY_STYLES[a.severity];
            const prof = profileMap.get(a.user_id);
            const title = locale === "fr" ? a.title_fr : a.title_en;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.2) }}
                className={`ethereal-glass p-4 flex flex-col sm:flex-row sm:items-center gap-4 border ${
                  a.is_resolved ? "border-border/20 opacity-60" : st.chip
                }`}
              >
                <div className="flex items-start gap-3 shrink-0">
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${st.dot}`} />
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${st.chip}`}
                  >
                    <AlertTriangle size={18} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {prof?.name ?? "—"}
                    </span>
                    {prof?.companyName && (
                      <span className="text-xs text-muted-foreground">
                        · {prof.companyName}
                      </span>
                    )}
                    <span
                      className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${st.chip}`}
                    >
                      {a.alert_type}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 mt-1">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDetail(a.detail, locale)}
                  </p>
                  <p className="text-[11px] text-neural-label text-neural-accent/50 mt-1">
                    {formatRelative(a.created_at, locale)}
                    {a.is_resolved && a.resolved_at
                      ? ` · ${locale === "fr" ? "résolu" : "resolved"} ${formatRelative(a.resolved_at, locale)}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/admin/analytics", {
                        state: { adminAnalyticsUserId: a.user_id },
                      })
                    }
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs border border-border/30 bg-secondary/20 text-foreground hover:border-primary/30 transition-colors"
                  >
                    <UserIcon size={14} />
                    {t("admin.alerts.viewProfile")}
                  </button>
                  {!a.is_resolved && (
                    <button
                      type="button"
                      onClick={() => handleResolve(a.id)}
                      disabled={resolving === a.id}
                      className="btn-neural text-xs py-2 px-3 disabled:opacity-50"
                    >
                      {resolving === a.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      {t("admin.alerts.resolve")}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

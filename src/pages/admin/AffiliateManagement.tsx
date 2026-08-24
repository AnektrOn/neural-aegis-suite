import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Handshake,
  MousePointerClick,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  type AdminAffiliateTracked,
  type AdminAffiliateTracking,
  type AdminCommission,
  type AffiliateCandidate,
  buildReferralLink,
  createAffiliate,
  fetchAffiliateCandidates,
  fetchAffiliatesAdminTracking,
  fetchCommissionsAdmin,
  formatMoney,
  setCommissionStatus,
  updateAffiliate,
} from "@/services/affiliateService";

const PLAN_LABELS: Record<string, string> = {
  aegis_ultra: "Ultra",
  aegis_matrix: "Matrice",
  ultra: "Ultra",
  matrix: "Matrice",
  free: "Initiation",
};

function n(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pct(part: number, total: number): string {
  if (!total) return "—";
  return `${Math.round((part / total) * 100)}%`;
}

function planLabel(plan: string | null | undefined): string {
  if (!plan) return "Initiation";
  const key = plan.replace("aegis_", "");
  return PLAN_LABELS[plan] ?? PLAN_LABELS[key] ?? plan;
}

export default function AffiliateManagement() {
  const [tracking, setTracking] = useState<AdminAffiliateTracking | null>(null);
  const [commissions, setCommissions] = useState<AdminCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [rate, setRate] = useState("20");
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<AffiliateCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    setCandidatesLoading(true);
    setCandidatesError(null);
    try {
      setCandidates(await fetchAffiliateCandidates());
    } catch (error) {
      setCandidatesError((error as Error).message || "Impossible de charger les membres");
    } finally {
      setCandidatesLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [trackingResult, commissionsResult] = await Promise.allSettled([
      fetchAffiliatesAdminTracking(30),
      fetchCommissionsAdmin(),
    ]);

    if (trackingResult.status === "fulfilled") {
      setTracking(trackingResult.value);
    } else {
      toast.error((trackingResult.reason as Error).message);
    }

    if (commissionsResult.status === "fulfilled") {
      setCommissions(commissionsResult.value);
    } else {
      toast.error((commissionsResult.reason as Error).message);
    }

    setLoading(false);
  }, []);

  const candidateLabel = (c: AffiliateCandidate) => {
    const name = c.display_name ? `${c.display_name} · ` : "";
    const last = c.last_active_at
      ? new Date(c.last_active_at).toLocaleDateString("fr-FR")
      : "jamais vu";
    return `${name}${c.email ?? c.user_id} — ${c.activity_count} logs · ${last}`;
  };

  useEffect(() => {
    void load();
    void loadCandidates();
  }, [load, loadCandidates]);

  const submit = async () => {
    if (!email.trim() || code.trim().length < 3) {
      toast.error("Email et code (3 caractères min.) requis");
      return;
    }
    setSaving(true);
    try {
      const res = await createAffiliate(email.trim(), code.trim(), Number(rate) / 100);
      if (!res?.ok) {
        const reasons: Record<string, string> = {
          unknown_user: "Aucun compte avec cet email",
          code_taken: "Ce code est déjà utilisé",
          invalid_code: "Code invalide",
        };
        toast.error(reasons[res?.reason ?? ""] ?? "Échec de la création");
        return;
      }
      toast.success("Ambassadeur créé");
      setEmail("");
      setCode("");
      await Promise.all([load(), loadCandidates()]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (a: AdminAffiliateTracked) => {
    await updateAffiliate(a.id, { status: a.status === "active" ? "paused" : "active" });
    await load();
  };

  const markPaid = async (ids: string[]) => {
    if (!ids.length) return;
    await setCommissionStatus(ids, "paid");
    toast.success("Commissions marquées comme payées");
    await load();
  };

  const unpaid = commissions.filter((c) => c.status !== "paid" && c.status !== "rejected");
  const kpis = tracking?.kpis;
  const funnel = tracking?.funnel;
  const daily = tracking?.daily ?? [];
  const affiliates = tracking?.affiliates ?? [];
  const maxDaily = Math.max(1, ...daily.map((d) => Math.max(d.clicks, d.signups, d.conversions)));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return affiliates;
    return affiliates.filter((a) =>
      [a.email, a.code, a.display_name, a.user_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [affiliates, query]);

  return (
    <div className="space-y-6 pb-16">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl tracking-wide">Ambassadeurs & affiliation</h1>
        <p className="text-sm text-muted-foreground">
          Suivi des clics, inscriptions et conversions depuis la base (affiliates, referrals, commissions).
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Handshake}
          label="Ambassadeurs actifs"
          value={`${n(kpis?.active)} / ${n(kpis?.affiliates)}`}
        />
        <KpiCard
          icon={MousePointerClick}
          label="Clics · 30 j"
          value={String(n(kpis?.clicks_30d))}
          hint={`${n(kpis?.clicks)} au total`}
        />
        <KpiCard
          icon={Users}
          label="Inscriptions · 30 j"
          value={String(n(kpis?.signups_30d))}
          hint={`${pct(n(kpis?.signups), n(kpis?.clicks))} des clics (tout temps)`}
        />
        <KpiCard
          icon={Wallet}
          label="Commissions 30 j"
          value={formatMoney(n(kpis?.commission_30d_cents))}
          hint={`Dû ${formatMoney(n(kpis?.pending_cents))} · versé ${formatMoney(n(kpis?.paid_cents))}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg">Activité 30 jours</h2>
            <span className="text-xs text-muted-foreground">
              {n(kpis?.conversions_30d)} conversions · {formatMoney(n(kpis?.gross_30d_cents))} encaissés
            </span>
          </div>
          {daily.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {loading ? "Chargement…" : "Pas encore de série quotidienne (déploie la migration tracking ou attends des clics)."}
            </p>
          ) : (
            <div className="flex h-28 items-end gap-px">
              {daily.map((d) => (
                <div key={d.day} className="flex min-w-0 flex-1 flex-col justify-end gap-px" title={`${d.day}: ${d.clicks} clics, ${d.signups} inscrits, ${d.conversions} conv.`}>
                  <span
                    className="w-full rounded-t-sm bg-primary/80"
                    style={{ height: `${Math.max(4, (d.clicks / maxDaily) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">Chaque barre = clics du jour. Survole pour le détail.</p>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="font-heading text-lg flex items-center gap-2">
            <TrendingUp size={16} /> Funnel
          </h2>
          <FunnelRow label="Clics" value={n(funnel?.clicks)} max={n(funnel?.clicks)} />
          <FunnelRow label="Inscriptions" value={n(funnel?.signups)} max={n(funnel?.clicks)} />
          <FunnelRow label="Conversions payantes" value={n(funnel?.conversions)} max={n(funnel?.clicks)} />
          <p className="text-xs text-muted-foreground">
            Taux clic → inscrit {pct(n(funnel?.signups), n(funnel?.clicks))} · inscrit → payant{" "}
            {pct(n(funnel?.conversions), n(funnel?.signups))}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-heading text-lg">Pages d'atterrissage</h2>
        {(tracking?.landing_paths ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucun clic enregistré pour le moment.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {(tracking?.landing_paths ?? []).map((p) => (
              <li key={p.path} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-mono text-xs">{p.path}</span>
                <Badge variant="outline">{p.clicks} clics</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-heading text-lg">Nommer un ambassadeur</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="aff-email">Membre (trié par activité récente)</Label>
            <select
              id="aff-email"
              value={email}
              disabled={candidatesLoading}
              onChange={(event) => {
                const candidate = candidates.find((item) => item.email === event.target.value);
                if (!candidate?.email) return;
                setEmail(candidate.email);
                if (!code) {
                  const local =
                    candidate.email
                      .split("@")[0]
                      ?.replace(/[^a-z0-9_-]/gi, "")
                      .toLowerCase() ?? "";
                  if (local.length >= 3) setCode(local);
                }
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {candidatesLoading ? "Chargement des membres…" : "Choisir un membre…"}
              </option>
              {candidates.map((candidate) => (
                <option key={candidate.user_id} value={candidate.email ?? ""} disabled={!candidate.email}>
                  {candidateLabel(candidate)}
                  {candidate.is_affiliate ? " · déjà ambassadeur" : ""}
                </option>
              ))}
            </select>
            {!candidatesLoading && candidatesError && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-destructive">{candidatesError}</p>
                <Button type="button" size="sm" variant="ghost" onClick={() => void loadCandidates()}>
                  Réessayer
                </Button>
              </div>
            )}
            {!candidatesLoading && !candidatesError && (
              <p className="text-xs text-muted-foreground">{candidates.length} membres disponibles</p>
            )}
          </div>

          <div>
            <Label htmlFor="aff-code">Code de parrainage</Label>
            <Input
              id="aff-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase())}
              placeholder="leo2026"
            />
          </div>
          <div>
            <Label htmlFor="aff-rate">Commission (%)</Label>
            <Input
              id="aff-rate"
              type="number"
              min={0}
              max={100}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={submit} disabled={saving}>
          {saving ? "Création…" : "Créer l'ambassadeur"}
        </Button>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg">Ambassadeurs</h2>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer par email, code, nom…"
            className="max-w-xs"
          />
        </div>
        {loading && <p className="mt-3 text-sm text-muted-foreground">Chargement…</p>}
        {!loading && filtered.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">Aucun ambassadeur pour le moment.</p>
        )}
        <div className="mt-4 space-y-3">
          {filtered.map((a) => {
            const open = expandedId === a.id;
            return (
              <div key={a.id} className="rounded-md border border-border/40">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{a.display_name ? `${a.display_name} · ` : ""}{a.email ?? a.user_id}</p>
                    <p className="break-all text-xs text-muted-foreground">{buildReferralLink(a.code)}</p>
                    {a.last_click_at ? (
                      <p className="text-[11px] text-muted-foreground">
                        Dernier clic {new Date(a.last_click_at).toLocaleString("fr-FR")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary">{Math.round(n(a.commission_rate) * 100)}%</Badge>
                    <Badge variant="outline">{n(a.clicks)} clics</Badge>
                    <Badge variant="outline">{n(a.signups)} inscrits</Badge>
                    <Badge variant="outline">{n(a.conversions)} conv.</Badge>
                    <Badge variant="outline">30j {n(a.clicks_30d)}/{n(a.signups_30d)}/{n(a.conversions_30d)}</Badge>
                    <Badge variant="outline">{pct(n(a.signups), n(a.clicks))} CTR→signup</Badge>
                    <Badge variant="outline">Dû {formatMoney(n(a.pending_cents))}</Badge>
                    <Badge variant="outline">Versé {formatMoney(n(a.paid_cents))}</Badge>
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(a)}>
                      {a.status === "active" ? "Mettre en pause" : "Réactiver"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(open ? null : a.id)}
                      aria-expanded={open}
                    >
                      <ChevronDown size={14} className={open ? "rotate-180" : ""} />
                    </Button>
                  </div>
                </div>
                {open ? (
                  <div className="space-y-3 border-t border-border/40 p-3 text-sm">
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Filleuls récents</p>
                      {(a.recent_referrals ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">Aucun filleul encore.</p>
                      ) : (
                        <ul className="space-y-1">
                          {(a.recent_referrals ?? []).map((r) => (
                            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                              <span>
                                {r.label}
                                {r.email ? ` · ${r.email}` : ""}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {planLabel(r.plan)} · {r.status} ·{" "}
                                {new Date(r.created_at).toLocaleDateString("fr-FR")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {(a.top_paths ?? []).length > 0 ? (
                      <div>
                        <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Top landings</p>
                        <ul className="space-y-1 text-xs">
                          {(a.top_paths ?? []).map((p) => (
                            <li key={`${a.id}-${p.path}`} className="flex justify-between gap-2 font-mono">
                              <span className="truncate">{p.path}</span>
                              <span>{p.clicks}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg">Commissions</h2>
          <Button
            size="sm"
            variant="outline"
            disabled={!unpaid.length}
            onClick={() => markPaid(unpaid.map((c) => c.id))}
          >
            Tout marquer payé ({unpaid.length})
          </Button>
        </div>
        {commissions.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">Aucune commission enregistrée.</p>
        )}
        <div className="mt-4 space-y-2">
          {commissions.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">
                  {formatMoney(c.commission_cents, c.currency)}{" "}
                  <span className="text-xs text-muted-foreground">
                    sur {formatMoney(c.amount_cents, c.currency)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.affiliate_code} · filleul {c.referred_email ?? "—"} ·{" "}
                  {new Date(c.occurred_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={c.status === "paid" ? "default" : "outline"}>{c.status}</Badge>
                {c.status !== "paid" && (
                  <Button size="sm" variant="outline" onClick={() => markPaid([c.id])}>
                    Marquer payé
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Handshake;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="space-y-2 p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon size={14} /> {label}
      </p>
      <p className="font-heading text-2xl">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 8;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Check,
  Users,
  MousePointerClick,
  TrendingUp,
  Wallet,
  ArrowUpDown,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  type AffiliateDashboard,
  type AffiliateReferralRow,

  buildReferralLink,
  fetchMyAffiliateDashboard,
  formatMoney,
} from "@/services/affiliateService";
import UltraDiscountTier from "@/components/ambassador/UltraDiscountTier";

const COPY: Record<string, { fr: string; en: string }> = {
  title: { fr: "Programme Ambassadeur", en: "Ambassador program" },
  subtitle: {
    fr: "Partagez AEGIS et percevez une commission récurrente sur chaque abonnement.",
    en: "Share AEGIS and earn a recurring commission on every subscription.",
  },
  notMember: { fr: "Vous n'êtes pas encore ambassadeur", en: "You are not an ambassador yet" },
  notMemberDesc: {
    fr: "Le programme est sur invitation. Contactez-nous si vous souhaitez rejoindre le cercle des ambassadeurs AEGIS.",
    en: "The program is invitation-only. Reach out if you want to join the AEGIS ambassador circle.",
  },
  yourLink: { fr: "Votre lien de parrainage", en: "Your referral link" },
  copy: { fr: "Copier", en: "Copy" },
  copied: { fr: "Lien copié", en: "Link copied" },
  clicks: { fr: "Clics", en: "Clicks" },
  signups: { fr: "Inscriptions", en: "Sign-ups" },
  conversions: { fr: "Conversions", en: "Conversions" },
  pending: { fr: "En attente", en: "Pending" },
  paid: { fr: "Déjà versé", en: "Paid out" },
  rate: { fr: "Taux de commission", en: "Commission rate" },
  referrals: { fr: "Vos filleuls", en: "Your referrals" },
  commissions: { fr: "Vos commissions", en: "Your commissions" },
  empty: { fr: "Aucune donnée pour le moment.", en: "No data yet." },
  paused: { fr: "En pause", en: "Paused" },
  statusSignedUp: { fr: "Inscrit", en: "Signed up" },
  statusConverted: { fr: "Converti", en: "Converted" },
  payoutNote: {
    fr: "Les commissions sont validées puis versées manuellement par l'équipe AEGIS.",
    en: "Commissions are reviewed then paid out manually by the AEGIS team.",
  },
  colMember: { fr: "Membre", en: "Member" },
  colSignup: { fr: "Inscription", en: "Signed up" },
  colPlan: { fr: "Formule", en: "Plan" },
  colCycle: { fr: "Cycle", en: "Billing" },
  cycleMonthly: { fr: "Mensuel", en: "Monthly" },
  cycleYearly: { fr: "Annuel", en: "Yearly" },
  cycleInstallment: { fr: "6 × mensualités", en: "6 installments" },
  colStatus: { fr: "Statut", en: "Status" },
  colRenewal: { fr: "Renouvellement", en: "Renewal" },
  colPayments: { fr: "Paiements", en: "Payments" },
  colGross: { fr: "Encaissé", en: "Billed" },
  colEarned: { fr: "Commissions", en: "Earned" },

  cancels: { fr: "résiliation prévue", en: "cancels at period end" },
  searchPlaceholder: { fr: "Rechercher un filleul", en: "Search a referral" },
  allPlans: { fr: "Toutes les formules", en: "All plans" },
  allStatuses: { fr: "Tous les statuts", en: "All statuses" },
  catAll: { fr: "Tous", en: "All" },
  catPaid: { fr: "Abonnés (Matrice / Ultra)", en: "Subscribers (Matrix / Ultra)" },
  catFree: { fr: "Inscrits sans abonnement", en: "Signed up, no subscription" },
  catFreeNote: {
    fr: "Comptes créés via ton lien mais qui n'ont pas encore souscrit.",
    en: "Accounts created through your link that haven't subscribed yet.",
  },
};


type SortKey =
  | "label"
  | "created_at"
  | "plan"
  | "billing_cycle"
  | "status"
  | "current_period_end"
  | "payments_count"
  | "gross_cents"
  | "commission_cents";

const SORT_COLUMNS: { key: SortKey; label: keyof typeof COPY }[] = [
  { key: "label", label: "colMember" },
  { key: "created_at", label: "colSignup" },
  { key: "plan", label: "colPlan" },
  { key: "status", label: "colStatus" },
  { key: "current_period_end", label: "colRenewal" },
  { key: "payments_count", label: "colPayments" },
  { key: "gross_cents", label: "colGross" },
  { key: "commission_cents", label: "colEarned" },

];

const PLAN_LABELS: Record<string, string> = {
  aegis_ultra: "Ultra",
  aegis_matrix: "Matrice",
  ultra: "Ultra",
  matrix: "Matrice",
  free: "Initiation",
};

function planLabel(plan?: string | null): string {
  if (!plan) return PLAN_LABELS.free;
  return PLAN_LABELS[plan] ?? plan;
}

function isPaidReferral(r: AffiliateReferralRow): boolean {
  const plan = (r.plan ?? "free").replace("aegis_", "");
  if (plan === "matrix" || plan === "ultra") return true;
  if ((r.commission_cents ?? 0) > 0) return true;
  if ((r.payments_count ?? 0) > 0) return true;
  return false;
}


export default function Ambassador() {
  const { locale } = useLanguage();
  const tr = (k: keyof typeof COPY) => COPY[k][locale === "en" ? "en" : "fr"];
  const [data, setData] = useState<AffiliateDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [category, setCategory] = useState<"all" | "paid" | "free">("all");

  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchMyAffiliateDashboard()
      .then(setData)
      .catch(() => setData({ is_affiliate: false }))
      .finally(() => setLoading(false));
  }, []);

  const link = data?.code ? buildReferralLink(data.code) : "";
  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR") : "—";

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(tr("copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const allRows = data?.referrals ?? [];
  const paidCount = useMemo(() => allRows.filter(isPaidReferral).length, [allRows]);
  const freeCount = allRows.length - paidCount;

  const visibleReferrals = useMemo(() => {
    const rows = [...allRows];
    const q = search.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      const normalizedPlan = (r.plan ?? "free").replace("aegis_", "");
      if (category === "paid" && !isPaidReferral(r)) return false;
      if (category === "free" && isPaidReferral(r)) return false;
      if (planFilter !== "all" && normalizedPlan !== planFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q && !r.label.toLowerCase().includes(q)) return false;
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [allRows, search, category, planFilter, statusFilter, sortKey, sortDir]);


  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!data?.is_affiliate) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Card className="p-8 text-center">
          <h1 className="font-heading text-2xl">{tr("title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{tr("notMember")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{tr("notMemberDesc")}</p>
        </Card>
      </div>
    );
  }

  const stats = [
    { icon: MousePointerClick, label: tr("clicks"), value: String(data.clicks ?? 0) },
    { icon: Users, label: tr("signups"), value: String(data.signups ?? 0) },
    { icon: TrendingUp, label: tr("conversions"), value: String(data.conversions ?? 0) },
    {
      icon: Wallet,
      label: tr("pending"),
      value: formatMoney(data.pending_cents ?? 0, "EUR", locale === "en" ? "en-GB" : "fr-FR"),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl tracking-wide">{tr("title")}</h1>
        <p className="text-sm text-muted-foreground">{tr("subtitle")}</p>
      </header>

      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{tr("yourLink")}</p>
            <p className="mt-1 break-all font-mono text-sm">{link}</p>
          </div>
          <div className="flex items-center gap-2">
            {data.status !== "active" && <Badge variant="outline">{tr("paused")}</Badge>}
            <Badge variant="secondary">
              {tr("rate")} · {Math.round((data.commission_rate ?? 0) * 100)}%
            </Badge>
            <Button onClick={copy} size="sm" variant="outline">
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {tr("copy")}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{tr("payoutNote")}</p>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className="h-4 w-4 text-primary" strokeWidth={1.2} />
            <p className="mt-3 text-xl font-medium">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <UltraDiscountTier totalCents={(data.pending_cents ?? 0) + (data.paid_cents ?? 0)} />



      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg">{tr("referrals")}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tr("searchPlaceholder")}
              aria-label={tr("searchPlaceholder")}
              className="h-9 rounded-md border border-border/50 bg-transparent px-3 text-sm outline-none focus:border-primary/60"
            />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              aria-label={tr("colPlan")}
              className="h-9 rounded-md border border-border/50 bg-transparent px-2 text-sm"
            >
              <option value="all">{tr("allPlans")}</option>
              <option value="free">Initiation</option>
              <option value="matrix">Matrice</option>
              <option value="ultra">Ultra</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label={tr("colStatus")}
              className="h-9 rounded-md border border-border/50 bg-transparent px-2 text-sm"
            >
              <option value="all">{tr("allStatuses")}</option>
              <option value="converted">{tr("statusConverted")}</option>
              <option value="pending">{tr("statusSignedUp")}</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {([
            { key: "all", label: tr("catAll"), count: allRows.length },
            { key: "paid", label: tr("catPaid"), count: paidCount },
            { key: "free", label: tr("catFree"), count: freeCount },
          ] as const).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setCategory(t.key)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                category === t.key
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label} · {t.count}
            </button>
          ))}
        </div>
        {category === "free" && (
          <p className="mt-2 text-xs text-muted-foreground">{tr("catFreeNote")}</p>
        )}

        {visibleReferrals.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{tr("empty")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  {SORT_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={`py-2 font-normal ${col.key === "commission_cents" ? "text-right" : "pr-3"}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 uppercase tracking-widest transition-colors hover:text-foreground"
                      >
                        {tr(col.label)}
                        <ArrowUpDown
                          className={`h-3 w-3 ${sortKey === col.key ? "text-primary" : "opacity-40"}`}
                          strokeWidth={1.4}
                        />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleReferrals.map((r) => (
                  <tr key={r.id} className="border-b border-border/20 last:border-0">
                    <td className="py-2.5 pr-3 font-medium">{r.label}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{fmtDate(r.created_at)}</td>
                    <td className="py-2.5 pr-3">
                      <Badge variant={r.plan && r.plan !== "free" ? "default" : "outline"}>
                        {planLabel(r.plan)}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant={r.status === "converted" ? "secondary" : "outline"}>
                        {r.status === "converted" ? tr("statusConverted") : tr("statusSignedUp")}
                      </Badge>
                      {r.plan_status && r.plan_status !== "none" && (
                        <span className="ml-2 text-xs text-muted-foreground">{r.plan_status}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {r.current_period_end ? fmtDate(r.current_period_end) : "—"}
                      {r.cancel_at_period_end ? ` · ${tr("cancels")}` : ""}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{r.payments_count ?? 0}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {formatMoney(r.gross_cents ?? 0, "EUR", locale === "en" ? "en-GB" : "fr-FR")}
                    </td>

                    <td className="py-2.5 text-right font-medium">
                      {formatMoney(r.commission_cents ?? 0, "EUR", locale === "en" ? "en-GB" : "fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-4">
        <Card className="p-5">
          <h2 className="font-heading text-lg">{tr("commissions")}</h2>
          <div className="mt-4 space-y-2">
            {(data.commissions ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">{tr("empty")}</p>
            )}
            {(data.commissions ?? []).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {formatMoney(c.commission_cents, c.currency, locale === "en" ? "en-GB" : "fr-FR")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.occurred_at).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR")}
                    {c.product_id ? ` · ${c.product_id}` : ""}
                  </p>
                </div>
                <Badge variant={c.status === "paid" ? "default" : "outline"}>{c.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

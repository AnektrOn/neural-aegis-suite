import { useEffect, useState } from "react";
import { Copy, Check, Users, MousePointerClick, TrendingUp, Wallet } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  type AffiliateDashboard,
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
};

export default function Ambassador() {
  const { locale } = useLanguage();
  const tr = (k: keyof typeof COPY) => COPY[k][locale === "en" ? "en" : "fr"];
  const [data, setData] = useState<AffiliateDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchMyAffiliateDashboard()
      .then(setData)
      .catch(() => setData({ is_affiliate: false }))
      .finally(() => setLoading(false));
  }, []);

  const link = data?.code ? buildReferralLink(data.code) : "";

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(tr("copied"));
    setTimeout(() => setCopied(false), 2000);
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



      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-heading text-lg">{tr("referrals")}</h2>
          <div className="mt-4 space-y-2">
            {(data.referrals ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">{tr("empty")}</p>
            )}
            {(data.referrals ?? []).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2 text-sm"
              >
                <span>{r.label}</span>
                <Badge variant={r.status === "converted" ? "default" : "outline"}>
                  {r.status === "converted" ? tr("statusConverted") : tr("statusSignedUp")}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

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

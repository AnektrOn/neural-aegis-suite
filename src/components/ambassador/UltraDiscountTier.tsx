import { Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatMoney } from "@/services/affiliateService";

/** Commission generated per month by one Matrix subscription (10% of 39€). */
export const MATRIX_COMMISSION_CENTS = 390;

type Tier = {
  id: string;
  discount: number;
  minCents: number;
  maxCents: number | null;
  fr: string;
  en: string;
};

export const ULTRA_TIERS: Tier[] = [
  { id: "starter", discount: 15, minCents: 0, maxCents: 30000, fr: "Palier Starter", en: "Starter tier" },
  { id: "growth", discount: 30, minCents: 30000, maxCents: 75000, fr: "Palier Growth", en: "Growth tier" },
  { id: "partner", discount: 50, minCents: 75000, maxCents: 150000, fr: "Palier Partner", en: "Partner tier" },
  { id: "top", discount: 100, minCents: 150000, maxCents: null, fr: "Palier Top Partner", en: "Top Partner tier" },
];

export function resolveUltraTier(totalCents: number): Tier {
  return (
    [...ULTRA_TIERS].reverse().find((t) => totalCents >= t.minCents) ?? ULTRA_TIERS[0]
  );
}

const matrixEq = (cents: number) => Math.floor(cents / MATRIX_COMMISSION_CENTS);

export default function UltraDiscountTier({ totalCents }: { totalCents: number }) {
  const { locale } = useLanguage();
  const en = locale === "en";
  const intl = en ? "en-GB" : "fr-FR";
  const tier = resolveUltraTier(totalCents);
  const next = ULTRA_TIERS[ULTRA_TIERS.indexOf(tier) + 1];
  const progress = next
    ? Math.min(100, ((totalCents - tier.minCents) / (next.minCents - tier.minCents)) * 100)
    : 100;

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg tracking-wide">
            {en ? "Your Ultra discount tier" : "Votre palier de réduction Ultra"}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {en
              ? "Your Ultra discount is based on the total commissions you earn from your referrals (10% revenue share on all paid plans)."
              : "Votre réduction Ultra dépend du total des commissions générées par vos filleuls (10 % de reversement sur tous les forfaits payants)."}
          </p>
        </div>
        <Crown className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.2} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border/40 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {en ? "Total commissions" : "Commissions totales"}
          </p>
          <p className="mt-2 text-xl font-medium">{formatMoney(totalCents, "EUR", intl)}</p>
        </div>
        <div className="rounded-lg border border-border/40 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {en ? "Matrix equivalents" : "Équivalents Matrice"}
          </p>
          <p className="mt-2 text-xl font-medium">{matrixEq(totalCents)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {en
              ? "Each Matrix subscription contributes €3.90/month in commissions."
              : "Chaque abonnement Matrice génère 3,90 €/mois de commission."}
          </p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {en ? "Current Ultra discount" : "Réduction Ultra actuelle"}
          </p>
          <p className="mt-2 text-xl font-medium text-primary">{tier.discount} %</p>
          <p className="mt-1 text-xs text-muted-foreground">{en ? tier.en : tier.fr}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-1.5" />
        <p className="text-xs text-muted-foreground">
          {next
            ? en
              ? `${formatMoney(next.minCents - totalCents, "EUR", intl)} left to reach ${next.en} (${next.discount}% off).`
              : `Encore ${formatMoney(next.minCents - totalCents, "EUR", intl)} pour atteindre le ${next.fr} (${next.discount} % de réduction).`
            : en
              ? "Maximum tier reached — your Ultra plan is free."
              : "Palier maximum atteint — votre forfait Ultra est offert."}
        </p>
      </div>

      <div className="space-y-2">
        {ULTRA_TIERS.map((t) => {
          const active = t.id === tier.id;
          const range = en
            ? t.maxCents === null
              ? `Total commissions ≥ ${formatMoney(t.minCents, "EUR", intl)}`
              : t.minCents === 0
                ? `Total commissions < ${formatMoney(t.maxCents, "EUR", intl)}`
                : `${formatMoney(t.minCents, "EUR", intl)} – ${formatMoney(t.maxCents, "EUR", intl)}`
            : t.maxCents === null
              ? `Commissions totales ≥ ${formatMoney(t.minCents, "EUR", intl)}`
              : t.minCents === 0
                ? `Commissions totales < ${formatMoney(t.maxCents, "EUR", intl)}`
                : `${formatMoney(t.minCents, "EUR", intl)} – ${formatMoney(t.maxCents, "EUR", intl)}`;
          const eq =
            t.maxCents === null
              ? `${matrixEq(t.minCents)}+`
              : t.minCents === 0
                ? `< ${matrixEq(t.maxCents)}`
                : `${matrixEq(t.minCents)} – ${matrixEq(t.maxCents)}`;
          return (
            <div
              key={t.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                active ? "border-primary/50 bg-primary/5" : "border-border/40"
              }`}
            >
              <div>
                <p className="font-medium">{en ? t.en : t.fr}</p>
                <p className="text-xs text-muted-foreground">
                  {range} · {en ? "approx." : "environ"} {eq} {en ? "Matrix equivalents" : "équivalents Matrice"}
                </p>
              </div>
              <Badge variant={active ? "default" : "outline"}>
                {t.discount === 100
                  ? en
                    ? "100% (Ultra free)"
                    : "100 % (Ultra offert)"
                  : `${t.discount} %`}
              </Badge>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {en
          ? "Your discount updates automatically as your total commissions grow. Once you reach €1,500 in total commissions (≈ 385 Matrix equivalents), your Ultra plan is free for as long as this condition holds."
          : "Votre réduction évolue automatiquement avec vos commissions. Dès 1 500 € de commissions cumulées (≈ 385 équivalents Matrice), votre forfait Ultra est offert tant que cette condition est remplie."}
      </p>
    </Card>
  );
}

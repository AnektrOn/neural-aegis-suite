import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  type AdminAffiliate,
  type AdminCommission,
  buildReferralLink,
  createAffiliate,
  fetchAffiliatesAdmin,
  fetchCommissionsAdmin,
  formatMoney,
  setCommissionStatus,
  updateAffiliate,
} from "@/services/affiliateService";

export default function AffiliateManagement() {
  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([]);
  const [commissions, setCommissions] = useState<AdminCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [rate, setRate] = useState("20");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([fetchAffiliatesAdmin(), fetchCommissionsAdmin()]);
      setAffiliates(a);
      setCommissions(c);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (a: AdminAffiliate) => {
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

  return (
    <div className="space-y-6 pb-16">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl tracking-wide">Ambassadeurs & affiliation</h1>
        <p className="text-sm text-muted-foreground">
          Nommez des ambassadeurs, suivez les conversions et réglez les commissions manuellement.
        </p>
      </header>

      <Card className="space-y-4 p-5">
        <h2 className="font-heading text-lg">Nommer un ambassadeur</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label htmlFor="aff-email">Email du membre</Label>
            <Input
              id="aff-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="membre@exemple.com"
            />
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
        <h2 className="font-heading text-lg">Ambassadeurs</h2>
        {loading && <p className="mt-3 text-sm text-muted-foreground">Chargement…</p>}
        {!loading && affiliates.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">Aucun ambassadeur pour le moment.</p>
        )}
        <div className="mt-4 space-y-3">
          {affiliates.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/40 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{a.email ?? a.user_id}</p>
                <p className="break-all text-xs text-muted-foreground">{buildReferralLink(a.code)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">{Math.round(a.commission_rate * 100)}%</Badge>
                <Badge variant="outline">{a.clicks} clics</Badge>
                <Badge variant="outline">{a.signups} inscrits</Badge>
                <Badge variant="outline">{a.conversions} conv.</Badge>
                <Badge variant="outline">Dû {formatMoney(a.pending_cents)}</Badge>
                <Badge variant="outline">Versé {formatMoney(a.paid_cents)}</Badge>
                <Button size="sm" variant="outline" onClick={() => toggleStatus(a)}>
                  {a.status === "active" ? "Mettre en pause" : "Réactiver"}
                </Button>
              </div>
            </div>
          ))}
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

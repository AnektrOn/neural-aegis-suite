import { useState } from "react";
import { Award, Loader2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAffiliateByUser, revokeAffiliateByUser } from "@/services/affiliateService";

interface Props {
  userId: string;
  displayName: string | null;
  isAffiliate?: boolean;
  affiliateCode?: string | null;
  onChanged?: () => void;
}

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);

export default function AmbassadorForm({ userId, displayName, isAffiliate, affiliateCode, onChanged }: Props) {
  const { toast } = useToast();
  const [code, setCode] = useState(affiliateCode || slugify(displayName || "") || "");
  const [rate, setRate] = useState("20");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const clean = slugify(code);
    if (clean.length < 3) {
      toast({ title: "Code invalide", description: "3 caractères minimum.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const res = await createAffiliateByUser(userId, clean, Number(rate) / 100);
      if (!res?.ok) {
        toast({
          title: "Impossible",
          description: res?.reason === "code_taken" ? "Ce code est déjà utilisé." : res?.reason || "Erreur",
          variant: "destructive",
        });
      } else {
        toast({ title: "Ambassadeur activé", description: `Code : ${res.code ?? clean}` });
        onChanged?.();
      }
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    setBusy(true);
    try {
      await revokeAffiliateByUser(userId);
      toast({ title: "Statut ambassadeur retiré" });
      onChanged?.();
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-neural-label mb-2 flex items-center gap-2">
        <Award size={12} className="text-neural-accent" /> Programme ambassadeur
        {isAffiliate && (
          <span className="text-[8px] uppercase tracking-[0.3em] px-2 py-0.5 rounded-full bg-neural-accent/10 text-neural-accent border border-neural-accent/20">
            Actif
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="code-parrainage"
          className="bg-secondary/20 border border-border/20 rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30"
        />
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-20 bg-secondary/20 border border-border/20 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-neural-accent/30"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neural-accent/30 text-neural-accent text-sm hover:bg-neural-accent/10 transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
          {isAffiliate ? "Mettre à jour" : "Nommer ambassadeur"}
        </button>
        {isAffiliate && (
          <button
            type="button"
            onClick={revoke}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/30 text-destructive text-sm hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <XCircle size={14} /> Retirer
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Le lien de parrainage devient disponible dans son espace Ambassadeur.
      </p>
    </div>
  );
}

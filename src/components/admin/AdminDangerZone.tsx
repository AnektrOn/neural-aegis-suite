import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  userId: string;
  displayName: string | null;
  isSelf: boolean;
  onDeleted?: () => void;
}

interface SubRow {
  id: string;
  paddle_subscription_id: string | null;
  product_id: string | null;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
}

export default function AdminDangerZone({ userId, displayName, isSelf, onDeleted }: Props) {
  const { toast } = useToast();
  const [subs, setSubs] = useState<SubRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState("");

  const call = async (fn: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke(fn, {
      body: { user_id: userId, ...payload },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const loadSubs = async () => {
    try {
      const data = await call("admin-subscription", { action: "list" });
      setSubs(data?.subscriptions ?? []);
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    }
  };

  useEffect(() => {
    loadSubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const cancel = async (action: "cancel" | "cancel_now") => {
    setBusy(action);
    try {
      const res = await call("admin-subscription", { action });
      toast({
        title: "Abonnement résilié",
        description:
          res?.mode === "immediate"
            ? "Accès coupé immédiatement."
            : "Résiliation à la fin de la période en cours.",
      });
      await loadSubs();
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const removeAccount = async () => {
    setBusy("delete");
    try {
      await call("admin-update-user", { action: "delete" });
      toast({ title: "Compte supprimé", description: displayName || userId });
      onDeleted?.();
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const active = (subs ?? []).find(
    (s) => s.status === "active" || s.status === "trialing" || s.status === "past_due",
  );

  return (
    <div className="space-y-4 rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-4">
      <p className="text-neural-label flex items-center gap-2 text-destructive/80">
        <AlertTriangle size={13} /> Zone sensible
      </p>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <CreditCard size={13} className="text-muted-foreground" />
          {subs === null ? (
            <span className="text-muted-foreground">Chargement de l'abonnement…</span>
          ) : active ? (
            <span>
              {active.product_id ?? "Abonnement"} — {active.status}
              {active.cancel_at_period_end ? " (résiliation programmée)" : ""}
              {active.current_period_end
                ? ` · fin le ${new Date(active.current_period_end).toLocaleDateString("fr-FR")}`
                : ""}
            </span>
          ) : (
            <span className="text-muted-foreground">Aucun abonnement actif</span>
          )}
        </div>

        {active && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => cancel("cancel")}
              disabled={!!busy || !!active.cancel_at_period_end}
              className="px-3 py-1.5 rounded-xl border border-border/30 text-xs uppercase tracking-[0.2em] text-foreground hover:bg-secondary/30 transition-colors disabled:opacity-40 inline-flex items-center gap-2"
            >
              {busy === "cancel" && <Loader2 size={12} className="animate-spin" />}
              Résilier en fin de période
            </button>
            <button
              type="button"
              onClick={() => cancel("cancel_now")}
              disabled={!!busy}
              className="px-3 py-1.5 rounded-xl border border-destructive/40 text-xs uppercase tracking-[0.2em] text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 inline-flex items-center gap-2"
            >
              {busy === "cancel_now" && <Loader2 size={12} className="animate-spin" />}
              Résilier immédiatement
            </button>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-border/20 space-y-2">
        <p className="text-xs text-muted-foreground">
          Supprimer définitivement le compte et toutes ses données. Irréversible.
          {isSelf && " (impossible sur votre propre compte)"}
        </p>
        {!isSelf && (
          <div className="flex flex-wrap gap-2">
            <input
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder="Taper SUPPRIMER pour confirmer"
              className="flex-1 min-w-[220px] bg-secondary/20 border border-border/20 rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-destructive/40"
            />
            <button
              type="button"
              onClick={removeAccount}
              disabled={!!busy || confirmDelete.trim().toUpperCase() !== "SUPPRIMER"}
              className="px-4 py-2 rounded-xl border border-destructive/40 text-destructive text-xs uppercase tracking-[0.2em] hover:bg-destructive/10 transition-colors disabled:opacity-40 inline-flex items-center gap-2"
            >
              {busy === "delete" ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Supprimer le compte
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { KeyRound, Mail, Loader2, Eye, EyeOff, RefreshCw, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  userId: string;
  displayName: string | null;
}

function generatePassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  const arr = new Uint32Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

export default function AdminCredentialsForm({ userId, displayName }: Props) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const invoke = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-update-user", {
      body: { user_id: userId, ...payload },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const loadEmail = async () => {
    setFetching(true);
    try {
      const data = await invoke({ action: "get" });
      setCurrentEmail(data?.user?.email ?? null);
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const submit = async () => {
    if (!password && !email) return;
    setLoading(true);
    try {
      await invoke({ action: "update", password: password || undefined, email: email || undefined });
      toast({
        title: "Identifiants mis à jour",
        description: `${displayName || "Utilisateur"} — ${password ? "mot de passe" : ""}${password && email ? " et " : ""}${email ? "email" : ""} modifié.`,
      });
      if (email) setCurrentEmail(email);
      setPassword("");
      setEmail("");
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-neural-label">Identifiants de connexion</p>
        <button
          type="button"
          onClick={loadEmail}
          disabled={fetching}
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-neural-accent transition-colors inline-flex items-center gap-1"
        >
          {fetching ? <Loader2 size={11} className="animate-spin" /> : <Mail size={11} />}
          {currentEmail ?? "Voir l'email"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <KeyRound size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nouveau mot de passe (8+ caractères)"
            autoComplete="new-password"
            className="w-full bg-secondary/20 border border-border/20 rounded-xl pl-9 pr-16 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button type="button" onClick={() => setShow((s) => !s)} className="p-1 text-muted-foreground hover:text-foreground" title="Afficher">
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button
              type="button"
              onClick={() => { setPassword(generatePassword()); setShow(true); }}
              className="p-1 text-muted-foreground hover:text-neural-accent"
              title="Générer"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Nouvel email (optionnel)"
          className="flex-1 min-w-[200px] bg-secondary/20 border border-border/20 rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30"
        />

        <button
          type="button"
          onClick={submit}
          disabled={loading || (!password && !email)}
          className="px-4 py-2 rounded-xl border border-neural-accent/30 text-neural-accent text-xs uppercase tracking-[0.2em] hover:bg-neural-accent/10 transition-colors disabled:opacity-40 inline-flex items-center gap-2"
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          Mettre à jour
        </button>
      </div>
    </div>
  );
}

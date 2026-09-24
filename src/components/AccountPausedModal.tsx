import { useEffect, useState } from "react";
import { PauseCircle, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";

/** Blocking modal shown when an admin has paused the signed-in account. */
export default function AccountPausedModal() {
  const { user, signOut } = useAuth();
  const { language } = useLanguage() as { language: string };
  const [paused, setPaused] = useState<{ reason: string | null } | null>(null);

  useEffect(() => {
    if (!user) { setPaused(null); return; }
    let alive = true;
    const check = async () => {
      const { data } = await supabase
        .from("account_pauses")
        .select("reason")
        .eq("user_id", user.id)
        .maybeSingle();
      if (alive) setPaused(data ? { reason: data.reason } : null);
    };
    void check();
    const id = window.setInterval(check, 60_000);
    return () => { alive = false; window.clearInterval(id); };
  }, [user]);

  if (!paused) return null;
  const en = language === "en";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-md p-6">
      <div className="max-w-md w-full rounded-2xl border border-border/30 bg-card/80 p-8 text-center space-y-5">
        <PauseCircle size={40} strokeWidth={1} className="mx-auto text-primary" />
        <h2 className="font-display text-xl tracking-[0.15em] uppercase text-foreground">
          {en ? "Your account is currently paused" : "Votre compte est actuellement en pause"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {en
            ? "Access to Aegis is temporarily suspended. Please contact your coach for more information."
            : "L'accès à Aegis est temporairement suspendu. Contactez votre coach pour plus d'informations."}
        </p>
        {paused.reason && <p className="text-sm text-foreground/80 italic">« {paused.reason} »</p>}
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/30 text-xs uppercase tracking-[0.2em] text-foreground hover:bg-secondary/30"
        >
          <LogOut size={12} /> {en ? "Sign out" : "Se déconnecter"}
        </button>
      </div>
    </div>
  );
}

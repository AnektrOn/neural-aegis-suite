import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NeuralCard } from "@/components/ui/neural-card";
import aegisLogo from "@/assets/aegis-logo.png";

const inputCls =
  "w-full bg-bg-base border border-border-active rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 transition-all duration-200";

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const hash = window.location.hash || "";
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setRecoveryReady(true);
    }
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const requestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast({
        title: "E-mail envoyé",
        description: "Consultez votre boîte de réception pour réinitialiser votre mot de passe.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Erreur", description: "8 caractères minimum.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Mot de passe mis à jour", description: "Vous pouvez maintenant vous connecter." });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <img src={aegisLogo} alt="Aegis" className="h-16 w-auto opacity-90" />
        </div>

        <NeuralCard className="p-6 space-y-5">
          <h1 className="font-display text-lg tracking-[0.15em] uppercase text-text-primary text-center">
            {recoveryReady ? "Nouveau mot de passe" : "Mot de passe oublié"}
          </h1>

          {recoveryReady ? (
            <form onSubmit={updatePassword} className="space-y-4">
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  placeholder="Nouveau mot de passe (8+ caractères)"
                  autoComplete="new-password"
                  className={`${inputCls} pl-9 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg border border-accent-primary/40 text-accent-primary text-xs uppercase tracking-[0.2em] hover:bg-accent-primary/10 transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                Mettre à jour
              </button>
            </form>
          ) : (
            <form onSubmit={requestLink} className="space-y-4">
              <p className="text-xs text-text-tertiary text-center leading-relaxed">
                Saisissez votre adresse e-mail : un lien de réinitialisation vous sera envoyé.
              </p>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  className={`${inputCls} pl-9`}
                />
              </div>
              <button
                type="submit"
                disabled={loading || sent}
                className="w-full py-2.5 rounded-lg border border-accent-primary/40 text-accent-primary text-xs uppercase tracking-[0.2em] hover:bg-accent-primary/10 transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                {sent ? "E-mail envoyé" : "Envoyer le lien"}
              </button>
            </form>
          )}

          <div className="text-center">
            <Link to="/auth" className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary hover:text-accent-primary">
              Retour à la connexion
            </Link>
          </div>
        </NeuralCard>
      </motion.div>
    </div>
  );
}

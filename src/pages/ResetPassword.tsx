import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NeuralCard } from "@/components/ui/neural-card";
import AegisLogo from "@/components/AegisLogo";
import { signupPasswordIssues } from "@/lib/passwordPolicy";
import { useLanguage } from "@/i18n/LanguageContext";

const inputCls =
  "w-full bg-bg-base border border-border-active rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 transition-all duration-200";

interface ResetPasswordProps {
  setupOnly?: boolean;
}

export default function ResetPassword({ setupOnly = false }: ResetPasswordProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setRecoveryReady(true);
      }
    });

    const consume = async () => {
      const hash = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
      const query = new URLSearchParams(window.location.search);

      const errorDesc = hash.get("error_description") || query.get("error_description");
      if (errorDesc) {
        setLinkError(
          /expired|invalid/i.test(errorDesc)
            ? t("resetPassword.linkExpired")
            : errorDesc,
        );
        window.history.replaceState({}, "", window.location.pathname);
        setCheckingLink(false);
        return;
      }

      // Implicit flow: tokens in the URL hash
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        window.history.replaceState({}, "", window.location.pathname);
        if (!cancelled) {
          if (error) setLinkError(t("resetPassword.linkInvalid"));
          else setRecoveryReady(true);
          setCheckingLink(false);
        }
        return;
      }

      // Hashed-token flow (works even if the link is opened in another browser)
      const tokenHash = query.get("token_hash") || query.get("token");
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
        window.history.replaceState({}, "", window.location.pathname);
        if (!cancelled) {
          if (error) setLinkError(t("resetPassword.linkExpired"));
          else setRecoveryReady(true);
          setCheckingLink(false);
        }
        return;
      }

      // PKCE flow: ?code=...
      const code = query.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, "", window.location.pathname);
        if (!cancelled) {
          if (error) {
            setLinkError(t("resetPassword.linkBrowserMismatch"));
          } else {
            setRecoveryReady(true);
          }
          setCheckingLink(false);
        }
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!cancelled) {
        if (sessionData.session) setRecoveryReady(true);
        else if (setupOnly) setLinkError(t("resetPassword.setupLinkInvalid"));
        setCheckingLink(false);
      }
    };

    void consume();

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [setupOnly, t]);

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
        title: t("resetPassword.emailSentTitle"),
        description: t("resetPassword.emailSentDesc"),
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
    const issues = signupPasswordIssues(password);
    if (issues.length) {
      toast({
        title: "Erreur",
        description: t("resetPassword.passwordRequirements"),
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({
        title: t("resetPassword.passwordUpdatedTitle"),
        description: t("resetPassword.passwordUpdatedDesc"),
      });
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
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
          <AegisLogo alt="Aegis" className="h-16 w-auto opacity-90" />
        </div>

        <NeuralCard className="p-6 space-y-5">
          <h1 className="font-display text-lg tracking-[0.15em] uppercase text-text-primary text-center">
            {setupOnly
              ? t("resetPassword.createPasswordTitle")
              : recoveryReady
                ? t("resetPassword.newPasswordTitle")
                : t("resetPassword.forgotPasswordTitle")}
          </h1>

          {linkError && (
            <p className="text-xs text-red-400/90 text-center leading-relaxed border border-red-400/20 rounded-lg px-3 py-2">
              {linkError}
            </p>
          )}

          {checkingLink ? (
            <div className="flex items-center justify-center py-8 text-text-tertiary">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : recoveryReady ? (
            <form onSubmit={updatePassword} className="space-y-4">
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  placeholder={t("resetPassword.passwordPlaceholder")}
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
                {t("resetPassword.updateBtn")}
              </button>
            </form>
          ) : setupOnly ? (
            <div className="space-y-4 text-center">
              <p className="text-xs text-text-tertiary leading-relaxed">
                {t("resetPassword.adminSetupHint")}
              </p>
              <Link to="/auth" className="inline-block text-xs text-accent-primary hover:underline">
                {t("resetPassword.backToLogin")}
              </Link>
            </div>
          ) : (
            <form onSubmit={requestLink} className="space-y-4">
              <p className="text-xs text-text-tertiary text-center leading-relaxed">
                {t("resetPassword.requestHint")}
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
                {sent ? t("resetPassword.emailSentTitle") : t("resetPassword.sendLinkBtn")}
              </button>
            </form>
          )}

          <div className="text-center">
            <Link to="/auth" className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary hover:text-accent-primary">
              {t("resetPassword.backToLogin")}
            </Link>
          </div>
        </NeuralCard>
      </motion.div>
    </div>
  );
}

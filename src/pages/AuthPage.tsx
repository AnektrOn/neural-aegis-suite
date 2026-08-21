import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Eye, EyeOff, Mail, Sparkles } from "lucide-react";
import aegisLogo from "@/assets/aegis-logo.png";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { NeuralCard } from "@/components/ui/neural-card";
import AppFooter from "@/components/AppFooter";
import BackendHealthBanner from "@/components/BackendHealthBanner";
import { signUpGuest, upgradeGuestToMember } from "@/lib/guestAuth";
import { isAnonymousUser, isGuestUser } from "@/lib/authVisitor";
import {
  isNewsletterRedirect,
  resolveGuestRedirect,
} from "@/lib/authRedirect";
import { withAuthTimeout } from "@/lib/authResilience";
import { GUARDIAN_ONBOARDING_PATH, postLoginPath } from "@/lib/welcomeHud";
import { formatAuthError } from "@/lib/authErrorMessage";

type AuthMode = "signin" | "signup" | "guest" | "upgrade";

const inputCls =
  "w-full bg-bg-base border border-border-active rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 transition-all duration-200";

const labelCls =
  "text-[10px] tracking-[0.15em] uppercase text-text-tertiary font-medium font-display block";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, isGuest, loading: authLoading } = useAuth();

  const redirectParam = searchParams.get("redirect");
  const redirectTo = resolveGuestRedirect(redirectParam);
  const newsletterIntent = isNewsletterRedirect(redirectParam);
  const guestFromUrl = searchParams.get("guest") === "1";
  const upgradeFromUrl = searchParams.get("upgrade") === "1";

  const [mode, setMode] = useState<AuthMode>("signin");

  useEffect(() => {
    if (upgradeFromUrl && (isGuest || isAnonymousUser(user))) {
      setMode("upgrade");
    } else if (guestFromUrl) {
      setMode("guest");
    }
  }, [upgradeFromUrl, guestFromUrl, isGuest, user]);

  useEffect(() => {
    if (user?.email && (mode === "upgrade" || mode === "guest")) {
      setEmail(user.email);
    }
  }, [user?.email, mode]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (mode === "guest" || mode === "upgrade" || mode === "signup") return;

    const guestAccount = isAnonymousUser(user) || isGuestUser(user);

    // Guardian onboarding wins over any ?redirect= target (a redirect back to
    // /visitor used to skip Guardian entirely for returning guests).
    const target = postLoginPath(guestAccount, user.id);
    if (target === GUARDIAN_ONBOARDING_PATH) {
      navigate(target, { replace: true });
      return;
    }

    const path = redirectParam?.trim();
    if (path?.startsWith("/")) {
      navigate(path, { replace: true });
      return;
    }

    navigate(target, { replace: true });
  }, [user, authLoading, redirectParam, navigate, mode]);


  const showAuthError = (err: unknown) => {
    toast({
      title: t("toast.error"),
      description: formatAuthError(t, err),
      variant: "destructive",
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      const { error } = await withAuthTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15_000,
      );
      if (error) throw error;
      // Redirect is handled by the auth-state effect once the session is in context.
    } catch (err: unknown) {
      showAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await withAuthTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` },
        }),
        15_000,
      );
      if (error) throw error;
      navigate("/onboarding", { replace: true });
    } catch (err: unknown) {
      showAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) throw error;
    } catch (err: unknown) {
      showAuthError(err);
      setLoading(false);
    }
  };

  const handleGuestSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const session = await signUpGuest({
        email,
        ...(newsletterIntent && firstName.trim() ? { firstName: firstName.trim() } : {}),
      });
      toast({
        title: t("auth.guest.successTitle"),
        description: newsletterIntent
          ? t("auth.guest.successDescNewsletter")
          : t("auth.guest.successDesc"),
      });
      // Guests go to the quiz (Guardian onboarding is for real accounts only).
      navigate(newsletterIntent ? redirectTo : "/quiz", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === "EMAIL_ALREADY_REGISTERED") {
        toast({
          title: t("toast.error"),
          description: t("auth.guest.emailExists"),
          variant: "destructive",
        });
        setMode("signin");
      } else {
        showAuthError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (isAnonymousUser(user)) {
        const { error } = await supabase.auth.updateUser({ email, password });
        if (error) throw error;
      } else {
        await upgradeGuestToMember(password);
      }
      localStorage.setItem(`aegis_onboarded_${user.id}`, "true");
      toast({
        title: t("visitor.upgrade.successTitle"),
        description: t("visitor.upgrade.successDesc"),
      });
      navigate(postLoginPath(false, user.id));
    } catch (err: unknown) {
      showAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const submitHandler =
    mode === "guest"
      ? handleGuestSignup
      : mode === "upgrade"
        ? handleUpgrade
        : mode === "signup"
          ? handleSignUp
          : handleSignIn;

  const showPasswordField = mode === "signin" || mode === "signup" || mode === "upgrade";
  const showEmailField =
    mode === "signin" ||
    mode === "signup" ||
    mode === "guest" ||
    (mode === "upgrade" && isAnonymousUser(user));

  return (
    <div className="min-h-screen bg-aegis-gradient flex flex-col p-4 relative overflow-hidden">
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <LanguageSwitcher />
        <ThemeToggle collapsed />
      </div>

      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/6 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-neural-accent/4 blur-3xl pointer-events-none" />

      <div className="relative flex-1 w-full flex items-center justify-center py-8">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col items-center mb-8"
          >
            <img src={aegisLogo} alt="Neural Aegis platform logo" className="w-40 h-40 sm:w-52 sm:h-52 rounded-2xl mb-4 object-contain" />
            <h1 className="font-display text-sm tracking-[0.25em] uppercase text-text-secondary">Neural Aegis — Personal Archetype Platform</h1>
            <p className="font-cormorant text-lg font-light italic text-primary/70 mt-1 tracking-wide">{t("auth.tagline")}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }}
          >
            <NeuralCard variant="elevated" glow={mode === "guest" ? "purple" : "warm"} className="glass-card p-6 border-0">
              <BackendHealthBanner className="mb-4" />
              {mode === "upgrade" && (
                <p className="text-sm text-text-secondary mb-4 text-center">{t("visitor.upgrade.authIntro")}</p>
              )}
              {mode === "guest" && (
                <div className="mb-4 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    {newsletterIntent ? (
                      <Mail size={16} aria-hidden />
                    ) : (
                      <Sparkles size={16} aria-hidden />
                    )}
                    <span className="text-xs uppercase tracking-[0.2em] font-display">
                      {newsletterIntent ? t("auth.newsletter.badge") : t("auth.guest.badge")}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {newsletterIntent ? t("auth.newsletter.intro") : t("auth.guest.intro")}
                  </p>
                  {newsletterIntent && (
                    <Link
                      to="/newsletter"
                      className="inline-flex min-h-[44px] items-center justify-center text-xs uppercase tracking-wider font-display text-accent-primary hover:text-accent-primary/80 transition-colors duration-200"
                    >
                      {t("auth.newsletter.skipAccount")}
                    </Link>
                  )}
                </div>
              )}

              <form onSubmit={submitHandler} className="space-y-3">
                {mode === "guest" && newsletterIntent && (
                  <div className="space-y-1">
                    <label className={labelCls}>{t("auth.guest.firstName")}</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                      className={inputCls}
                    />
                  </div>
                )}

                {showEmailField && (
                  <div className="space-y-1">
                    <label className={labelCls}>
                      {t("auth.email")}
                      {mode === "guest" && <span className="text-destructive ml-0.5">*</span>}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("auth.email")}
                      required
                      autoComplete="email"
                      readOnly={mode === "upgrade" && isGuest && !!user?.email}
                      className={inputCls}
                    />
                  </div>
                )}

                {showPasswordField && (
                  <div className="space-y-1">
                    <label className={labelCls}>{t("auth.password")}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t("auth.password")}
                        required
                        minLength={6}
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        className={`${inputCls} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg font-medium text-sm bg-primary hover:bg-primary-hover text-primary-foreground transition-all duration-200 shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_28px_hsl(var(--primary)/0.45)] hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === "guest"
                        ? newsletterIntent
                          ? t("auth.newsletter.submit")
                          : t("auth.guest.submit")
                        : mode === "upgrade"
                          ? t("visitor.upgrade.submit")
                          : mode === "signup"
                            ? t("auth.signUp")
                            : t("auth.signIn")}
                      <ArrowRight size={14} strokeWidth={1.5} />
                    </>
                  )}
                </button>
              </form>

              {(mode === "signin" || mode === "signup") && (
                <>
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/40" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                      <span className="bg-bg-elevated px-2 text-text-tertiary">{t("auth.or")}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={loading}
                    className="w-full min-h-[44px] py-2.5 mb-3 rounded-lg font-medium text-sm border border-border-active text-text-primary hover:bg-bg-elevated/60 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
                      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
                      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
                      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
                    </svg>
                    {t("auth.google")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                    className="w-full min-h-[44px] py-2.5 mb-3 rounded-lg font-medium text-sm border border-primary/40 text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                  >
                    {mode === "signin" ? t("auth.signUp.cta") : t("auth.signUp.hasAccount")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("guest")}
                    className="w-full min-h-[44px] py-2.5 rounded-lg font-medium text-sm border border-primary/40 text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} aria-hidden />
                    {t("auth.guest.cta")}
                  </button>
                  <Link
                    to="/newsletter"
                    className="w-full min-h-[44px] py-2.5 rounded-lg font-medium text-sm border border-border-active text-text-primary hover:bg-bg-elevated/60 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Mail size={14} aria-hidden />
                    {t("auth.newsletter.cta")}
                  </Link>
                </>
              )}

              {mode === "guest" && (
                <p className="text-center text-xs text-text-tertiary mt-4">
                  <button type="button" className="hover:underline" onClick={() => setMode("signin")}>
                    {t("auth.guest.hasAccount")}
                  </button>
                </p>
              )}

              {mode === "upgrade" && (
                <p className="text-center text-xs text-text-tertiary mt-4">
                  <button type="button" className="hover:underline" onClick={() => navigate("/visitor")}>
                    {t("visitor.backToSpace")}
                  </button>
                </p>
              )}
            </NeuralCard>
          </motion.div>
        </div>
      </div>
      <p className="text-center pb-4">
        <Link
          to="/newsletter"
          className="text-[10px] tracking-[0.15em] uppercase text-text-tertiary hover:text-text-secondary transition-colors duration-200 font-display"
        >
          {t("nav.newsletter")}
        </Link>
      </p>
      <AppFooter />
    </div>
  );
}

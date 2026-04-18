import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import aegisLogo from "@/assets/aegis-logo.png";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { NeuralCard } from "@/components/ui/neural-card";
import AppFooter from "@/components/AppFooter";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t("toast.error"), description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col p-4 relative overflow-hidden">
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <LanguageSwitcher />
        <ThemeToggle collapsed />
      </div>

      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none dark:block hidden" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none" />

      <div className="relative flex-1 w-full flex items-center justify-center">
        <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex flex-col items-center mb-10"
        >
          <img src={aegisLogo} alt="Aegis" className="w-52 h-52 rounded-2xl mb-5 object-contain" />
          <h1 className="font-display text-sm tracking-[0.25em] uppercase text-text-secondary">Neural Aegis</h1>
          <p className="text-[11px] text-text-tertiary mt-1 tracking-wide">Suite cognitif & décisionnel</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }}
        >
          <NeuralCard variant="elevated" glow="blue" className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-[0.15em] uppercase text-text-tertiary font-medium font-display block">
                  {t("auth.email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.email")}
                  required
                  autoComplete="email"
                  className="w-full bg-bg-base border border-border-active rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-[0.15em] uppercase text-text-tertiary font-medium font-display block">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.password")}
                    required
                    minLength={6}
                    autoComplete="current-password"
                    className="w-full bg-bg-base border border-border-active rounded-lg px-3 py-2.5 pr-11 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors duration-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-medium text-sm bg-accent-primary hover:bg-accent-primary/90 text-bg-base transition-all duration-200 shadow-[0_0_20px_rgba(79,142,247,0.3)] hover:shadow-[0_0_30px_rgba(79,142,247,0.4)] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                ) : (
                  <>
                    {t("auth.signIn")} <ArrowRight size={14} strokeWidth={1.5} />
                  </>
                )}
              </button>
            </form>
          </NeuralCard>
        </motion.div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

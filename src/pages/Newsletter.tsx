import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Mail,
  Sparkles,
  Brain,
  CalendarDays,
  Shield,
  CheckCircle2,
  BellOff,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/use-admin";
import { NeuralCard } from "@/components/ui/neural-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { newsletterEditionPath } from "@/lib/appUrl";
import {
  getNewsletterSubscriptionForUser,
  listPublishedNewsletterEditions,
  subscribeNewsletter,
  unsubscribeNewsletter,
  type NewsletterEdition,
} from "@/services/newsletterService";

const inputCls =
  "w-full min-h-[44px] bg-bg-base border border-border-active rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 transition-all duration-200";

const benefitIcons = [Sparkles, Brain, CalendarDays, Shield] as const;

export default function Newsletter() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const prefersReducedMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [existingStatus, setExistingStatus] = useState<"active" | "unsubscribed" | null>(
    null,
  );
  const [editions, setEditions] = useState<NewsletterEdition[]>([]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  useEffect(() => {
    const unsub = searchParams.get("unsubscribe")?.trim();
    if (unsub) {
      setEmail(unsub);
      searchParams.delete("unsubscribe");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await listPublishedNewsletterEditions();
      if (alive) setEditions(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    (async () => {
      const sub = await getNewsletterSubscriptionForUser(user.id);
      if (!alive || !sub) return;
      setEmail(sub.email);
      setExistingStatus(sub.status);
      if (sub.status === "active") setSubscribed(true);
    })();
    return () => {
      alive = false;
    };
  }, [user?.id]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast({
        title: t("toast.error"),
        description: t("newsletter.consentRequired"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await subscribeNewsletter({
        email,
        locale,
        source: user ? (isAdmin ? "admin" : "member") : "public",
      });

      if ("error" in result) {
        const msg =
          result.error === "invalid_email"
            ? t("newsletter.invalidEmail")
            : result.error;
        toast({ title: t("toast.error"), description: msg, variant: "destructive" });
        return;
      }

      setSubscribed(true);
      setExistingStatus("active");
      toast({
        title: t("newsletter.successTitle"),
        description: t("newsletter.successDescEmail"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const { ok } = await unsubscribeNewsletter(email);
      if (!ok) {
        toast({
          title: t("toast.error"),
          description: t("newsletter.unsubscribeFailed"),
          variant: "destructive",
        });
        return;
      }
      setSubscribed(false);
      setExistingStatus("unsubscribed");
      toast({
        title: t("newsletter.unsubscribedTitle"),
        description: t("newsletter.unsubscribedDesc"),
      });
    } finally {
      setLoading(false);
    }
  };

  const motionProps = prefersReducedMotion
    ? { initial: false, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="max-w-3xl lg:max-w-[44rem] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      <motion.header {...motionProps} className="space-y-4 text-center sm:text-left">
        <Badge
          variant="outline"
          className="font-display text-[10px] tracking-[0.18em] uppercase border-accent-primary/30 text-accent-primary"
        >
          {t("newsletter.badge")}
        </Badge>
        <h1 className="text-neural-title text-3xl sm:text-4xl text-foreground">
          {t("newsletter.blogTitle")}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          {t("newsletter.blogSubtitle")}
        </p>
        <p className="text-xs text-text-tertiary leading-relaxed max-w-xl">
          {t("newsletter.inAppHint")}
        </p>
        {isAdmin && (
          <p className="text-xs text-text-tertiary">
            {t("newsletter.adminHint")}{" "}
            <Link to="/admin/newsletter" className="text-accent-primary hover:underline">
              {t("newsletter.adminManage")}
            </Link>
          </p>
        )}
      </motion.header>

      {editions.length > 0 && (
        <motion.section
          {...motionProps}
          transition={{ delay: prefersReducedMotion ? 0 : 0.05 }}
          className="space-y-4"
          aria-label={t("newsletter.editionsAria")}
        >
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-primary" aria-hidden />
            <h2 className="text-neural-label">{t("newsletter.blogArticles")}</h2>
          </div>
          <ul className="space-y-6">
            {editions.map((ed) => {
              const title = locale === "en" ? ed.titleEn : ed.titleFr;
              const excerpt = locale === "en" ? ed.excerptEn : ed.excerptFr;
              const date = ed.publishedAt
                ? new Date(ed.publishedAt).toLocaleDateString(
                    locale === "en" ? "en-US" : "fr-FR",
                    { month: "long", day: "numeric", year: "numeric" },
                  )
                : null;
              return (
                <li key={ed.id}>
                  <Link
                    to={newsletterEditionPath(ed.slug)}
                    className="block group min-h-[44px]"
                  >
                    <article className="relative overflow-hidden rounded-[20px] border border-border-subtle/80 bg-gradient-to-br from-bg-surface/80 via-bg-elevated/40 to-bg-base/60 p-5 sm:p-7 transition-all duration-200 group-hover:border-[hsl(var(--aegis-warm)/0.35)] group-hover:shadow-[0_8px_32px_hsl(var(--aegis-warm)/0.06)]">
                      <div
                        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        aria-hidden
                        style={{
                          background:
                            "radial-gradient(circle, hsl(var(--aegis-warm) / 0.12), transparent 70%)",
                        }}
                      />
                      {date && (
                        <time className="relative text-[10px] uppercase tracking-[0.18em] font-display text-[hsl(var(--aegis-warm)/0.85)]">
                          {date}
                        </time>
                      )}
                      <h3 className="relative mt-3 font-display text-xl sm:text-2xl text-foreground leading-snug group-hover:text-[hsl(var(--aegis-warm))] transition-colors duration-200 text-balance">
                        {title}
                      </h3>
                      {excerpt && (
                        <p className="relative mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-3 border-l-2 border-[hsl(var(--aegis-warm)/0.25)] pl-3">
                          {excerpt}
                        </p>
                      )}
                      <span className="relative mt-5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-display text-[hsl(var(--aegis-warm))]">
                        {t("newsletter.readArticle")}
                        <ChevronRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </article>
                  </Link>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}

      <motion.section
        {...motionProps}
        transition={{ delay: prefersReducedMotion ? 0 : 0.08 }}
        className="grid sm:grid-cols-2 gap-4"
        aria-label={t("newsletter.benefitsAria")}
      >
        {([0, 1, 2, 3] as const).map((i) => {
          const Icon = benefitIcons[i];
          return (
            <NeuralCard
              key={i}
              variant="elevated"
              glow="warm"
              className="flex gap-3 items-start p-5"
            >
              <div
                className="shrink-0 w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center"
                aria-hidden
              >
                <Icon size={18} className="text-accent-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground">
                  {t(`newsletter.benefit${i + 1}Title` as never)}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {t(`newsletter.benefit${i + 1}Desc` as never)}
                </p>
              </div>
            </NeuralCard>
          );
        })}
      </motion.section>

      <motion.div
        id="subscribe"
        {...motionProps}
        transition={{ delay: prefersReducedMotion ? 0 : 0.14 }}
        className="scroll-mt-24"
      >
        <NeuralCard variant="premium" className="p-6 sm:p-8 space-y-6">
          {subscribed || existingStatus === "active" ? (
            <div className="text-center space-y-4 py-4">
              <div
                className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center"
                aria-hidden
              >
                <CheckCircle2 className="text-emerald-400" size={28} strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-medium text-foreground">
                {t("newsletter.alreadyTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("newsletter.alreadyDesc")}</p>
              <p className="text-xs text-text-tertiary font-mono">{email}</p>
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] gap-2"
                onClick={handleUnsubscribe}
                disabled={loading}
                aria-label={t("newsletter.unsubscribeAria")}
              >
                <BellOff size={16} aria-hidden />
                {t("newsletter.unsubscribe")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-5" noValidate>
              <div className="flex items-center gap-3 border-b border-border/30 pb-4">
                <Mail size={20} strokeWidth={1.5} className="text-primary" aria-hidden />
                <p className="text-neural-label">{t("newsletter.formLabel")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newsletter-email" className="text-[10px] tracking-[0.15em] uppercase text-text-tertiary font-display">
                  {t("newsletter.email")}
                </Label>
                <input
                  id="newsletter-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("newsletter.emailPlaceholder")}
                  className={inputCls}
                  disabled={loading}
                />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="newsletter-consent"
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v === true)}
                  className="mt-1 shrink-0"
                  aria-required
                />
                <Label
                  htmlFor="newsletter-consent"
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                >
                  {t("newsletter.consent")}
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full min-h-[44px] gap-2"
                disabled={loading || !email.trim()}
              >
                <Mail size={16} aria-hidden />
                {loading ? t("newsletter.submitting") : t("newsletter.submit")}
              </Button>

              {existingStatus === "unsubscribed" && (
                <p className="text-xs text-center text-text-tertiary">
                  {t("newsletter.resubscribeHint")}
                </p>
              )}
            </form>
          )}
        </NeuralCard>
      </motion.div>

      <p className="text-center text-[10px] tracking-[0.12em] uppercase text-text-tertiary/70 font-display">
        {t("newsletter.privacy")}
      </p>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Zap,
  Target,
  Check,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import type { UserMaturityProfile } from "@/lib/userMaturity";

export const WELCOME_DISMISSED_KEY = "aegis_welcome_dismissed";

interface Props {
  maturityProfile: UserMaturityProfile;
  onDismiss: () => void;
}

interface ChecklistItem {
  key: string;
  done: boolean;
  label: string;
  cta: string;
  to: string;
}

const promiseStagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
};

const promiseItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function getFirstName(meta: Record<string, unknown> | undefined, email?: string | null): string {
  const m = meta ?? {};
  const candidates = [
    m["first_name"],
    typeof m["full_name"] === "string"
      ? (m["full_name"] as string).split(" ")[0]
      : undefined,
    typeof m["display_name"] === "string"
      ? (m["display_name"] as string).split(" ")[0]
      : undefined,
    email?.split("@")[0],
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

export function WelcomeExperience({ maturityProfile, onDismiss }: Props) {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const isFR = locale === "fr";
  const [showDismiss, setShowDismiss] = useState(false);

  const firstName = useMemo(
    () =>
      getFirstName(
        (user?.user_metadata as Record<string, unknown> | undefined) ?? undefined,
        user?.email
      ),
    [user]
  );

  // Reveal "I already know AEGIS" link after 24h since account creation
  useEffect(() => {
    setShowDismiss(maturityProfile.daysActive >= 1);
  }, [maturityProfile.daysActive]);

  const checklist: ChecklistItem[] = [
    {
      key: "account",
      done: true,
      label: t("welcome.checklist.account"),
      cta: "",
      to: "",
    },
    {
      key: "archetype",
      done: maturityProfile.hasArchetypeProfile,
      label: t("welcome.checklist.archetype"),
      cta: t("welcome.cta.start"),
      to: "/onboarding/assessment",
    },
    {
      key: "mood",
      done: maturityProfile.hasAnyMood,
      label: t("welcome.checklist.mood"),
      cta: t("welcome.cta.log"),
      to: "/mood",
    },
    {
      key: "decision",
      done: maturityProfile.hasAnyDecision,
      label: t("welcome.checklist.decision"),
      cta: t("welcome.cta.add"),
      to: "/decisions",
    },
    {
      key: "journal",
      done: maturityProfile.hasAnyJournal,
      label: t("welcome.checklist.journal"),
      cta: t("welcome.cta.write"),
      to: "/journal",
    },
  ];

  const completion = maturityProfile.completionScore;

  const handleDismiss = () => {
    try {
      localStorage.setItem(WELCOME_DISMISSED_KEY, "1");
    } catch {
      // ignore quota / private mode
    }
    onDismiss();
  };

  return (
    <Card className="relative overflow-hidden p-6 sm:p-8 backdrop-blur-3xl bg-card/40 border-border/40">
      {/* Soft ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative space-y-2"
      >
        <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-[0.2em] font-display">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
          {isFR ? "Bienvenue" : "Welcome"}
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl text-foreground">
          {firstName
            ? t("welcome.title", { name: firstName })
            : t("welcome.title.noname")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {t("welcome.subtitle")}
        </p>
      </motion.div>

      {/* 3 promise cards */}
      <motion.div
        variants={promiseStagger}
        initial="initial"
        animate="animate"
        className="relative grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6"
      >
        <motion.div variants={promiseItem}>
          <PromiseCard
            icon={<Brain className="w-5 h-5" strokeWidth={1.5} />}
            title={t("welcome.promise1.title")}
            body={t("welcome.promise1.body")}
          />
        </motion.div>
        <motion.div variants={promiseItem}>
          <PromiseCard
            icon={<Zap className="w-5 h-5" strokeWidth={1.5} />}
            title={t("welcome.promise2.title")}
            body={t("welcome.promise2.body")}
          />
        </motion.div>
        <motion.div variants={promiseItem}>
          <PromiseCard
            icon={<Target className="w-5 h-5" strokeWidth={1.5} />}
            title={t("welcome.promise3.title")}
            body={t("welcome.promise3.body")}
          />
        </motion.div>
      </motion.div>

      {/* Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="relative mt-8 space-y-3"
      >
        <h2 className="font-serif text-lg">{t("welcome.checklist.title")}</h2>
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/30 px-3 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={[
                    "flex items-center justify-center w-5 h-5 rounded border shrink-0",
                    item.done
                      ? "bg-primary/15 border-primary text-primary"
                      : "border-border/60 text-muted-foreground",
                  ].join(" ")}
                >
                  {item.done ? <Check className="w-3 h-3" strokeWidth={2} /> : null}
                </span>
                <span
                  className={[
                    "text-sm truncate",
                    item.done ? "text-muted-foreground line-through" : "text-foreground",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </div>
              {!item.done && item.to && (
                <Button asChild size="sm" variant="ghost" className="shrink-0 h-8">
                  <NavLink to={item.to}>
                    {item.cta}
                    <ArrowRight className="ml-1 w-3.5 h-3.5" />
                  </NavLink>
                </Button>
              )}
            </li>
          ))}
        </ul>

        {/* Completion bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("welcome.completion.label", { pct: completion })}</span>
            <span className="font-display tracking-wider">{completion}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </div>
          <p className="text-xs text-muted-foreground italic">
            {t("welcome.completion.hint")}
          </p>
        </div>
      </motion.div>

      {showDismiss && (
        <div className="relative mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            {t("welcome.dismiss")}
          </button>
        </div>
      )}
    </Card>
  );
}

function PromiseCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="h-full p-4 backdrop-blur-3xl bg-background/30 border-border/40 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2 text-primary mb-2">{icon}</div>
      <h3 className="font-serif text-base mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Compact emerging banner                                                    */
/* -------------------------------------------------------------------------- */

const EMERGING_DISMISS_KEY = "aegis_setup_banner_dismissed";

export function SetupProgressBanner({
  maturityProfile,
}: {
  maturityProfile: UserMaturityProfile;
}) {
  const { t } = useLanguage();
  const [hidden, setHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(EMERGING_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  const nextStep = useMemo(() => {
    if (!maturityProfile.hasArchetypeProfile)
      return { label: t("welcome.next.archetype"), to: "/onboarding/assessment" };
    if (!maturityProfile.hasAnyMood)
      return { label: t("welcome.next.mood"), to: "/mood" };
    if (!maturityProfile.hasAnyDecision)
      return { label: t("welcome.next.decision"), to: "/decisions" };
    if (!maturityProfile.hasAnyJournal)
      return { label: t("welcome.next.journal"), to: "/journal" };
    if (!maturityProfile.hasAnyContact)
      return { label: t("welcome.next.contact"), to: "/people" };
    return null;
  }, [maturityProfile, t]);

  if (hidden || !nextStep) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(EMERGING_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setHidden(true);
  };

  return (
    <Card className="p-3 backdrop-blur-3xl bg-card/40 border-border/40">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-1">
            <span>{t("welcome.completion.label", { pct: maturityProfile.completionScore })}</span>
            <span className="font-display">{maturityProfile.completionScore}%</span>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${maturityProfile.completionScore}%` }}
            />
          </div>
        </div>
        <Button asChild size="sm" variant="ghost" className="shrink-0 h-8">
          <NavLink to={nextStep.to}>
            {nextStep.label}
            <ArrowRight className="ml-1 w-3.5 h-3.5" />
          </NavLink>
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}

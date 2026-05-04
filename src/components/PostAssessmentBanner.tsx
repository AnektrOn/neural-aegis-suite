import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { archetypeMeta } from "@/features/archetype-assessment/services/assessmentService";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";

const AUTO_DISMISS_MS = 8000;

export function PostAssessmentBanner({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const isFR = locale === "fr";
  const [archetypeKey, setArchetypeKey] = useState<ArchetypeKey | null>(null);
  const [open, setOpen] = useState(true);

  // Fetch top archetype name
  useEffect(() => {
    let alive = true;
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("archetype_scores")
        .select("archetype_key, rank")
        .eq("user_id", user.id)
        .order("rank", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!alive) return;
      if (data?.archetype_key) setArchetypeKey(data.archetype_key as ArchetypeKey);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  // Auto-dismiss
  useEffect(() => {
    const id = setTimeout(() => {
      setOpen(false);
      setTimeout(onClose, 300);
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [onClose]);

  const meta = archetypeKey ? archetypeMeta(archetypeKey) : null;
  const archetypeName = meta ? (isFR ? meta.name_fr : meta.name_en) : "—";

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Card
            className="relative overflow-hidden p-4 sm:p-5 backdrop-blur-3xl bg-card/60 border-primary/30"
            style={meta ? { boxShadow: `0 0 40px -16px ${meta.color}` } : undefined}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={
                meta
                  ? {
                      background: `radial-gradient(circle at top right, ${meta.color}33, transparent 60%)`,
                    }
                  : undefined
              }
            />
            <div className="relative flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <p className="font-serif text-base sm:text-lg leading-snug">
                  {t("postAssessment.title")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("postAssessment.body", { archetype: archetypeName })}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button asChild size="sm" variant="default" className="h-8">
                  <NavLink to="/deep-dive">
                    {t("deepDive.viewReport")}
                    <ArrowRight className="ml-1 w-3.5 h-3.5" />
                  </NavLink>
                </Button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

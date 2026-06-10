import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2, Plus, Check, ListChecks } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { pickLocalizedText } from "@/lib/content-i18n";
import type { Locale } from "@/i18n/translations";
import {
  addHabitToTracker,
  fetchHabitCatalog,
  fetchUserArchetypes,
  removeHabitFromTracker,
  type HabitCatalogTemplate,
} from "@/services/habitPickerService";
import { cn } from "@/lib/utils";

interface ActiveAssignment {
  id: string;
  habit_template_id: string;
  is_active: boolean;
}

interface Props {
  userId: string;
  assignments: ActiveAssignment[];
  onChanged: () => void;
  defaultOpen?: boolean;
}

export default function HabitPicker({ userId, assignments, onChanged, defaultOpen = false }: Props) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<HabitCatalogTemplate[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const activeByTemplate = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assignments) {
      if (!a.is_active) continue;
      map.set(a.habit_template_id, a.id);
    }
    return map;
  }, [assignments]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    const archetypes = await fetchUserArchetypes(userId);
    const rows = await fetchHabitCatalog(archetypes);
    setCatalog(rows);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    void loadCatalog();
  }, [open, loadCatalog]);

  const categories = useMemo(
    () => ["all", ...new Set(catalog.map((c) => c.category).filter(Boolean))],
    [catalog],
  );

  const filtered = catalog.filter((c) => filter === "all" || c.category === filter);

  const toggleTemplate = async (template: HabitCatalogTemplate) => {
    const assignmentId = activeByTemplate.get(template.id);
    setBusyId(template.id);
    try {
      if (assignmentId) {
        const res = await removeHabitFromTracker(assignmentId);
        if (!res.ok) {
          toast({ title: t("toast.error"), description: res.error, variant: "destructive" });
          return;
        }
        toast({ title: t("habits.pickerRemoved") });
      } else {
        const res = await addHabitToTracker(template.id);
        if (!res.ok) {
          const msg =
            res.error === "archetype_mismatch"
              ? t("habits.pickerArchetypeMismatch")
              : res.error ?? t("toast.error");
          toast({ title: t("toast.error"), description: msg, variant: "destructive" });
          return;
        }
        toast({ title: t("habits.pickerAdded") });
      }
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const activeCount = activeByTemplate.size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="ethereal-glass overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left transition-colors hover:bg-secondary/10"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-start gap-3">
          <ListChecks size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="text-neural-label">{t("habits.pickerTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("habits.pickerHint")}</p>
            {activeCount > 0 && (
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-primary/80">
                {t("habits.pickerCount", { count: String(activeCount) })}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          size={18}
          className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden border-t border-border/30"
          >
            <div className="space-y-4 px-6 py-5">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilter(cat)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[9px] uppercase tracking-[0.28em] transition-all",
                      filter === cat
                        ? "border-primary/30 bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground/30",
                    )}
                  >
                    {cat === "all" ? t("habits.filterAllCategories") : cat}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={22} className="animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">{t("habits.pickerEmpty")}</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {filtered.map((template) => {
                    const inTracker = activeByTemplate.has(template.id);
                    const name = pickLocalizedText(locale as Locale, template.name_i18n as never, template.name);
                    const description = pickLocalizedText(
                      locale as Locale,
                      template.description_i18n as never,
                      template.description ?? "",
                    );
                    const isBusy = busyId === template.id;

                    return (
                      <li key={template.id}>
                        <div
                          className={cn(
                            "flex h-full flex-col rounded-xl border p-4 transition-colors",
                            inTracker
                              ? "border-primary/35 bg-primary/5"
                              : "border-border/30 bg-secondary/10 hover:border-border/50",
                          )}
                        >
                          <span className="mb-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                            {template.category}
                          </span>
                          <p className="text-sm font-medium text-foreground">{name}</p>
                          {description ? (
                            <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted-foreground">{description}</p>
                          ) : null}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void toggleTemplate(template)}
                            className={cn(
                              "mt-4 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border text-[9px] uppercase tracking-[0.28em] transition-colors",
                              inTracker
                                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                                : "border-border/40 bg-background/50 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                            )}
                          >
                            {isBusy ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : inTracker ? (
                              <Check size={12} />
                            ) : (
                              <Plus size={12} />
                            )}
                            {inTracker ? t("habits.pickerInList") : t("habits.pickerAdd")}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

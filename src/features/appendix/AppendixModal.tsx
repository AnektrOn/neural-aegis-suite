import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import {
  loadAppendix,
  loadUserResponses,
  upsertResponse,
} from "@/features/appendix/service";
import type {
  AppendixCategoryWithQuestions,
  AppendixQuestion,
  AppendixResponse,
} from "@/features/appendix/types";

interface AppendixModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppendixModal({ open, onOpenChange }: AppendixModalProps) {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<AppendixCategoryWithQuestions[]>([]);
  const [responses, setResponses] = useState<Map<string, AppendixResponse>>(new Map());
  const [catIdx, setCatIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    Promise.all([loadAppendix(), loadUserResponses(user.id)])
      .then(([cats, resps]) => {
        setCategories(cats);
        setResponses(resps);
        // Resume at first unanswered question
        let foundCat = 0, foundQ = 0, found = false;
        for (let ci = 0; ci < cats.length && !found; ci++) {
          for (let qi = 0; qi < cats[ci].questions.length; qi++) {
            if (!resps.has(cats[ci].questions[qi].id)) {
              foundCat = ci;
              foundQ = qi;
              found = true;
              break;
            }
          }
        }
        setCatIdx(foundCat);
        setQIdx(foundQ);
      })
      .catch((e) => {
        console.error(e);
        toast({ title: t("toast.error"), description: e.message, variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [open, user]);

  const totalQuestions = useMemo(
    () => categories.reduce((sum, c) => sum + c.questions.length, 0),
    [categories]
  );
  const answeredCount = responses.size;
  const currentCat = categories[catIdx];
  const currentQ: AppendixQuestion | undefined = currentCat?.questions[qIdx];
  const currentResp = currentQ ? responses.get(currentQ.id) : undefined;

  const flatPosition = useMemo(() => {
    let pos = 0;
    for (let i = 0; i < catIdx; i++) pos += categories[i]?.questions.length || 0;
    return pos + qIdx + 1;
  }, [catIdx, qIdx, categories]);

  const goNext = () => {
    if (!currentCat) return;
    if (qIdx < currentCat.questions.length - 1) setQIdx(qIdx + 1);
    else if (catIdx < categories.length - 1) {
      setCatIdx(catIdx + 1);
      setQIdx(0);
    } else {
      // Finished
      onOpenChange(false);
      toast({ title: t("appendix.completed") });
    }
  };

  const goPrev = () => {
    if (qIdx > 0) setQIdx(qIdx - 1);
    else if (catIdx > 0) {
      const prev = categories[catIdx - 1];
      setCatIdx(catIdx - 1);
      setQIdx(prev.questions.length - 1);
    }
  };

  const saveResponse = async (resp: AppendixResponse) => {
    if (!user) return;
    setSaving(true);
    try {
      await upsertResponse(user.id, resp);
      const next = new Map(responses);
      next.set(resp.question_id, resp);
      setResponses(next);
    } catch (e: any) {
      toast({ title: t("appendix.saveError"), description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSingleChoice = async (optionId: string) => {
    if (!currentQ) return;
    await saveResponse({
      question_id: currentQ.id,
      selected_option_ids: [optionId],
      numeric_value: null,
      text_value: null,
    });
    setTimeout(goNext, 200);
  };

  const handleMultiChoice = async (optionId: string) => {
    if (!currentQ) return;
    const existing = currentResp?.selected_option_ids || [];
    const next = existing.includes(optionId)
      ? existing.filter((id) => id !== optionId)
      : [...existing, optionId];
    await saveResponse({
      question_id: currentQ.id,
      selected_option_ids: next,
      numeric_value: null,
      text_value: null,
    });
  };

  const handleLikert = async (value: number) => {
    if (!currentQ) return;
    await saveResponse({
      question_id: currentQ.id,
      selected_option_ids: [],
      numeric_value: value,
      text_value: null,
    });
  };

  const handleText = async (text: string) => {
    if (!currentQ) return;
    await saveResponse({
      question_id: currentQ.id,
      selected_option_ids: [],
      numeric_value: null,
      text_value: text,
    });
  };

  const lab = (frEn: { fr: string; en: string } | { label_fr: string; label_en: string } | any, key = "label") => {
    if ("label_fr" in frEn) return locale === "fr" ? frEn.label_fr : frEn.label_en;
    if ("prompt_fr" in frEn) return locale === "fr" ? frEn.prompt_fr : frEn.prompt_en;
    return locale === "fr" ? frEn.fr : frEn.en;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-background border-border/30 [&>button]:hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-neural-title text-xl mb-1">
                {t("appendix.title")}
              </DialogTitle>
              {currentCat && (
                <p className="text-neural-label text-xs">
                  {locale === "fr" ? currentCat.label_fr : currentCat.label_en}
                </p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={t("appendix.close")}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {!loading && totalQuestions > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("appendix.progress", { n: answeredCount, total: totalQuestions })}</span>
                <span>{flatPosition} / {totalQuestions}</span>
              </div>
              <div className="h-1 bg-secondary/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : currentQ ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <p className="text-neural-label mb-2">Q{flatPosition}</p>
                  <h3 className="text-foreground text-lg leading-relaxed">
                    {locale === "fr" ? currentQ.prompt_fr : currentQ.prompt_en}
                  </h3>
                  {(currentQ.helper_fr || currentQ.helper_en) && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {locale === "fr" ? currentQ.helper_fr : currentQ.helper_en}
                    </p>
                  )}
                </div>

                {/* SINGLE CHOICE */}
                {currentQ.question_type === "single_choice" && (
                  <div className="space-y-2">
                    {currentQ.options.map((opt) => {
                      const isSelected = currentResp?.selected_option_ids.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSingleChoice(opt.id)}
                          disabled={saving}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                            isSelected
                              ? "bg-primary/10 border-primary/40 text-foreground"
                              : "bg-secondary/20 border-border/20 text-foreground hover:border-primary/30"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span>{locale === "fr" ? opt.label_fr : opt.label_en}</span>
                            {isSelected && <Check size={14} className="text-primary shrink-0" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* MULTIPLE CHOICE */}
                {currentQ.question_type === "multiple_choice" && (
                  <div className="space-y-2">
                    {currentQ.options.map((opt) => {
                      const isSelected = currentResp?.selected_option_ids.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleMultiChoice(opt.id)}
                          disabled={saving}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                            isSelected
                              ? "bg-primary/10 border-primary/40 text-foreground"
                              : "bg-secondary/20 border-border/20 text-foreground hover:border-primary/30"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span>{locale === "fr" ? opt.label_fr : opt.label_en}</span>
                            {isSelected && <Check size={14} className="text-primary shrink-0" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* LIKERT */}
                {currentQ.question_type === "likert_scale" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">{t("appendix.likertHint")}</p>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={currentResp?.numeric_value ?? 5}
                      onChange={(e) => handleLikert(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="text-center text-2xl font-light text-primary">
                      {currentResp?.numeric_value ?? 5}
                    </div>
                  </div>
                )}

                {/* SHORT TEXT */}
                {currentQ.question_type === "short_text" && (
                  <textarea
                    defaultValue={currentResp?.text_value || ""}
                    onBlur={(e) => handleText(e.target.value)}
                    placeholder={t("appendix.shortTextPlaceholder")}
                    rows={4}
                    className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors resize-none"
                  />
                )}

                {/* RANKING — fallback to multi-choice for now */}
                {currentQ.question_type === "ranking" && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {locale === "fr" ? "Sélectionnez par ordre d'importance" : "Select in order of importance"}
                    </p>
                    {currentQ.options.map((opt) => {
                      const existing = currentResp?.selected_option_ids || [];
                      const rank = existing.indexOf(opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleMultiChoice(opt.id)}
                          disabled={saving}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                            rank >= 0
                              ? "bg-primary/10 border-primary/40 text-foreground"
                              : "bg-secondary/20 border-border/20 text-foreground hover:border-primary/30"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span>{locale === "fr" ? opt.label_fr : opt.label_en}</span>
                            {rank >= 0 && (
                              <span className="text-primary text-xs shrink-0">#{rank + 1}</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>

        {!loading && currentQ && (
          <div className="px-6 py-4 border-t border-border/20 flex items-center justify-between gap-3">
            <button
              onClick={goPrev}
              disabled={catIdx === 0 && qIdx === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              {t("appendix.previous")}
            </button>
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
            >
              {catIdx === categories.length - 1 && qIdx === (currentCat?.questions.length || 0) - 1
                ? t("appendix.complete")
                : t("appendix.next")}
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

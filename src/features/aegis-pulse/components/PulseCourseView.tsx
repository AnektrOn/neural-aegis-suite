import { useCallback, useEffect, useState } from "react";
import { X, CheckCircle2, ArrowRight, Zap, BookOpen, Lightbulb, MessageCircle, Quote } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PulseCard, PulseCourse, CourseSectionType } from "../domain/types";
import {
  fetchPulseCourse,
  completePulseCourse,
  completeCard,
  type IntegrateCardResult,
} from "../services/pulseService";
import { getRuneAccent } from "../domain/runeAccent";
import { SacredGeometry } from "./SacredGeometry";

const SECTION_META: Record<CourseSectionType, { icon: typeof Zap; labelKey: string }> = {
  hook: { icon: Quote, labelKey: "pulse.sectionHook" },
  concept: { icon: BookOpen, labelKey: "pulse.doctrine" },
  exercise: { icon: Zap, labelKey: "pulse.sectionExercise" },
  reflection: { icon: MessageCircle, labelKey: "pulse.sectionReflection" },
  action: { icon: ArrowRight, labelKey: "pulse.application" },
  quote: { icon: Quote, labelKey: "pulse.sectionQuote" },
  story: { icon: Lightbulb, labelKey: "pulse.sectionStory" },
};

interface PulseCourseViewProps {
  card: PulseCard;
  onClose: () => void;
  onComplete: (result: IntegrateCardResult) => void;
}

export function PulseCourseView({ card, onClose, onComplete }: PulseCourseViewProps) {
  const { t, locale } = useLanguage();
  const [showCelebration, setShowCelebration] = useState(false);
  const [course, setCourse] = useState<PulseCourse | null>(null);
  const [loading, setLoading] = useState(false);

  const accent = getRuneAccent(card.principleCode);
  const hasCourseId = Boolean(card.courseId);

  useEffect(() => {
    if (!card.courseId) return;
    setLoading(true);
    fetchPulseCourse(card.courseId, locale).then((res) => {
      if (res.ok) setCourse(res.course);
      setLoading(false);
    });
  }, [card.courseId, locale]);

  const handleComplete = useCallback(async () => {
    setShowCelebration(true);
    const result = await completeCard(card.id);
    if (course) {
      await completePulseCourse(course.id);
    }
    setTimeout(() => onComplete(result), 1500);
  }, [card.id, course, onComplete]);

  const renderInlineCourse = () => {
    const { hook, concept, action } = card.courseContent;
    return (
      <>
        {hook && (
          <div className="text-center px-2 sm:px-4 relative">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-8 h-[1px] -mt-4 sm:-mt-5" style={{ background: `hsla(${accent} / 0.25)` }} />
            <p className="text-base sm:text-lg text-text-primary font-cormorant italic leading-relaxed">
              &laquo; {hook} &raquo;
            </p>
          </div>
        )}
        {concept && renderSection("concept", concept)}
        {action && renderSection("action", action)}
      </>
    );
  };

  const renderFullCourse = () => {
    if (!course) return null;
    return (
      <>
        {course.description && (
          <p className="text-center text-muted-foreground font-sans text-[13px] sm:text-sm leading-relaxed px-2">
            {course.description}
          </p>
        )}
        {course.sections.map((section) => {
          if (section.sectionType === "hook") {
            return (
              <div key={section.id} className="text-center px-2 sm:px-4 relative">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-8 h-[1px] -mt-4 sm:-mt-5" style={{ background: `hsla(${accent} / 0.25)` }} />
                <p className="text-base sm:text-lg text-text-primary font-cormorant italic leading-relaxed">
                  &laquo; {section.content} &raquo;
                </p>
              </div>
            );
          }
          if (section.sectionType === "quote") {
            return (
              <div key={section.id} className="text-center px-4 sm:px-8 py-4">
                <p className="text-sm sm:text-base text-muted-foreground font-cormorant italic leading-relaxed">
                  {section.content}
                </p>
              </div>
            );
          }
          return (
            <div key={section.id}>
              {renderSection(section.sectionType, section.content)}
            </div>
          );
        })}
      </>
    );
  };

  const renderSection = (type: CourseSectionType, content: string) => {
    const meta = SECTION_META[type];
    const Icon = meta?.icon ?? BookOpen;
    const label = meta ? t(meta.labelKey) : type;

    const isAction = type === "action" || type === "exercise";

    if (isAction) {
      return (
        <div
          className="relative overflow-hidden rounded-[18px] border p-4 sm:p-5"
          style={{
            background: `linear-gradient(165deg, hsla(var(--card) / 0.97), hsla(${accent} / 0.04))`,
            borderColor: `hsla(${accent} / 0.15)`,
            boxShadow: `0 4px 28px hsl(0 0% 0% / 0.28), 0 0 16px hsla(${accent} / 0.05)`,
          }}
        >
          <h3 className="font-barlow text-[10px] font-medium uppercase tracking-[0.14em] text-text-primary flex items-center gap-2 mb-2.5 sm:mb-3">
            <Icon size={13} style={{ color: `hsl(${accent})` }} /> {label}
          </h3>
          <div className="text-text-secondary font-sans font-light leading-relaxed text-[14px] sm:text-[15px] whitespace-pre-line">{content}</div>
        </div>
      );
    }

    return (
      <div className="dashboard-panel p-4 sm:p-5 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full h-[1px]"
          style={{ background: `linear-gradient(90deg, transparent, hsla(${accent} / 0.2), transparent)` }}
        />
        <h3 className="font-barlow text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-2.5 sm:mb-3 flex items-center gap-2">
          <div
            className="w-1 h-1 rounded-full"
            style={{ background: `hsl(${accent})`, boxShadow: `0 0 4px hsla(${accent} / 0.6)` }}
          />
          {label}
        </h3>
        <div className="text-text-secondary font-sans font-light leading-relaxed text-[14px] sm:text-[15px] whitespace-pre-line">{content}</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-bg-base flex flex-col font-sans animate-in slide-in-from-bottom-full duration-300">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[200vw] h-[50vh] opacity-20 blur-[100px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, hsla(${accent} / 0.15), transparent 70%)` }}
      />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--foreground) / 0.3) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div
        className="relative z-10 px-4 sm:px-5 pb-3 flex items-center justify-between"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 2rem)" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all active:scale-95"
          aria-label={t("pulse.close")}
        >
          <X size={20} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-2 bg-bg-elevated/50 px-3 py-1.5 rounded-lg border border-border-subtle">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: `hsl(${accent})`, boxShadow: `0 0 6px hsla(${accent} / 0.5)` }}
          />
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
            {t("pulse.pulseActive")}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-5 md:px-8 hide-scrollbar relative z-10" style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}>
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 mt-4">
          <div className="flex flex-col items-center text-center space-y-4 sm:space-y-5">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 flex items-center justify-center"
              style={{ filter: `drop-shadow(0 0 20px hsla(${accent} / 0.2))` }}
            >
              <SacredGeometry type={card.principleCode} />
            </div>
            <div>
              <span className="inline-block mb-2 sm:mb-3 font-barlow text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("pulse.bookOne", { name: card.principleName })}
              </span>
              <h1 className="text-xl sm:text-2xl md:text-[28px] font-cormorant text-text-primary leading-tight">
                {course?.title ?? card.title}
              </h1>
            </div>
            {course && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="font-mono text-[10px] tracking-widest uppercase">{course.difficulty}</span>
                <span className="w-1 h-1 rounded-full bg-border-subtle" />
                <span className="font-mono text-[10px] tracking-widest">{course.estimatedMinutes} MIN</span>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-border-subtle border-t-accent-primary rounded-full animate-spin" />
            </div>
          )}

          {!loading && hasCourseId && course && renderFullCourse()}
          {!loading && !hasCourseId && renderInlineCourse()}
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 p-4 sm:p-5 z-50"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.25rem)",
          background: "linear-gradient(to top, hsl(var(--background)), hsl(var(--background) / 0.95) 60%, transparent)",
        }}
      >
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
          <button
            type="button"
            onClick={handleComplete}
            disabled={showCelebration || loading}
            className={`w-full py-3.5 sm:py-4 rounded-[18px] font-barlow text-[11px] sm:text-xs font-medium uppercase tracking-[0.14em] flex items-center justify-center gap-3 transition-all border active:scale-[0.98] ${
              showCelebration
                ? "bg-accent-primary text-primary-foreground border-accent-primary"
                : "dashboard-cta"
            }`}
          >
            {showCelebration ? (
              <>
                {t("pulse.transmutationDone")} <CheckCircle2 size={16} strokeWidth={1.5} />
              </>
            ) : (
              <>
                {t("pulse.integrateKnowledge")} <ArrowRight size={16} strokeWidth={1.5} />
              </>
            )}
          </button>
        </div>
      </div>

      {showCelebration && (
        <div
          className="absolute inset-0 z-[200] pointer-events-none flex items-center justify-center animate-in fade-in duration-500"
          style={{ background: `hsla(${accent} / 0.04)`, backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-40 h-40 sm:w-56 sm:h-56 opacity-40"
            style={{ filter: `drop-shadow(0 0 40px hsla(${accent} / 0.6))` }}
          >
            <SacredGeometry type={card.principleCode} />
          </div>
        </div>
      )}
    </div>
  );
}

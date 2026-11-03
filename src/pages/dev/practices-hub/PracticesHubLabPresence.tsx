import { Link } from "react-router-dom";
import { ArrowLeft, ChevronUp } from "lucide-react";
import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PracticesDailyScore } from "@/features/practices-hub/services/computePracticesDailyScore";
import { PracticesHubLabArmillary } from "./PracticesHubLabArmillary";
import {
  buildPracticesHubLabCalendar,
  type PracticesHubLabCalendarDotKind,
} from "./practicesHubLabCalendar";

type PracticesHubLabPresenceProps = {
  dailyScore: PracticesDailyScore | null;
  loading: boolean;
  onOpenPractices: () => void;
};

function dotClass(kind: PracticesHubLabCalendarDotKind): string {
  if (kind === "neutral") return "practices-hub-lab__dot";
  return `practices-hub-lab__dot practices-hub-lab__dot--${kind}`;
}

export function PracticesHubLabPresence({
  dailyScore,
  loading,
  onOpenPractices,
}: PracticesHubLabPresenceProps) {
  const { t, locale } = useLanguage();

  const scoreMain = (() => {
    if (loading || !dailyScore) return "…";
    if (!dailyScore.hasItems) return "—";
    return `${dailyScore.done} / ${dailyScore.total}`;
  })();

  const calendarDays = useMemo(() => buildPracticesHubLabCalendar(locale), [locale]);

  const scrollLabel = `${t("hub.practices.dailyScoreLabel")} ${scoreMain}. ${t("hub.practices.railLabel")}`;

  return (
    <div className="practices-hub-lab__top">
      <header className="practices-hub-lab__head">
        <Link to="/dev" className="practices-hub-lab__head-back">
          <ArrowLeft className="h-5 w-5" aria-hidden />
          <span>Lab</span>
        </Link>
        <h1 className="practices-hub-lab__head-title">{t("hub.title")}</h1>
        <span className="practices-hub-lab__head-spacer" aria-hidden />
      </header>

      <section className="practices-hub-lab__hero" aria-label={t("hub.practices.railLabel")}>
        <div className="practices-hub-lab__hero-armillary">
          <PracticesHubLabArmillary className="h-full w-full" />
        </div>
        <div className="practices-hub-lab__hero-fade" aria-hidden />
        <div className="practices-hub-lab__hero-streak" aria-hidden />

        <ul className="practices-hub-lab__cal" aria-label="Calendar">
          {calendarDays.map((day) => (
            <li
              key={day.id}
              className={day.isToday ? "practices-hub-lab__day practices-hub-lab__day--on" : "practices-hub-lab__day"}
              aria-label={`${day.dayNum} ${day.weekday}${day.isToday ? ", today" : ""}`}
            >
              <div>
                <span className="practices-hub-lab__day-num">{day.dayNum}</span>
                <small className="practices-hub-lab__day-cap">{day.weekday}</small>
              </div>
              <div className="practices-hub-lab__dots" aria-hidden>
                {day.dots.map((kind, i) => (
                  <span key={`${day.id}-${i}`} className={dotClass(kind)} />
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="practices-hub-lab__cards-wrap">
        <div className="practices-hub-lab__cards" role="region" aria-label={t("hub.practices.dailyScoreLabel")}>
          <button
            type="button"
            className="practices-hub-lab__card"
            onClick={onOpenPractices}
            aria-label={scrollLabel}
          >
            <p className="practices-hub-lab__card-k">{t("hub.practices.dailyScoreLabel")}</p>
            <p className="practices-hub-lab__card-v" aria-live="polite">
              {scoreMain}
            </p>
          </button>
        </div>
        <button type="button" className="practices-hub-lab__tab" onClick={onOpenPractices} aria-label={scrollLabel}>
          <ChevronUp className="h-4 w-4" strokeWidth={1.6} aria-hidden />
        </button>
      </div>
    </div>
  );
}

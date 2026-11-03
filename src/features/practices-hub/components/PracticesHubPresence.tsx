import { useLanguage } from "@/i18n/LanguageContext";
import type { PracticesDailyScore } from "../services/computePracticesDailyScore";
import { PracticesHubArmillary } from "./PracticesHubArmillary";

type PracticesHubPresenceProps = {
  dailyScore: PracticesDailyScore | null;
  loading: boolean;
};

export function PracticesHubPresence({ dailyScore, loading }: PracticesHubPresenceProps) {
  const { t } = useLanguage();

  const scoreMain = (() => {
    if (loading || !dailyScore) return "…";
    if (!dailyScore.hasItems) return "—";
    return `${dailyScore.done} / ${dailyScore.total}`;
  })();

  return (
    <header className="relative h-[min(42dvh,360px)] min-h-[240px] overflow-visible bg-[#f3f2ef]">
      <div className="absolute inset-0 overflow-hidden">
        <PracticesHubArmillary className="absolute inset-0 h-full w-full" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f3f2ef] to-transparent"
          aria-hidden
        />
      </div>

      <div className="absolute inset-x-4 bottom-0 z-10 translate-y-[42%] sm:inset-x-6">
        <div className="rounded-[28px] bg-white px-5 py-5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:px-6">
          <p className="font-barlow text-[12px] font-medium text-neutral-500">
            {t("hub.practices.dailyScoreLabel")}
          </p>
          <p
            className="mt-1 font-barlow text-[3.4rem] font-light leading-none tabular-nums tracking-tight text-neutral-900"
            aria-live="polite"
          >
            {scoreMain}
          </p>
        </div>
      </div>
    </header>
  );
}

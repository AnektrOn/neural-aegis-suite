import { useLanguage } from "@/i18n/LanguageContext";
import type { PracticesHubHabitsToday } from "@/features/practices-hub/services/fetchPracticesHubHabitsToday";

const MAX_LINES = 5;

type Props = {
  habits: PracticesHubHabitsToday | null;
  loading: boolean;
};

export function PracticesHubLabFeaturedHabits({ habits, loading }: Props) {
  const { t } = useLanguage();

  if (loading || !habits) {
    return <p className="practices-hub-lab__feat-muted font-barlow">…</p>;
  }

  if (habits.total === 0) {
    return (
      <p className="practices-hub-lab__feat-muted font-barlow">{t("hub.practices.habitsNoneAssigned")}</p>
    );
  }

  if (habits.pending.length === 0) {
    return (
      <p className="practices-hub-lab__feat-muted font-barlow">{t("hub.practices.habitsAllDone")}</p>
    );
  }

  const visible = habits.pending.slice(0, MAX_LINES);
  const extra = habits.pending.length - visible.length;

  return (
    <div className="practices-hub-lab__feat-habits">
      <ul className="practices-hub-lab__habit-list">
        {visible.map((item) => (
          <li key={item.id} className="practices-hub-lab__habit-row font-barlow">
            <span className="practices-hub-lab__habit-check" aria-hidden />
            <span className="practices-hub-lab__habit-label">{item.name}</span>
          </li>
        ))}
      </ul>
      {extra > 0 ? (
        <p className="practices-hub-lab__feat-more font-barlow">
          {t("hub.practices.habitsMorePending", { count: extra })}
        </p>
      ) : null}
    </div>
  );
}

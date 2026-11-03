import { useLanguage } from "@/i18n/LanguageContext";
import type { PulseCard } from "@/features/aegis-pulse/domain/types";
import { PracticesHubLabPulseMiniCard } from "./PracticesHubLabPulseMiniCard";

type Props = {
  card: PulseCard | null;
  deckCardCount: number;
  loading: boolean;
};

export function PracticesHubLabFeaturedPulse({ card, deckCardCount, loading }: Props) {
  const { t } = useLanguage();

  if (loading) {
    return <p className="practices-hub-lab__feat-muted font-barlow">…</p>;
  }

  if (!card || deckCardCount === 0) {
    return <p className="practices-hub-lab__feat-muted font-barlow">{t("hub.practices.pulseDeckEmpty")}</p>;
  }

  return (
    <div className="practices-hub-lab__feat-pulse">
      <PracticesHubLabPulseMiniCard card={card} />
    </div>
  );
}

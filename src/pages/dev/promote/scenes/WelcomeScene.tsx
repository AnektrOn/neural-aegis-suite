import { WelcomeHudScreen } from "@/features/welcome/components/WelcomeHudScreen";
import { useLanguage } from "@/i18n/LanguageContext";
import { PROMOTE_USER } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

export function WelcomeScene() {
  const { t } = useLanguage();
  const { next } = usePromotePlayer();
  return (
    <WelcomeHudScreen firstName={PROMOTE_USER.firstName} t={t} onDashboard={next} />
  );
}

import { Button } from "@/components/ui/button";
import { GuardianNebula } from "@/features/guardian/components/GuardianNebula";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePromotePlayer } from "../PromotePlayerContext";

export function GuardianActivateScene() {
  const { t } = useLanguage();
  const { next, goTo } = usePromotePlayer();
  const skipToQuiz = () => goTo("quiz");
  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-black">
      <GuardianNebula state="repos" fullscreen className="pointer-events-none z-0" />
      <div className="absolute inset-x-0 bottom-0 z-40 flex flex-col items-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10 bg-gradient-to-t from-background/90 via-background/55 to-transparent">
        <p className="font-display text-[10px] uppercase tracking-[0.28em] text-primary/80">Argos</p>
        <h1 className="mt-3 text-center font-cormorant text-3xl font-light text-foreground">
          {t("guardian.activate.title")}
        </h1>
        <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          {t("guardian.activate.body")}
        </p>
        <Button className="mt-6 w-full max-w-xs" onClick={next}>
          {t("guardian.activate.yes")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full max-w-xs text-muted-foreground hover:text-foreground"
          onClick={skipToQuiz}
        >
          {t("guardian.skip")}
        </Button>
      </div>
    </div>
  );
}

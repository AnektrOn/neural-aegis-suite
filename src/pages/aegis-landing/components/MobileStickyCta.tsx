import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingButton } from "./LandingButton";

export function MobileStickyCta() {
  const { copy, audience, locale } = useAegisLandingLocale();
  const ctaHref = audience === "individuel" ? "/pricing" : "#tarif";
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--aegis-hairline)] bg-[color:var(--aegis-page)]/95 p-3 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex flex-col gap-2">
        <LandingButton href={ctaHref} variant="dark" className="w-full">
          {audience === "individuel" ? locale === "fr" ? "Voir les offres" : "View plans" : copy.hero.cta}
        </LandingButton>
        <LandingButton href="/auth" variant="ghost" className="w-full">
          {copy.nav.signIn}
        </LandingButton>
      </div>
    </div>
  );
}

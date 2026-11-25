import { Loader2 } from "lucide-react";
import type { MajorArchetypeScore } from "@/features/logos/onboardingReportOpening";

type Props = {
  isFR: boolean;
  firstName: string;
  loading: boolean;
  needsEmbed: boolean;
  opening?: {
    first_message: string;
    top_archetypes: MajorArchetypeScore[];
  } | null;
};

export function OnboardingFirstMessagePretest({
  isFR,
  firstName,
  loading,
  needsEmbed,
  opening,
}: Props) {
  return (
    <section
      className="pointer-events-auto mt-3 max-w-xl space-y-2 rounded-lg border border-primary/25 bg-primary/5 p-3 text-left"
      aria-label={isFR ? "Pré-test texte LOGOS" : "LOGOS text pre-test"}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">
          {isFR ? "Pré-test · premier message (texte seul)" : "Pre-test · first message (text only)"}
        </p>
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {isFR ? "0 quota ElevenLabs" : "0 ElevenLabs quota"}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {isFR
          ? `Prénom injecté : « ${firstName} » — calcul local depuis 00_RAPPORT (Drive). La voix ne part que si tu ajoutes ?voice=1 à l’URL et cliques « Parler à mon agent ».`
          : `Injected first name: “${firstName}” — computed locally from 00_RAPPORT (Drive). Voice only runs with ?voice=1 in the URL and “Talk to my agent”.`}
      </p>
      {loading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          {isFR ? "Lecture du rapport pour extraire le top 3…" : "Reading report to extract top 3…"}
        </p>
      ) : needsEmbed ? (
        <p className="text-xs text-muted-foreground">
          {isFR
            ? "Ouvre l’aperçu KB une fois pour charger 00_RAPPORT, ou attends le chargement automatique."
            : "Open KB preview once to load 00_RAPPORT, or wait for auto-load."}
        </p>
      ) : opening ? (
        <>
          {opening.top_archetypes.length >= 3 ? (
            <p className="font-mono text-[10px] text-muted-foreground">
              Top 3 :{" "}
              {opening.top_archetypes.map((a) => `${a.label} (${a.score})`).join(" · ")}
            </p>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-200">
              {isFR
                ? "Moins de 3 majeurs détectés dans l’aperçu (troncature ou format) — message de repli ci-dessous."
                : "Fewer than 3 majors detected in preview (truncation or format) — fallback message below."}
            </p>
          )}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{opening.first_message}</p>
        </>
      ) : null}
    </section>
  );
}
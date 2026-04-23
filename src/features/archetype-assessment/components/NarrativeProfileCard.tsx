import { Card } from "@/components/ui/card";
import { BookOpenText } from "lucide-react";
import { archetypeMeta } from "../services/assessmentService";
import type { ArchetypeKey } from "../domain/types";

const SHADOW_LABELS_FR: Record<string, string> = {
  control: "Contrôle",
  victim: "Victime",
  prostitute: "Prostitué·e",
  saboteur: "Saboteur",
};
const SHADOW_LABELS_EN: Record<string, string> = {
  control: "Control",
  victim: "Victim",
  prostitute: "Prostitute",
  saboteur: "Saboteur",
};

export interface NarrativeContext {
  isFR: boolean;
  topArchetypes: ArchetypeKey[]; // ordered by score desc
  shadowSignals: Record<string, number>;
}

/** Pure helper used by both the card and the PDF export. */
export function buildNarrative({ isFR, topArchetypes, shadowSignals }: NarrativeContext): string {
  const a1 = topArchetypes[0] ? archetypeMeta(topArchetypes[0]) : null;
  const a2 = topArchetypes[1] ? archetypeMeta(topArchetypes[1]) : null;
  const a3 = topArchetypes[2] ? archetypeMeta(topArchetypes[2]) : null;

  const shadowEntries = Object.entries(shadowSignals ?? {})
    .filter(([k]) => ["control", "victim", "prostitute", "saboteur"].includes(k))
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const topShadowKey = shadowEntries[0]?.[0];
  const shadowLabel = topShadowKey
    ? (isFR ? SHADOW_LABELS_FR[topShadowKey] : SHADOW_LABELS_EN[topShadowKey])
    : null;

  if (!a1) return "";

  const n1 = isFR ? a1.name_fr : a1.name_en;
  const n2 = a2 ? (isFR ? a2.name_fr : a2.name_en) : null;
  const n3 = a3 ? (isFR ? a3.name_fr : a3.name_en) : null;

  if (isFR) {
    let s = `Tu exprimes avant tout l'énergie du ${n1}`;
    if (n2) s += `, combinée à une forte présence du ${n2}`;
    s += ".";
    if (n3) s += ` Ton ${n3} émerge comme une ressource secondaire puissante.`;
    if (shadowLabel) {
      s += ` L'ombre principale qui traverse ton profil est ${shadowLabel} — explorer cette tension est souvent la clé de ta prochaine étape.`;
    }
    return s;
  }
  let s = `You primarily express the energy of the ${n1}`;
  if (n2) s += `, combined with a strong presence of ${n2}`;
  s += ".";
  if (n3) s += ` Your ${n3} emerges as a powerful secondary resource.`;
  if (shadowLabel) {
    s += ` The main shadow running through your profile is ${shadowLabel} — exploring this tension is often the key to your next step.`;
  }
  return s;
}

interface Props extends NarrativeContext {}

export function NarrativeProfileCard(props: Props) {
  const text = buildNarrative(props);
  if (!text) return null;

  return (
    <Card className="p-5 sm:p-6 border-primary/30 bg-gradient-to-br from-primary/5 via-background/30 to-secondary/5 backdrop-blur-3xl">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BookOpenText className="w-4 h-4 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-serif text-lg mb-2">
            {props.isFR ? "Ton récit archétypal" : "Your archetypal narrative"}
          </h3>
          <p className="text-sm leading-relaxed text-foreground/90 italic">
            {text}
          </p>
        </div>
      </div>
    </Card>
  );
}

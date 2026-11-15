import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { AegisConversionCard } from "@/components/tools/AegisConversionCard";
import { ToolStepWizard, type ToolWizardStep } from "@/components/tools/ToolStepWizard";
import { getToolById } from "@/components/tools/toolsRegistry";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  ToolChip,
  ToolChipStack,
  ToolDiagnostic,
  ToolResultGrid,
  ToolResultStat,
} from "@/components/tools/ToolField";
import { toolsInput, toolsSlider } from "@/components/tools/toolsDesign";
import { CEO_ARCHETYPE_LABELS, getCeoProfile } from "@/lib/tools/ceoProfile";
import { ToolCrossInsights } from "@/components/tools/ToolCrossInsights";
import { ToolNextStep } from "@/components/tools/ToolNextStep";
import { useToolSessionPersistence } from "@/hooks/useToolSession";

const STUCK = [
  { id: "emotion", label: "Enjeu personnel / émotion" },
  { id: "data", label: "Trop de données, pas de clarté" },
  { id: "politics", label: "Politique interne" },
  { id: "fear", label: "Peur de l'erreur visible" },
] as const;

export default function DecisionBiasReframeToolPage() {
  const tool = getToolById("decision-bias-reframe-tool");
  const [resultsVisible, setResultsVisible] = useState(false);
  const [stuck, setStuck] = useState<(typeof STUCK)[number]["id"]>("data");
  const [peerNote, setPeerNote] = useState("");
  const [successorNote, setSuccessorNote] = useState("");
  const [halfStakes, setHalfStakes] = useState(5);

  const profile = getCeoProfile();

  const clarity = useMemo(() => {
    const textScore = Math.min(40, (peerNote.length + successorNote.length) / 8);
    const lensScore = halfStakes * 6;
    let stuckPenalty = stuck === "emotion" || stuck === "fear" ? 8 : 0;
    if (profile?.archetype === "first-time-founder" && (stuck === "fear" || stuck === "emotion")) {
      stuckPenalty += 4;
    }
    if (profile?.archetype === "serial-entrepreneur") {
      stuckPenalty -= 2;
    }
    return Math.min(100, Math.round(textScore + lensScore + 20 - stuckPenalty));
  }, [peerNote, successorNote, halfStakes, stuck, profile]);

  const sessionOutputs = useMemo(() => ({ clarity, stuck }), [clarity, stuck]);

  useToolSessionPersistence(
    "decision-bias-reframe-tool",
    resultsVisible,
    { stuck, halfStakes },
    sessionOutputs,
  );

  const steps: ToolWizardStep[] = [
    {
      id: "stuck",
      kicker: "Étape 1",
      title: "Qu'est-ce qui bloque l'arbitrage ?",
      content: (
        <ToolChipStack>
          {STUCK.map((o) => (
            <ToolChip key={o.id} fullWidth active={stuck === o.id} onClick={() => setStuck(o.id)}>
              {o.label}
            </ToolChip>
          ))}
        </ToolChipStack>
      ),
    },
    {
      id: "peer",
      kicker: "Filtre 1 — Friend Reframe",
      title: "Que conseilleriez-vous à un pair dans la même situation ?",
      description: "Écrivez comme si vous n'aviez pas d'enjeu identitaire dans le résultat.",
      content: (
        <Textarea
          value={peerNote}
          onChange={(e) => setPeerNote(e.target.value)}
          rows={5}
          placeholder="En une minute, je lui dirais de…"
          className={`${toolsInput} min-h-[140px]`}
        />
      ),
      canContinue: () => peerNote.trim().length >= 12,
    },
    {
      id: "successor",
      kicker: "Filtre 2",
      title: "Que ferait votre successeur demain matin ?",
      content: (
        <Textarea
          value={successorNote}
          onChange={(e) => setSuccessorNote(e.target.value)}
          rows={5}
          placeholder="Sans votre historique émotionnel, la première action serait…"
          className={`${toolsInput} min-h-[140px]`}
        />
      ),
      canContinue: () => successorNote.trim().length >= 12,
    },
    {
      id: "half",
      kicker: "Filtre 3",
      title: "Si les enjeux étaient divisés par deux ?",
      description: `Clarté ressentie : ${halfStakes} / 10`,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Imaginez la même décision avec la moitié du risque réputationnel et financier — quelle option
            devient évidente ?
          </p>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[halfStakes]}
            onValueChange={([v]) => setHalfStakes(v ?? halfStakes)}
            className={toolsSlider}
          />
        </div>
      ),
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      wizardResultsVisible={resultsVisible}
      seoContent={
        <>
          <h2>Unstick hard decisions</h2>
          <p>
            Framework decision making for leaders : trois inversions cognitives avant de trancher — peer,
            successeur, enjeux réduits.
          </p>
        </>
      }
    >
      <ToolStepWizard
        steps={steps}
        onResultsVisible={() => setResultsVisible(true)}
        resultStep={{
          title: "Score de déblocage",
          content: (
            <>
              <ToolResultGrid>
                <ToolResultStat label="Clarté après reframe" value={`${clarity} %`} accent="gold" />
                <ToolResultStat
                  label="Verdict"
                  value={clarity >= 65 ? "Prêt à trancher" : clarity >= 40 ? "Affiner encore" : "Re-stucker"}
                  accent={clarity >= 65 ? "gold" : "copper"}
                />
              </ToolResultGrid>
              <ToolDiagnostic variant="info">
                Synthèse pair : {peerNote.trim() || "—"}
                <br />
                <br />
                Lentille successeur : {successorNote.trim() || "—"}
              </ToolDiagnostic>
              {profile ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  Score ajusté à votre archétype ({CEO_ARCHETYPE_LABELS[profile.archetype]}).
                </p>
              ) : null}
              <ToolCrossInsights />
              <ToolNextStep toolId="decision-bias-reframe-tool" outputs={sessionOutputs} />
              <AegisConversionCard
                problemKind="bias"
                className="mt-8"
                ctaLabel="Journaliser l'arbitrage dans AEGIS"
                ctaHref="/onboarding"
              />
            </>
          ),
        }}
      />
    </ToolLayout>
  );
}
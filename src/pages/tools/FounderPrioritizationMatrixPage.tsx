import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { AegisConversionCard } from "@/components/tools/AegisConversionCard";
import { ToolStepWizard, type ToolWizardStep } from "@/components/tools/ToolStepWizard";
import { getToolById } from "@/components/tools/toolsRegistry";
import { Slider } from "@/components/ui/slider";
import {
  ToolChip,
  ToolChipStack,
  ToolDiagnostic,
  ToolResultGrid,
  ToolResultStat,
} from "@/components/tools/ToolField";
import { toolsSlider } from "@/components/tools/toolsDesign";

const REQUEST_TYPES = [
  { id: "deal", label: "Opportunité commerciale" },
  { id: "meeting", label: "Réunion / conseil" },
  { id: "partnership", label: "Partenariat" },
  { id: "hire", label: "Recrutement / renfort" },
] as const;

export default function FounderPrioritizationMatrixPage() {
  const tool = getToolById("founder-prioritization-matrix");
  const [resultsVisible, setResultsVisible] = useState(false);
  const [requestType, setRequestType] = useState<(typeof REQUEST_TYPES)[number]["id"]>("meeting");
  const [alignment, setAlignment] = useState(4);
  const [hiddenLoad, setHiddenLoad] = useState(6);

  const verdict = useMemo(() => {
    const score = alignment * 10 - hiddenLoad * 4;
    if (score >= 45) return { label: "Oui — prioriser", accent: "gold" as const };
    if (score >= 20) return { label: "Peut-être — cadrer", accent: "gold" as const };
    return { label: "Non — sanctuariser le cap", accent: "copper" as const };
  }, [alignment, hiddenLoad]);

  const steps: ToolWizardStep[] = [
    {
      id: "type",
      kicker: "Étape 1 / 3",
      title: "Quelle sollicitation évaluez-vous ?",
      content: (
        <ToolChipStack>
          {REQUEST_TYPES.map((o) => (
            <ToolChip key={o.id} fullWidth active={requestType === o.id} onClick={() => setRequestType(o.id)}>
              {o.label}
            </ToolChip>
          ))}
        </ToolChipStack>
      ),
    },
    {
      id: "align",
      kicker: "Étape 2 / 3",
      title: "Alignement avec votre cap stratégique",
      description: `${alignment} / 10`,
      content: (
        <Slider
          min={1}
          max={10}
          step={1}
          value={[alignment]}
          onValueChange={([v]) => setAlignment(v ?? alignment)}
          className={toolsSlider}
        />
      ),
    },
    {
      id: "load",
      kicker: "Étape 3 / 3",
      title: "Charge cachée (préparation, suivi, politique)",
      description: `${hiddenLoad} / 10`,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Même un « oui » léger consomme du fondateur — estimez le coût invisible.
          </p>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[hiddenLoad]}
            onValueChange={([v]) => setHiddenLoad(v ?? hiddenLoad)}
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
          <h2>Saying no framework for CEOs</h2>
          <p>
            Matrice founder prioritization en trois filtres : type de demande, alignement et charge cachée —
            pour protéger le cap.
          </p>
        </>
      }
    >
      <ToolStepWizard
        steps={steps}
        onResultsVisible={() => setResultsVisible(true)}
        resultStep={{
          title: "Verdict « Saying No »",
          description: `Type : ${REQUEST_TYPES.find((t) => t.id === requestType)?.label}`,
          content: (
            <>
              <ToolResultGrid>
                <ToolResultStat label="Recommandation" value={verdict.label} accent={verdict.accent} />
                <ToolResultStat label="Score net" value={`${alignment * 10 - hiddenLoad * 4}`} />
              </ToolResultGrid>
              <ToolDiagnostic variant={verdict.label.startsWith("Non") ? "warning" : "info"}>
                {verdict.label.startsWith("Non")
                  ? "Un non explicite libère plus de valeur qu'un oui tiède qui déplace la stratégie."
                  : "Si vous dites oui, tracez la priorité dans votre système — sinon elle ressurgit sous une autre forme."}
              </ToolDiagnostic>
              <AegisConversionCard
                problemKind="prioritization"
                className="mt-8"
                ctaLabel="Piloter mes priorités dans AEGIS"
                ctaHref="/onboarding"
              />
            </>
          ),
        }}
      />
    </ToolLayout>
  );
}
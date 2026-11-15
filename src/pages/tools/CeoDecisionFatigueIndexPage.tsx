import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { AegisConversionCard } from "@/components/tools/AegisConversionCard";
import { ToolStepWizard, type ToolWizardStep } from "@/components/tools/ToolStepWizard";
import { getToolById } from "@/components/tools/toolsRegistry";
import { ToolGauge } from "@/components/tools/ToolGauge";
import { Slider } from "@/components/ui/slider";
import {
  ToolChip,
  ToolChipStack,
  ToolDiagnostic,
  ToolResultGrid,
  ToolResultStat,
} from "@/components/tools/ToolField";
import { toolsSlider } from "@/components/tools/toolsDesign";
import { getCeoProfile } from "@/lib/tools/ceoProfile";
import { calculateAdvancedFatigueIndex } from "@/lib/tools/fatigueIndex";
import { NarrativeActions } from "@/components/tools/NarrativeActions";
import { ToolCrossInsights } from "@/components/tools/ToolCrossInsights";
import { ToolNextStep } from "@/components/tools/ToolNextStep";
import { useToolSessionPersistence } from "@/hooks/useToolSession";

const POSTPONE = [
  { id: "rarely", label: "Rarement", score: 5 },
  { id: "sometimes", label: "Parfois", score: 14 },
  { id: "often", label: "Souvent", score: 24 },
  { id: "daily", label: "Quasi chaque soir", score: 32 },
] as const;

const DEFAULT_CHOICE = [
  { id: "rarely", label: "Je tranche encore", score: 0 },
  { id: "sometimes", label: "Parfois le chemin facile", score: 12 },
  { id: "often", label: "Souvent par défaut", score: 20 },
  { id: "always", label: "Presque toujours", score: 28 },
] as const;

const FOG = [
  { id: "low", label: "Tête claire", score: 4 },
  { id: "medium", label: "Brouillard modéré", score: 12 },
  { id: "high", label: "Mental fog marqué", score: 20 },
] as const;

export default function CeoDecisionFatigueIndexPage() {
  const tool = getToolById("ceo-decision-fatigue-index");
  const profile = getCeoProfile();
  const [resultsVisible, setResultsVisible] = useState(false);
  const [postpone, setPostpone] = useState<(typeof POSTPONE)[number]["id"]>("often");
  const [defaultChoice, setDefaultChoice] = useState<(typeof DEFAULT_CHOICE)[number]["id"]>("sometimes");
  const [saturation, setSaturation] = useState(7);
  const [fog, setFog] = useState<(typeof FOG)[number]["id"]>("medium");

  const fatigue = useMemo(() => {
    const inputs = {
      postponeScore: POSTPONE.find((x) => x.id === postpone)!.score,
      defaultChoiceScore: DEFAULT_CHOICE.find((x) => x.id === defaultChoice)!.score,
      saturation,
      fogScore: FOG.find((x) => x.id === fog)!.score,
    };
    return calculateAdvancedFatigueIndex(inputs, profile);
  }, [postpone, defaultChoice, saturation, fog, profile]);

  const sessionInputs = useMemo(
    () => ({ postpone, defaultChoice, saturation, fog }),
  [postpone, defaultChoice, saturation, fog]);

  const sessionOutputs = useMemo(
    () => ({
      index: fatigue.index,
      riskLevel: fatigue.riskLevel,
      drivers: fatigue.drivers,
      percentile: fatigue.percentile,
    }),
    [fatigue],
  );

  useToolSessionPersistence(
    "ceo-decision-fatigue-index",
    resultsVisible,
    sessionInputs,
    sessionOutputs,
  );

  const steps: ToolWizardStep[] = [
    {
      id: "postpone",
      kicker: "Question 1 / 4",
      title: "En fin de journée, repoussez-vous des décisions importantes ?",
      content: (
        <ToolChipStack>
          {POSTPONE.map((o) => (
            <ToolChip key={o.id} fullWidth active={postpone === o.id} onClick={() => setPostpone(o.id)}>
              {o.label}
            </ToolChip>
          ))}
        </ToolChipStack>
      ),
    },
    {
      id: "default",
      kicker: "Question 2 / 4",
      title: "Choisissez-vous par défaut pour éviter de trancher ?",
      content: (
        <ToolChipStack>
          {DEFAULT_CHOICE.map((o) => (
            <ToolChip
              key={o.id}
              fullWidth
              active={defaultChoice === o.id}
              onClick={() => setDefaultChoice(o.id)}
            >
              {o.label}
            </ToolChip>
          ))}
        </ToolChipStack>
      ),
    },
    {
      id: "saturation",
      kicker: "Question 3 / 4",
      title: "Saturation cognitive en fin de journée",
      description: `Niveau : ${saturation} / 10`,
      content: (
        <div className="space-y-6">
          <Slider
            min={1}
            max={10}
            step={1}
            value={[saturation]}
            onValueChange={([v]) => setSaturation(v ?? saturation)}
            className={toolsSlider}
          />
        </div>
      ),
    },
    {
      id: "fog",
      kicker: "Question 4 / 4",
      title: "Ressentez-vous du mental fog en fin de journée ?",
      content: (
        <ToolChipStack>
          {FOG.map((o) => (
            <ToolChip key={o.id} fullWidth active={fog === o.id} onClick={() => setFog(o.id)}>
              {o.label}
            </ToolChip>
          ))}
        </ToolChipStack>
      ),
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      wizardResultsVisible={resultsVisible}
      seoContent={
        <>
          <h2>CEO decision fatigue test</h2>
          <p>
            L&apos;indice agrège reports, choix par défaut, saturation et brouillard mental — signaux du founder
            mental fog sans instrument clinique.
          </p>
        </>
      }
    >
      <ToolStepWizard
        steps={steps}
        onResultsVisible={() => setResultsVisible(true)}
        resultStep={{
          title: "Votre indice de fatigue décisionnelle",
          content: (
            <>
              <div className="mb-8 flex justify-center">
                <ToolGauge
                  value={fatigue.index}
                  label="Indice de fatigue"
                  tone={fatigue.index >= 60 ? "danger" : fatigue.index >= 40 ? "copper" : "gold"}
                />
              </div>
              <ToolResultGrid>
                <ToolResultStat label="Niveau" value={fatigue.riskLevel} accent={fatigue.index >= 50 ? "copper" : "gold"} />
                <ToolResultStat label="Capacité résiduelle" value={`${Math.max(0, 100 - fatigue.index)} %`} />
                {fatigue.percentile != null ? (
                  <ToolResultStat
                    label="Percentile (profil)"
                    value={`${fatigue.percentile}e`}
                    accent="gold"
                  />
                ) : (
                  <ToolResultStat label="Calibration" value={profile ? "Profil actif" : "Profil générique"} />
                )}
                <ToolResultStat
                  label="Leviers dominants"
                  value={fatigue.drivers.join(" · ")}
                />
              </ToolResultGrid>
              <ToolDiagnostic variant={fatigue.index >= 50 ? "warning" : "info"}>
                {fatigue.index >= 50
                  ? "Saturation en fin de journée : externalisez le contexte pour libérer la mémoire vive avant les arbitrages structurants."
                  : "Vigilance utile en période de pic : un registre d'arbitrage évite que la fatigue ne s'accumule invisiblement."}
              </ToolDiagnostic>
              <NarrativeActions narrative={fatigue.narrative} actions={fatigue.actionBullets} className="mt-6" />
              <ToolCrossInsights />
              <ToolNextStep toolId="ceo-decision-fatigue-index" outputs={sessionOutputs} />
              <AegisConversionCard
                problemKind="fatigue"
                className="mt-8"
                ctaLabel="Décharger la mémoire vive sur AEGIS"
                ctaHref="/onboarding"
              />
            </>
          ),
        }}
      />
    </ToolLayout>
  );
}
import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { AegisConversionCard } from "@/components/tools/AegisConversionCard";
import { ToolStepWizard, type ToolWizardStep } from "@/components/tools/ToolStepWizard";
import { getToolById } from "@/components/tools/toolsRegistry";
import { Slider } from "@/components/ui/slider";
import {
  ToolDiagnostic,
  ToolResultGrid,
  ToolResultStat,
  formatEuro,
} from "@/components/tools/ToolField";
import { toolsSlider } from "@/components/tools/toolsDesign";
import { getCeoProfile } from "@/lib/tools/ceoProfile";
import { calculateContextSwitch } from "@/lib/tools/contextSwitch";
import { ToolCrossInsights } from "@/components/tools/ToolCrossInsights";
import { ToolNextStep } from "@/components/tools/ToolNextStep";
import { useToolSessionPersistence } from "@/hooks/useToolSession";

export default function ExecutiveContextSwitchingCalculatorPage() {
  const tool = getToolById("executive-context-switching-calculator");
  const profile = getCeoProfile();
  const [resultsVisible, setResultsVisible] = useState(false);
  const [switchesPerDay, setSwitchesPerDay] = useState(14);
  const [recoveryMin, setRecoveryMin] = useState(18);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(350);

  const results = useMemo(
    () =>
      calculateContextSwitch(
        { switchesPerDay, recoveryMin, daysPerWeek, hourlyRate },
        profile,
      ),
    [switchesPerDay, recoveryMin, daysPerWeek, hourlyRate, profile],
  );

  const sessionInputs = useMemo(
    () => ({ switchesPerDay, recoveryMin, daysPerWeek, hourlyRate }),
    [switchesPerDay, recoveryMin, daysPerWeek, hourlyRate],
  );

  const sessionOutputs = useMemo(
    () => ({
      hoursPerWeek: results.hoursPerWeek,
      hoursPerYear: results.hoursPerYear,
      costPerYear: results.costPerYear,
      overloadLabel: results.overloadLabel,
    }),
    [results],
  );

  useToolSessionPersistence(
    "executive-context-switching-calculator",
    resultsVisible,
    sessionInputs,
    sessionOutputs,
  );

  const steps: ToolWizardStep[] = [
    {
      id: "switches",
      kicker: "Étape 1",
      title: "Bascules de contexte par jour",
      description: "Board, investisseurs, équipe, clients…",
      content: (
        <div className="space-y-6">
          <p className="text-center font-cormorant-display text-3xl text-[color:var(--aegis-bronze-ink)]">{switchesPerDay}</p>
          <Slider
            min={4}
            max={30}
            step={1}
            value={[switchesPerDay]}
            onValueChange={([v]) => setSwitchesPerDay(v ?? switchesPerDay)}
            className={toolsSlider}
          />
        </div>
      ),
    },
    {
      id: "recovery",
      kicker: "Étape 2",
      title: "Minutes pour retrouver le fil mental",
      description: `${recoveryMin} min (base) · effectif ~${results.effectiveRecoveryMin.toFixed(0)} min avec votre profil`,
      content: (
        <Slider
          min={5}
          max={45}
          step={1}
          value={[recoveryMin]}
          onValueChange={([v]) => setRecoveryMin(v ?? recoveryMin)}
          className={toolsSlider}
        />
      ),
    },
    {
      id: "days",
      kicker: "Étape 3",
      title: "Jours concernés par semaine",
      description: `${daysPerWeek} j`,
      content: (
        <Slider
          min={3}
          max={6}
          step={1}
          value={[daysPerWeek]}
          onValueChange={([v]) => setDaysPerWeek(v ?? daysPerWeek)}
          className={toolsSlider}
        />
      ),
    },
    {
      id: "rate",
      kicker: "Étape 4",
      title: "Valeur horaire de votre attention",
      description: formatEuro(hourlyRate) + " / h",
      content: (
        <Slider
          min={150}
          max={900}
          step={25}
          value={[hourlyRate]}
          onValueChange={([v]) => setHourlyRate(v ?? hourlyRate)}
          className={toolsSlider}
        />
      ),
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      wizardResultsVisible={resultsVisible}
      seoContent={
        <>
          <h2>Executive context switching cost</h2>
          <p>
            CEO cognitive overload calculator : heures perdues à reconstituer le contexte entre cercles
            décisionnels.
          </p>
        </>
      }
    >
      <ToolStepWizard
        steps={steps}
        onResultsVisible={() => setResultsVisible(true)}
        resultStep={{
          title: "Perte hebdomadaire par context switching",
          content: (
            <>
              <ToolResultGrid>
                <ToolResultStat
                  label="Heures perdues / semaine"
                  value={`${results.hoursPerWeek.toFixed(1)} h`}
                  accent="copper"
                />
                <ToolResultStat label="Sévérité" value={results.overloadLabel} accent="gold" />
                <ToolResultStat label="Heures / an (48 sem.)" value={`${Math.round(results.hoursPerYear)} h`} />
                <ToolResultStat label="Coût annuel estimé" value={formatEuro(results.costPerYear)} accent="gold" />
                {results.percentile != null ? (
                  <ToolResultStat label="Percentile (profil)" value={`${results.percentile}e`} accent="gold" />
                ) : null}
              </ToolResultGrid>
              <ToolDiagnostic variant={results.hoursPerWeek >= 6 ? "warning" : "info"}>
                {results.narrative}
              </ToolDiagnostic>
              <ToolCrossInsights />
              <ToolNextStep toolId="executive-context-switching-calculator" outputs={sessionOutputs} />
              <AegisConversionCard
                problemKind="contextSwitch"
                className="mt-8"
                ctaLabel="Vault privé : reconstituer le contexte"
                ctaHref="/onboarding"
              />
            </>
          ),
        }}
      />
    </ToolLayout>
  );
}
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
  formatEuro,
} from "@/components/tools/ToolField";
import { toolsSlider } from "@/components/tools/toolsDesign";
import { ToolCrossInsights } from "@/components/tools/ToolCrossInsights";
import { ToolNextStep } from "@/components/tools/ToolNextStep";
import { useToolSessionPersistence } from "@/hooks/useToolSession";

const DELAY_MONTHS = [
  { id: 1, label: "1 mois", months: 1 },
  { id: 2, label: "2 mois", months: 2 },
  { id: 3, label: "3 mois", months: 3 },
] as const;

export default function CostOfDelayedDecisionCalculatorPage() {
  const tool = getToolById("cost-of-delayed-decision-calculator");
  const [resultsVisible, setResultsVisible] = useState(false);
  const [monthlyBurn, setMonthlyBurn] = useState(80_000);
  const [delay, setDelay] = useState<(typeof DELAY_MONTHS)[number]["id"]>(2);
  const [teamSize, setTeamSize] = useState(12);
  const [revenueAtRisk, setRevenueAtRisk] = useState(40_000);

  const months = DELAY_MONTHS.find((d) => d.id === delay)!.months;

  const results = useMemo(() => {
    const burnCost = monthlyBurn * months * 0.15;
    const revenueCost = revenueAtRisk * months * 0.35;
    const teamFlottement = teamSize * 8 * months * 85;
    const total = burnCost + revenueCost + teamFlottement;
    return { burnCost, revenueCost, teamFlottement, total };
  }, [monthlyBurn, months, teamSize, revenueAtRisk]);

  const sessionOutputs = useMemo(() => ({ total: results.total, months }), [results.total, months]);

  useToolSessionPersistence(
    "cost-of-delayed-decision-calculator",
    resultsVisible,
    { monthlyBurn, delay, teamSize, revenueAtRisk },
    sessionOutputs,
  );

  const steps: ToolWizardStep[] = [
    {
      id: "burn",
      kicker: "Étape 1",
      title: "Burn ou coût mensuel lié au statu quo",
      description: formatEuro(monthlyBurn) + " / mois",
      content: (
        <Slider
          min={10_000}
          max={300_000}
          step={5_000}
          value={[monthlyBurn]}
          onValueChange={([v]) => setMonthlyBurn(v ?? monthlyBurn)}
          className={toolsSlider}
        />
      ),
    },
    {
      id: "delay",
      kicker: "Étape 2",
      title: "Depuis combien de temps la décision glisse ?",
      content: (
        <ToolChipStack>
          {DELAY_MONTHS.map((d) => (
            <ToolChip key={d.id} fullWidth active={delay === d.id} onClick={() => setDelay(d.id)}>
              {d.label}
            </ToolChip>
          ))}
        </ToolChipStack>
      ),
    },
    {
      id: "team",
      kicker: "Étape 3",
      title: "Taille de l'équipe en attente ou en flottement",
      description: `${teamSize} personnes`,
      content: (
        <Slider
          min={0}
          max={80}
          step={1}
          value={[teamSize]}
          onValueChange={([v]) => setTeamSize(v ?? teamSize)}
          className={toolsSlider}
        />
      ),
    },
    {
      id: "revenue",
      kicker: "Étape 4",
      title: "Revenus ou deals mensuels en jeu",
      description: formatEuro(revenueAtRisk) + " / mois",
      content: (
        <Slider
          min={0}
          max={500_000}
          step={5_000}
          value={[revenueAtRisk]}
          onValueChange={([v]) => setRevenueAtRisk(v ?? revenueAtRisk)}
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
          <h2>Cost of inaction formula</h2>
          <p>
            Modèle simplifié : friction trésorerie, revenus en suspens et heures d&apos;équipe perdues sur la
            période de report.
          </p>
        </>
      }
    >
      <ToolStepWizard
        steps={steps}
        onResultsVisible={() => setResultsVisible(true)}
        resultStep={{
          title: "Coût estimé de l'inaction",
          content: (
            <>
              <ToolResultGrid>
                <ToolResultStat label="Coût total estimé" value={formatEuro(results.total)} accent="copper" />
                <ToolResultStat label="Friction trésorerie" value={formatEuro(results.burnCost)} />
                <ToolResultStat label="Opportunités manquées" value={formatEuro(results.revenueCost)} accent="gold" />
                <ToolResultStat label="Flottement d'équipe" value={formatEuro(results.teamFlottement)} />
              </ToolResultGrid>
              <ToolDiagnostic variant="warning">
                Sur {months} mois, le report coûte souvent plus qu&apos;une décision imparfaite mais explicite.
              </ToolDiagnostic>
              <ToolCrossInsights />
              <ToolNextStep toolId="cost-of-delayed-decision-calculator" outputs={sessionOutputs} />
              <AegisConversionCard
                problemKind="delay"
                className="mt-8"
                ctaLabel="Lancer l'audit d'onboarding (33 questions)"
                ctaHref="/onboarding"
              />
            </>
          ),
        }}
      />
    </ToolLayout>
  );
}
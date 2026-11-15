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

const SENIORITY = [
  { id: "vp", label: "VP / Directeur", rateHint: 1 },
  { id: "clevel", label: "C-Level", rateHint: 1.15 },
  { id: "ceo", label: "CEO / Fondateur", rateHint: 1.3 },
] as const;

const FREQUENCY = [
  { id: 1, label: "1 séance / mois" },
  { id: 2, label: "2 séances / mois" },
  { id: 4, label: "4 séances / mois" },
] as const;

const SESSION_HOURS = 1.5;

export default function ExecutiveCoachingCostCalculatorPage() {
  const tool = getToolById("executive-coaching-cost-calculator");
  const [resultsVisible, setResultsVisible] = useState(false);
  const [seniority, setSeniority] = useState<(typeof SENIORITY)[number]["id"]>("clevel");
  const [frequency, setFrequency] = useState<number>(2);
  const [hourlyRate, setHourlyRate] = useState(850);

  const seniorityRow = SENIORITY.find((s) => s.id === seniority)!;

  const results = useMemo(() => {
    const sessionsPerYear = frequency * 12;
    const coachingHours = sessionsPerYear * SESSION_HOURS;
    const annualCost = coachingHours * hourlyRate * seniorityRow.rateHint;
    const costPerCoachingHour = annualCost / coachingHours;
    const impliedDecisionHours = 120;
    const costPerArbitrationHour = annualCost / impliedDecisionHours;
    return { annualCost, costPerCoachingHour, costPerArbitrationHour, coachingHours };
  }, [frequency, hourlyRate, seniorityRow.rateHint]);

  const amnesiaAlert = frequency <= 1;

  const steps: ToolWizardStep[] = [
    {
      id: "seniority",
      kicker: "Étape 1",
      title: "Quel est votre niveau de séniorité ?",
      description: "Le marché du coaching exécutif indexe souvent les tarifs sur votre responsabilité.",
      content: (
        <ToolChipStack>
          {SENIORITY.map((s) => (
            <ToolChip key={s.id} fullWidth active={seniority === s.id} onClick={() => setSeniority(s.id)}>
              {s.label}
            </ToolChip>
          ))}
        </ToolChipStack>
      ),
    },
    {
      id: "frequency",
      kicker: "Étape 2",
      title: "À quelle fréquence voyez-vous votre coach ?",
      description: "La cadence détermine autant le budget que la continuité du contexte entre les séances.",
      content: (
        <ToolChipStack>
          {FREQUENCY.map((f) => (
            <ToolChip key={f.id} fullWidth active={frequency === f.id} onClick={() => setFrequency(f.id)}>
              {f.label}
            </ToolChip>
          ))}
        </ToolChipStack>
      ),
    },
    {
      id: "rate",
      kicker: "Étape 3",
      title: "Quel tarif horaire estimez-vous ?",
      description: `Aujourd'hui : ${formatEuro(hourlyRate)} / h`,
      content: (
        <div className="space-y-6">
          <Slider
            min={300}
            max={2000}
            step={50}
            value={[hourlyRate]}
            onValueChange={([v]) => setHourlyRate(v ?? hourlyRate)}
            className={toolsSlider}
          />
          <div className="flex justify-between font-display text-xs text-[color:var(--aegis-ink-subtle)]">
            <span>300 €</span>
            <span className="text-[color:var(--aegis-gold)]">{formatEuro(hourlyRate)}</span>
            <span>2 000 €</span>
          </div>
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
          <h2>Pourquoi calculer le coût réel d&apos;un coaching exécutif ?</h2>
          <p>
            Les dirigeants comparent souvent le tarif horaire affiché (500 € à 1 500 €) sans projeter la
            cadence sur douze mois. Ce calculateur intègre séniorité, fréquence et durée de séance pour
            estimer un run-rate annuel comparable à d&apos;autres investissements de gouvernance.
          </p>
        </>
      }
    >
      <ToolStepWizard
        steps={steps}
        onResultsVisible={() => setResultsVisible(true)}
        resultStep={{
          kicker: "Votre run-rate",
          title: "Coût réel du coaching sur 12 mois",
          description: "Projection à partir de vos réponses — modifiable en revenant en arrière.",
          content: (
            <>
              <ToolResultGrid>
                <ToolResultStat label="Coût annuel total" value={formatEuro(results.annualCost)} />
                <ToolResultStat
                  label="Coût par heure d'arbitrage (120 h/an)"
                  value={formatEuro(results.costPerArbitrationHour)}
                />
                <ToolResultStat label="Heures de coaching / an" value={`${results.coachingHours} h`} accent="gold" />
                <ToolResultStat
                  label="Coût par heure de séance"
                  value={formatEuro(results.costPerCoachingHour)}
                  accent="gold"
                />
              </ToolResultGrid>
              {amnesiaAlert ? (
                <ToolDiagnostic variant="warning">
                  <strong>Amnésie contextuelle :</strong> à une séance par mois, le contexte critique s&apos;efface
                  entre deux rendez-vous. Les arbitrages urgents n&apos;attendent pas le prochain créneau coach.
                </ToolDiagnostic>
              ) : (
                <ToolDiagnostic variant="info">
                  Entre les sessions, le contexte vit ailleurs. Comparez ce run-rate à un exocortex qui conserve
                  les arbitrages.
                </ToolDiagnostic>
              )}
              <AegisConversionCard problemKind="cost" className="mt-8" />
            </>
          ),
        }}
      />
    </ToolLayout>
  );
}
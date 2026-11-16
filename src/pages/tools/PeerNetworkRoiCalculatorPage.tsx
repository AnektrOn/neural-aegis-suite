import { useEffect, useMemo, useState } from "react";
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

const NETWORKS = [
  { id: "vistage", label: "Vistage", dues: 22000, hours: 150 },
  { id: "ypo", label: "YPO", dues: 35000, hours: 180 },
  { id: "eo", label: "EO", dues: 18000, hours: 120 },
  { id: "local", label: "Club local", dues: 12000, hours: 80 },
] as const;

export default function PeerNetworkRoiCalculatorPage() {
  const tool = getToolById("peer-network-roi-calculator");
  const [resultsVisible, setResultsVisible] = useState(false);
  const [network, setNetwork] = useState<(typeof NETWORKS)[number]["id"]>("vistage");
  const [annualDues, setAnnualDues] = useState(22000);
  const [hourlyRate, setHourlyRate] = useState(350);
  const [hoursPerYear, setHoursPerYear] = useState(150);

  const preset = NETWORKS.find((n) => n.id === network)!;

  useEffect(() => {
    setAnnualDues(preset.dues);
    setHoursPerYear(preset.hours);
  }, [preset.dues, preset.hours]);

  const results = useMemo(() => {
    const opportunityCost = hoursPerYear * hourlyRate;
    const totalRealCost = annualDues + opportunityCost;
    const costPerMeetingHour = totalRealCost / Math.max(hoursPerYear, 1);
    return { opportunityCost, totalRealCost, costPerMeetingHour };
  }, [annualDues, hourlyRate, hoursPerYear]);

  const steps: ToolWizardStep[] = [
    {
      id: "network",
      kicker: "Étape 1",
      title: "Quel réseau de pairs rejoignez-vous ?",
      description: "Les cotisations et engagements temps varient fortement d'un cercle à l'autre.",
      content: (
        <ToolChipStack>
          {NETWORKS.map((n) => (
            <ToolChip key={n.id} fullWidth active={network === n.id} onClick={() => setNetwork(n.id)}>
              {n.label}
            </ToolChip>
          ))}
        </ToolChipStack>
      ),
    },
    {
      id: "dues",
      kicker: "Étape 2",
      title: "Cotisation annuelle",
      description: `Montant retenu : ${formatEuro(annualDues)}`,
      content: (
        <div className="space-y-6">
          <Slider
            min={10_000}
            max={40_000}
            step={500}
            value={[annualDues]}
            onValueChange={([v]) => setAnnualDues(v ?? annualDues)}
            className={toolsSlider}
          />
          <div className="flex justify-between font-mono text-xs text-[color:var(--aegis-text-secondary)]">
            <span>10 k€</span>
            <span className="text-primary">{formatEuro(annualDues)}</span>
            <span>40 k€</span>
          </div>
        </div>
      ),
    },
    {
      id: "hourly",
      kicker: "Étape 3",
      title: "Valeur horaire de votre temps",
      description: `Référence : ${formatEuro(hourlyRate)} / h`,
      content: (
        <div className="space-y-6">
          <Slider
            min={150}
            max={800}
            step={10}
            value={[hourlyRate]}
            onValueChange={([v]) => setHourlyRate(v ?? hourlyRate)}
            className={toolsSlider}
          />
        </div>
      ),
    },
    {
      id: "hours",
      kicker: "Étape 4",
      title: "Heures passées par an",
      description: "Réunions, préparation, déplacements et événements obligatoires.",
      content: (
        <div className="space-y-6">
          <p className="text-center font-cormorant-display text-3xl tabular-nums text-[color:var(--aegis-bronze-ink)]">
            {hoursPerYear} h
          </p>
          <Slider
            min={40}
            max={250}
            step={5}
            value={[hoursPerYear]}
            onValueChange={([v]) => setHoursPerYear(v ?? hoursPerYear)}
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
          <h2>Vistage, YPO, EO : le prix complet du réseau de pairs</h2>
          <p>
            La cotisation affichée ne reflète qu&apos;une partie du coût. Ce calculateur additionne cotisation
            + temps × valeur horaire.
          </p>
        </>
      }
    >
      <ToolStepWizard
        steps={steps}
        onResultsVisible={() => setResultsVisible(true)}
        resultStep={{
          title: "Coût réel de votre cercle",
          description: "Coût financier + coût d'opportunité du dirigeant.",
          content: (
            <>
              <ToolResultGrid>
                <ToolResultStat label="Coût financier direct" value={formatEuro(annualDues)} />
                <ToolResultStat
                  label="Coût d'opportunité temps"
                  value={formatEuro(results.opportunityCost)}
                  accent="copper"
                />
                <ToolResultStat label="Coût réel complet" value={formatEuro(results.totalRealCost)} />
                <ToolResultStat
                  label="Coût par heure engagée"
                  value={formatEuro(results.costPerMeetingHour)}
                  accent="gold"
                />
              </ToolResultGrid>
              <ToolDiagnostic variant={results.totalRealCost > 60_000 ? "warning" : "info"}>
                {results.totalRealCost > 60_000
                  ? "Souvent plus de 60 000 €/an : les réunions ponctuelles ne remplacent pas une aide à la décision 24/7."
                  : "Le calendrier du réseau structure vos arbitrages — pas votre contexte quotidien."}
              </ToolDiagnostic>
              <AegisConversionCard problemKind="network" className="mt-8" />
            </>
          ),
        }}
      />
    </ToolLayout>
  );
}
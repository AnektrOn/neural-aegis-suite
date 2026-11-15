import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { AegisConversionCard } from "@/components/tools/AegisConversionCard";
import { ToolStepWizard, type ToolWizardStep } from "@/components/tools/ToolStepWizard";
import { getToolById } from "@/components/tools/toolsRegistry";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolDiagnostic, ToolResultGrid, ToolResultStat, formatEuro } from "@/components/tools/ToolField";
import { ToolGauge } from "@/components/tools/ToolGauge";
import { toolsBentoElevated } from "@/components/tools/toolsDesign";

const STACK_ITEMS = [
  { id: "notion", label: "Notion", defaultPrice: 12, step: 1 },
  { id: "granola", label: "Granola", defaultPrice: 18, step: 1 },
  { id: "otter", label: "Otter", defaultPrice: 17, step: 1 },
  { id: "chatgpt", label: "ChatGPT Plus", defaultPrice: 22, step: 2 },
  { id: "claude", label: "Claude Pro", defaultPrice: 22, step: 2 },
  { id: "superhuman", label: "Superhuman", defaultPrice: 33, step: 2 },
  { id: "coach", label: "Coach externe (part mensuelle)", defaultPrice: 800, step: 3 },
] as const;

type ItemId = (typeof STACK_ITEMS)[number]["id"];

export default function ExecutiveSaasRunrateCalculatorPage() {
  const tool = getToolById("executive-saas-runrate-calculator");
  const [resultsVisible, setResultsVisible] = useState(false);

  const [enabled, setEnabled] = useState<Record<ItemId, boolean>>({
    notion: true,
    granola: false,
    otter: true,
    chatgpt: true,
    claude: false,
    superhuman: false,
    coach: false,
  });

  const [prices, setPrices] = useState<Record<ItemId, number>>(() =>
    Object.fromEntries(STACK_ITEMS.map((i) => [i.id, i.defaultPrice])) as Record<ItemId, number>,
  );

  const { monthly, annual, dispersionIndex, activeCount } = useMemo(() => {
    let monthlyTotal = 0;
    let active = 0;
    for (const item of STACK_ITEMS) {
      if (enabled[item.id]) {
        monthlyTotal += prices[item.id];
        active += 1;
      }
    }
    const dispersion = Math.min(95, active * 12 + (active > 4 ? 15 : 0));
    return {
      monthly: monthlyTotal,
      annual: monthlyTotal * 12,
      dispersionIndex: dispersion,
      activeCount: active,
    };
  }, [enabled, prices]);

  const renderStackStep = (step: 1 | 2 | 3) => {
    const items = STACK_ITEMS.filter((i) => i.step === step);
    return (
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${toolsBentoElevated}`}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                id={`stack-${item.id}`}
                checked={enabled[item.id]}
                onCheckedChange={(c) => setEnabled((prev) => ({ ...prev, [item.id]: c === true }))}
              />
              <Label htmlFor={`stack-${item.id}`} className="cursor-pointer font-body text-sm text-[color:var(--aegis-ink)]">
                {item.label}
              </Label>
            </div>
            <Input
              type="number"
              min={0}
              step={1}
              disabled={!enabled[item.id]}
              value={prices[item.id]}
              onChange={(e) =>
                setPrices((prev) => ({
                  ...prev,
                  [item.id]: Number(e.target.value) || 0,
                }))
              }
              className="w-full rounded-xl border-[color:var(--aegis-cardline)] bg-[color:var(--aegis-surface)] font-display text-right text-[color:var(--aegis-ink)] sm:w-28"
              aria-label={`Prix mensuel ${item.label}`}
            />
          </li>
        ))}
      </ul>
    );
  };

  const steps: ToolWizardStep[] = [
    {
      id: "capture",
      kicker: "Étape 1 / 3",
      title: "Notes & capture",
      description: "Outils de documentation et transcription.",
      content: renderStackStep(1),
    },
    {
      id: "ai",
      kicker: "Étape 2 / 3",
      title: "IA & messagerie premium",
      content: renderStackStep(2),
    },
    {
      id: "coach",
      kicker: "Étape 3 / 3",
      title: "Coaching externalisé",
      description: "Part mensuelle lissée sur l'année.",
      content: renderStackStep(3),
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      wizardResultsVisible={resultsVisible}
      seoContent={
        <>
          <h2>Founder productivity stack : le coût de la fragmentation</h2>
          <p>Additionnez vos abonnements et visualisez la dispersion du contexte décisionnel.</p>
        </>
      }
    >
      <ToolStepWizard
        steps={steps}
        onResultsVisible={() => setResultsVisible(true)}
        resultStep={{
          title: "Run-rate de votre stack",
          content: (
            <>
              <motionWrap className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <ToolGauge value={dispersionIndex} label="Indice de dispersion" tone="gold" />
                <p className="max-w-xs text-center font-body text-sm text-[color:var(--aegis-ink-muted)] sm:text-left">
                  {activeCount} outils actifs — silos de contexte et recherches redondantes.
                </p>
              </motionWrap>
              <ToolResultGrid>
                <ToolResultStat label="Facture mensuelle" value={formatEuro(monthly)} />
                <ToolResultStat label="Facture annuelle" value={formatEuro(annual)} accent="gold" />
              </ToolResultGrid>
              <ToolDiagnostic variant="info">
                Unifier sous un exocortex souverain relie décisions, synthèses et toolbox au lieu de multiplier
                les abonnements.
              </ToolDiagnostic>
              <AegisConversionCard problemKind="dispersion" className="mt-8" />
            </>
          ),
        }}
      />
    </ToolLayout>
  );
}

function motionWrap({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
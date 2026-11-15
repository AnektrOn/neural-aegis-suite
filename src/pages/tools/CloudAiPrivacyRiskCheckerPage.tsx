import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { AegisConversionCard } from "@/components/tools/AegisConversionCard";
import { ToolStepWizard, type ToolWizardStep } from "@/components/tools/ToolStepWizard";
import { getToolById } from "@/components/tools/toolsRegistry";
import { ToolGauge } from "@/components/tools/ToolGauge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToolDiagnostic, ToolResultGrid, ToolResultStat } from "@/components/tools/ToolField";

const TOOLS = [
  { id: "chatgpt", label: "ChatGPT Team / Plus", weight: 18 },
  { id: "recorder", label: "Enregistreurs de réunion cloud", weight: 22 },
  { id: "transcript", label: "Transcription automatique", weight: 14 },
  { id: "online", label: "Notes d'arbitrage en ligne", weight: 12 },
] as const;

const SENSITIVITY = [
  { id: "finance", label: "Données financières", weight: 20 },
  { id: "litigation", label: "Litiges d'associés", weight: 28 },
  { id: "hr", label: "RH / salaires", weight: 22 },
  { id: "patents", label: "Brevets / IP", weight: 24 },
] as const;

type Level = "Faible" | "Modéré" | "Critique";

export default function CloudAiPrivacyRiskCheckerPage() {
  const tool = getToolById("cloud-ai-privacy-risk-checker");
  const [resultsVisible, setResultsVisible] = useState(false);
  const [usedTools, setUsedTools] = useState<Record<string, boolean>>({
    chatgpt: true,
    recorder: false,
    transcript: true,
    online: true,
  });
  const [sensitivity, setSensitivity] = useState<Record<string, boolean>>({
    finance: true,
    litigation: false,
    hr: true,
    patents: false,
  });

  const { score, level } = useMemo(() => {
    const toolScore = TOOLS.reduce((acc, t) => acc + (usedTools[t.id] ? t.weight : 0), 0);
    const sensScore = SENSITIVITY.reduce((acc, s) => acc + (sensitivity[s.id] ? s.weight : 0), 0);
    const raw = Math.min(100, toolScore + sensScore);
    let lvl: Level = "Faible";
    if (raw >= 65) lvl = "Critique";
    else if (raw >= 35) lvl = "Modéré";
    return { score: raw, level: lvl };
  }, [usedTools, sensitivity]);

  const tone = level === "Critique" ? "danger" : level === "Modéré" ? "copper" : "gold";

  const checkboxList = (
    items: readonly { id: string; label: string }[],
    state: Record<string, boolean>,
    setState: Dispatch<SetStateAction<Record<string, boolean>>>,
  ) => (
    <ul className="space-y-4">
      {items.map((t) => (
        <li
          key={t.id}
          className="flex min-h-[52px] items-center gap-4 rounded-xl border border-border/50 bg-muted/40 px-4"
        >
          <Checkbox
            id={t.id}
            checked={state[t.id]}
            onCheckedChange={(c) => setState((prev) => ({ ...prev, [t.id]: c === true }))}
          />
          <Label htmlFor={t.id} className="flex-1 cursor-pointer text-sm text-foreground">
            {t.label}
          </Label>
        </li>
      ))}
    </ul>
  );

  const steps: ToolWizardStep[] = [
    {
      id: "tools",
      kicker: "Étape 1",
      title: "Quels outils cloud utilisez-vous ?",
      description: "Cochez tout ce qui traite vos données professionnelles.",
      content: checkboxList(TOOLS, usedTools, setUsedTools),
    },
    {
      id: "sensitivity",
      kicker: "Étape 2",
      title: "Quelles données y transitent ?",
      description: "Sensibilité ComEx et secrets d'affaires.",
      content: checkboxList(SENSITIVITY, sensitivity, setSensitivity),
    },
  ];

  return (
    <ToolLayout
      tool={tool}
      wizardResultsVisible={resultsVisible}
      seoContent={
        <>
          <h2>Cloud AI governance risk pour le ComEx</h2>
          <p>
            Estimez l&apos;exposition lorsque des LLM grand public ingèrent des données stratégiques sans vault
            dédié.
          </p>
        </>
      }
    >
      <ToolStepWizard
        steps={steps}
        onResultsVisible={() => setResultsVisible(true)}
        resultStep={{
          title: "Score d'exposition gouvernance",
          content: (
            <>
              <div className="mb-8 flex justify-center">
                <ToolGauge value={score} label="Score d'exposition" tone={tone} suffix="/100" />
              </div>
              <ToolResultGrid>
                <ToolResultStat label="Niveau de risque" value={level} accent={level === "Critique" ? "copper" : "gold"} />
                <ToolResultStat
                  label="Recommandation"
                  value={level === "Critique" ? "Vault + serveur privé" : "Durcir la gouvernance"}
                />
              </ToolResultGrid>
              <ToolDiagnostic variant={level === "Critique" ? "warning" : "info"}>
                {level === "Critique"
                  ? "Séparez secrets d'affaires et IA cloud avant d'étendre l'usage aux arbitrages ComEx."
                  : "Chaque nouvel outil cloud augmente la surface de fuite — auditez contrats et rétention."}
              </ToolDiagnostic>
              <AegisConversionCard problemKind="security" className="mt-8" />
            </>
          ),
        }}
      />
    </ToolLayout>
  );
}
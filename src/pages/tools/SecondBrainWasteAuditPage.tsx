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

export default function SecondBrainWasteAuditPage() {
  const tool = getToolById("second-brain-waste-audit");
  const [resultsVisible, setResultsVisible] = useState(false);
  const [notesPerMonth, setNotesPerMonth] = useState(40);
  const [reusePct, setReusePct] = useState(25);
  const [maintenanceHours, setMaintenanceHours] = useState(4);
  const [fastRetrieval, setFastRetrieval] = useState<"yes" | "sometimes" | "no">("no");

  const results = useMemo(() => {
    const wastePct = Math.min(
      99,
      Math.max(5, 100 - reusePct - (fastRetrieval === "yes" ? 15 : fastRetrieval === "sometimes" ? 5 : 0)),
    );
    const deadNotesPerMonth = (notesPerMonth * wastePct) / 100;
    const hoursLostYear = maintenanceHours * 12 + deadNotesPerMonth * 0.25 * 12;
    const cognitiveIndex = Math.round(wastePct);
    return { wastePct, hoursLostYear, cognitiveIndex };
  }, [notesPerMonth, reusePct, maintenanceHours, fastRetrieval]);

  const retrievalOptions = [
    { id: "yes" as const, label: "Oui, en moins de 30 secondes" },
    { id: "sometimes" as const, label: "Parfois, avec recherche" },
    { id: "no" as const, label: "Non, c'est un cimetière de notes" },
  ];

  const steps: ToolWizardStep[] = [
    {
      id: "volume",
      kicker: "Question 1 / 4",
      title: "Combien de notes créez-vous par mois ?",
      content: (
        <div className="space-y-6">
          <p className="text-center font-display text-3xl text-[color:var(--aegis-gold)]">{notesPerMonth}</p>
          <Slider
            min={5}
            max={200}
            step={5}
            value={[notesPerMonth]}
            onValueChange={([v]) => setNotesPerMonth(v ?? notesPerMonth)}
            className={toolsSlider}
          />
        </div>
      ),
    },
    {
      id: "reuse",
      kicker: "Question 2 / 4",
      title: "Quel pourcentage est relu ou exploité ?",
      content: (
        <div className="space-y-6">
          <p className="text-center font-display text-3xl text-[color:var(--aegis-gold)]">{reusePct} %</p>
          <Slider
            min={0}
            max={80}
            step={5}
            value={[reusePct]}
            onValueChange={([v]) => setReusePct(v ?? reusePct)}
            className={toolsSlider}
          />
        </div>
      ),
    },
    {
      id: "maintenance",
      kicker: "Question 3 / 4",
      title: "Heures passées à classer et taguer",
      description: "Par mois, en moyenne.",
      content: (
        <div className="space-y-6">
          <p className="text-center font-display text-3xl text-[color:var(--aegis-gold)]">{maintenanceHours} h</p>
          <Slider
            min={0}
            max={20}
            step={0.5}
            value={[maintenanceHours]}
            onValueChange={([v]) => setMaintenanceHours(v ?? maintenanceHours)}
            className={toolsSlider}
          />
        </div>
      ),
    },
    {
      id: "retrieval",
      kicker: "Question 4 / 4",
      title: "Retrouvez-vous un arbitrage critique en moins de 30 s ?",
      content: (
        <ToolChipStack>
          {retrievalOptions.map((opt) => (
            <ToolChip
              key={opt.id}
              fullWidth
              active={fastRetrieval === opt.id}
              onClick={() => setFastRetrieval(opt.id)}
            >
              {opt.label}
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
          <h2>Notion second brain review : mesurer les notes mortes</h2>
          <p>
            Un PKM efficace n&apos;est pas un volume de pages mais un taux de réutilisation. Quatre questions
            pour estimer votre déchet cognitif.
          </p>
        </>
      }
    >
      <ToolStepWizard
        steps={steps}
        onResultsVisible={() => setResultsVisible(true)}
        resultStep={{
          title: "Indice de déchet cognitif",
          content: (
            <>
              <MotionWrap className="mb-8 flex justify-center">
                <ToolGauge
                  value={results.cognitiveIndex}
                  label="Indice de déchet cognitif"
                  tone={results.cognitiveIndex > 60 ? "danger" : "gold"}
                />
              </MotionWrap>
              <ToolResultGrid>
                <ToolResultStat
                  label="Notes « mortes » estimées"
                  value={`${Math.round(results.wastePct)} %`}
                  accent="copper"
                />
                <ToolResultStat label="Heures perdues / an" value={`${Math.round(results.hoursLostYear)} h`} />
              </ToolResultGrid>
              <ToolDiagnostic variant="warning">
                La prise de notes passive stocke sans décider. Un exocortex actif relie capture, arbitrage et
                synthèse.
              </ToolDiagnostic>
              <AegisConversionCard problemKind="waste" className="mt-8" />
            </>
          ),
        }}
      />
    </ToolLayout>
  );
}

function MotionWrap({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
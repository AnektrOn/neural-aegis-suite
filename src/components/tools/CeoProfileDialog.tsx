import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NeuralCard } from "@/components/ui/neural-card";
import { Slider } from "@/components/ui/slider";
import {
  CEO_ARCHETYPE_LABELS,
  CEO_STAGE_LABELS,
  type CeoArchetype,
  type CeoProfile,
  type CeoStage,
  saveCeoProfile,
} from "@/lib/tools/ceoProfile";
import { ToolChip, ToolChipStack } from "@/components/tools/ToolField";
import { toolsKicker, toolsSlider, toolsTitle, toolsPrimaryButton } from "./toolsDesign";

const ARCHETYPES = Object.entries(CEO_ARCHETYPE_LABELS) as [CeoArchetype, string][];
const STAGES = Object.entries(CEO_STAGE_LABELS) as [CeoStage, string][];

interface CeoProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (profile: CeoProfile) => void;
  initial?: CeoProfile | null;
  dismissible?: boolean;
}

export function CeoProfileDialog({
  open,
  onOpenChange,
  onSaved,
  initial,
  dismissible = true,
}: CeoProfileDialogProps) {
  const [archetype, setArchetype] = useState<CeoArchetype>(initial?.archetype ?? "first-time-founder");
  const [stage, setStage] = useState<CeoStage>(initial?.stage ?? "early-traction");
  const [teamSize, setTeamSize] = useState(initial?.teamSize ?? 12);
  const [decisionsPerWeek, setDecisionsPerWeek] = useState(initial?.decisionsPerWeek ?? 25);
  const [sleepHours, setSleepHours] = useState(initial?.sleepHours ?? 7);

  const handleSave = () => {
    const profile = saveCeoProfile({
      archetype,
      stage,
      teamSize,
      decisionsPerWeek,
      sleepHours,
    });
    onSaved?.(profile);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={dismissible ? onOpenChange : undefined}>
      <DialogContent
        showCloseButton={dismissible}
        className="max-h-[90dvh] overflow-y-auto border-border/40 bg-card/95 p-0 sm:max-w-lg"
      >
        <NeuralCard variant="elevated" glow="warm" className="glass-card border-0 p-6">
          <DialogHeader>
            <p className={toolsKicker}>Profil décisionnel</p>
            <DialogTitle className={`${toolsTitle} text-left text-2xl`}>Calibrer vos outils</DialogTitle>
            <DialogDescription className="text-left text-muted-foreground">
              Deux minutes pour adapter seuils, benchmarks et diagnostics à votre réalité de dirigeant.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-8">
            <section>
              <h3 className="text-sm font-semibold text-foreground">Archétype de décideur</h3>
              <ToolChipStack>
                {ARCHETYPES.map(([id, label]) => (
                  <ToolChip key={id} fullWidth active={archetype === id} onClick={() => setArchetype(id)}>
                    {label}
                  </ToolChip>
                ))}
              </ToolChipStack>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-foreground">Stade de l&apos;entreprise</h3>
              <ToolChipStack>
                {STAGES.map(([id, label]) => (
                  <ToolChip key={id} fullWidth active={stage === id} onClick={() => setStage(id)}>
                    {label}
                  </ToolChip>
                ))}
              </ToolChipStack>
            </section>

            <section className="space-y-4">
              <p className="text-sm font-semibold text-foreground">Taille d&apos;équipe : {teamSize}</p>
              <Slider
                min={1}
                max={250}
                step={1}
                value={[teamSize]}
                onValueChange={([v]) => setTeamSize(v ?? teamSize)}
                className={toolsSlider}
              />
            </section>

            <section className="space-y-4">
              <p className="text-sm font-semibold text-foreground">
                Arbitrages structurants / semaine : {decisionsPerWeek}
              </p>
              <Slider
                min={5}
                max={80}
                step={1}
                value={[decisionsPerWeek]}
                onValueChange={([v]) => setDecisionsPerWeek(v ?? decisionsPerWeek)}
                className={toolsSlider}
              />
            </section>

            <section className="space-y-4">
              <p className="text-sm font-semibold text-foreground">Sommeil moyen (h/nuit) : {sleepHours}</p>
              <Slider
                min={4}
                max={9}
                step={0.5}
                value={[sleepHours]}
                onValueChange={([v]) => setSleepHours(v ?? sleepHours)}
                className={toolsSlider}
              />
            </section>

            <button type="button" onClick={handleSave} className={`${toolsPrimaryButton} w-full`}>
              Enregistrer le profil
            </button>
          </div>
        </NeuralCard>
      </DialogContent>
    </Dialog>
  );
}
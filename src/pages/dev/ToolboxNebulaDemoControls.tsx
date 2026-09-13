import { Button } from "@/components/ui/button";
import {
  QUANTUM_NEBULA_STATES,
  QUANTUM_NEBULA_STATE_LABELS,
  type QuantumNebulaFigure,
  type QuantumNebulaState,
} from "@/components/ui/quantum-nebula";
import { useToolboxNebulaAmbientOptional } from "@/features/toolbox/nebula/ToolboxNebulaAmbientContext";

const FIGURE_OPTIONS: QuantumNebulaFigure[] = ["metatron", "sriYantra", "dna"];

/** Dev-only controls to drive nebula state on /dev/toolbox-nebula (inside ambient provider). */
export function ToolboxNebulaDemoControls() {
  const ambient = useToolboxNebulaAmbientOptional();
  if (!ambient?.enabled) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 bg-background/50 px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">État</span>
      {QUANTUM_NEBULA_STATES.map((state) => (
        <Button
          key={state}
          type="button"
          size="sm"
          variant={ambient.state === state ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={() => ambient.setState(state)}
        >
          {QUANTUM_NEBULA_STATE_LABELS[state].fr}
        </Button>
      ))}
      <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">Figure</span>
      <Button
        type="button"
        size="sm"
        variant={ambient.figure == null ? "default" : "outline"}
        className="h-7 text-xs"
        onClick={() => ambient.setFigure(undefined)}
      >
        Aucune
      </Button>
      {FIGURE_OPTIONS.map((figure) => (
        <Button
          key={figure}
          type="button"
          size="sm"
          variant={ambient.figure === figure ? "default" : "outline"}
          className="h-7 text-xs capitalize"
          onClick={() => ambient.setFigure(figure)}
        >
          {figure}
        </Button>
      ))}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="ml-auto h-7 text-xs"
        onClick={() => {
          ambient.setState(ambient.preset.state);
          ambient.setFigure(ambient.preset.figure);
        }}
      >
        Reset preset
      </Button>
    </div>
  );
}

import { HelpCircle, Maximize2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DienChanStageToolbarProps = {
  showDiagram: boolean;
  onToggleDiagram: () => void;
  onResetView: () => void;
  className?: string;
};

export function DienChanStageToolbar({
  showDiagram,
  onToggleDiagram,
  onResetView,
  className,
}: DienChanStageToolbarProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 rounded-lg border border-white/10 bg-black/70 p-1.5 shadow-lg backdrop-blur-sm",
        className,
      )}
      role="toolbar"
      aria-label="Contrôles de la carte faciale 3D"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-white/85 hover:bg-white/10 hover:text-white focus-visible:ring-primary/40"
        onClick={onResetView}
        aria-label="Centrer la vue"
        title="Centrer la vue"
      >
        <Maximize2 className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 text-white/85 hover:bg-white/10 hover:text-white focus-visible:ring-primary/40",
          showDiagram && "bg-white/15 text-white",
        )}
        onClick={onToggleDiagram}
        aria-label={showDiagram ? "Masquer l’aperçu 2D" : "Afficher l’aperçu 2D"}
        aria-pressed={showDiagram}
        title="Aperçu 2D"
      >
        <Map className="h-4 w-4" aria-hidden />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/85 hover:bg-white/10 hover:text-white focus-visible:ring-primary/40"
            aria-label="Aide gestes"
            title="Aide gestes"
          >
            <HelpCircle className="h-4 w-4" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          className="w-64 border-border/80 bg-popover text-sm"
        >
          <p className="font-display text-base font-medium">Gestes sur le visage</p>
          <ul className="mt-2 space-y-1.5 text-muted-foreground">
            <li>Glisser — faire tourner la tête</li>
            <li>Molette ou pincer — zoomer</li>
            <li>Toucher un point orange — sélectionner l’étape</li>
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}

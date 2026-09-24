import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DienChanZoneId } from "../dienChanFaceZones";
import type { MappingFilterMode, MappingFilterState } from "../dienChanPointMapping";

const MODE_LABELS: Record<MappingFilterMode, string> = {
  all: "Tous les points",
  zone: "Par zone",
  organ: "Par organe / système",
  effect: "Par effet",
  liaison: "Liaisons",
};

function formatZoneLabel(zone: string) {
  return zone.replace(/_/g, " ");
}

type DienChanPointMappingBarProps = {
  filter: MappingFilterState;
  onChange: (next: MappingFilterState) => void;
  zoneOptions: DienChanZoneId[];
  organOptions: string[];
  visibleCount: number;
  totalCount: number;
  className?: string;
};

export function DienChanPointMappingBar({
  filter,
  onChange,
  zoneOptions,
  organOptions,
  visibleCount,
  totalCount,
  className,
}: DienChanPointMappingBarProps) {
  const setMode = (mode: MappingFilterMode) => {
    onChange({
      ...filter,
      mode,
      zoneId: mode === "zone" ? filter.zoneId : null,
      organ: mode === "organ" ? filter.organ : null,
      effectQuery: mode === "effect" ? filter.effectQuery : "",
    });
  };

  return (
    <div className={cn("flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
        <span className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Carte BQC
        </span>
        <Select value={filter.mode} onValueChange={(v) => setMode(v as MappingFilterMode)}>
          <SelectTrigger className="h-9 border-border/60 bg-background/80 focus:ring-primary/40">
            <SelectValue>{MODE_LABELS[filter.mode]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(MODE_LABELS) as MappingFilterMode[]).map((mode) => (
              <SelectItem key={mode} value={mode}>
                {MODE_LABELS[mode]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filter.mode === "zone" && (
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
          <span className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Zone
          </span>
          <Select
            value={filter.zoneId ?? ""}
            onValueChange={(z) =>
              onChange({ ...filter, zoneId: z ? (z as DienChanZoneId) : null })
            }
          >
            <SelectTrigger className="h-9 border-border/60 bg-background/80">
              <SelectValue placeholder="Choisir une zone" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {zoneOptions.map((z) => (
                <SelectItem key={z} value={z} className="capitalize">
                  {formatZoneLabel(z)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filter.mode === "organ" && (
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
          <span className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Organe / système
          </span>
          <Select
            value={filter.organ ?? ""}
            onValueChange={(o) => onChange({ ...filter, organ: o || null })}
          >
            <SelectTrigger className="h-9 border-border/60 bg-background/80">
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {organOptions.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filter.mode === "effect" && (
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-sm">
          <span className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Mot-clé effet
          </span>
          <Input
            className="h-9 border-border/60 bg-background/80"
            placeholder="ex. nerveux, digestif…"
            value={filter.effectQuery}
            onChange={(e) => onChange({ ...filter, effectQuery: e.target.value })}
          />
        </div>
      )}

      {filter.mode === "liaison" && (
        <p className="text-xs text-muted-foreground sm:max-w-[14rem] sm:self-end">
          {filter.liaisonAnchorId != null
            ? `Liens autour du point ${filter.liaisonAnchorId}`
            : "Touchez un point sur le visage pour ancrer les liaisons."}
        </p>
      )}

      <p className="shrink-0 self-end font-mono text-[11px] text-muted-foreground sm:ml-auto">
        {visibleCount}/{totalCount} points
      </p>
    </div>
  );
}

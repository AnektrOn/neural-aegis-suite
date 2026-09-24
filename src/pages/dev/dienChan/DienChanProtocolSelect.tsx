import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DienChanProtocol } from "./DienChanProtocolPanels";

export const DIEN_CHAN_EXPLORE_VALUE = "__explore__";

type DienChanProtocolSelectProps = {
  protocols: DienChanProtocol[];
  value: string;
  onChange: (protocol: DienChanProtocol | null) => void;
  className?: string;
};

export function DienChanProtocolSelect({
  protocols,
  value,
  onChange,
  className,
}: DienChanProtocolSelectProps) {
  const byCategory = protocols.reduce<Record<string, DienChanProtocol[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const selected =
    value === DIEN_CHAN_EXPLORE_VALUE ? null : protocols.find((p) => p.id === value);

  return (
    <Select
      value={value}
      onValueChange={(id) => {
        if (id === DIEN_CHAN_EXPLORE_VALUE) {
          onChange(null);
          return;
        }
        const p = protocols.find((x) => x.id === id);
        if (p) onChange(p);
      }}
    >
      <SelectTrigger
        className={cn(
          "h-10 border-border/60 bg-background/80 font-medium focus:ring-primary/40",
          className,
        )}
        aria-label="Choisir un protocole"
      >
        <SelectValue placeholder="Protocole…">
          {selected?.name ?? "Aucun protocole — carte complète"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[min(24rem,70vh)]">
        <SelectGroup>
          <SelectItem value={DIEN_CHAN_EXPLORE_VALUE} className="py-2.5 font-medium">
            Aucun protocole — carte complète
          </SelectItem>
        </SelectGroup>
        {Object.entries(byCategory).map(([category, items]) => (
          <SelectGroup key={category}>
            <SelectLabel className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {category}
            </SelectLabel>
            {items.map((p) => (
              <SelectItem key={p.id} value={p.id} className="py-2.5">
                {p.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

import { cn } from "@/lib/utils";

export interface ToolboxNebulaOptionPillItem {
  id: string;
  label: string;
}

export function ToolboxNebulaOptionPills({
  options,
  activeId,
  onSelect,
}: {
  options: ToolboxNebulaOptionPillItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {options.map((option) => {
        const active = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] transition-colors",
              active
                ? "border-primary/40 bg-primary/15 text-foreground"
                : "border-border/25 bg-background/40 text-muted-foreground hover:border-primary/25 hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

export function LabSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="aegis-hero-builder__section border-b border-[color:var(--bio-frame-border)] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80 hover:opacity-100"
      >
        {title}
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="space-y-2.5 px-3 pb-3">{children}</div> : null}
    </div>
  );
}

export function LabFieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-[10px] font-medium uppercase tracking-[0.08em] opacity-65">{children}</span>;
}

export function LabSlider({
  label,
  value,
  min,
  max,
  step = 0.5,
  suffix = "%",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const display =
    suffix === "%"
      ? `${value.toFixed(step < 1 ? 1 : 0)}%`
      : suffix === "em"
        ? `${value.toFixed(2)}em`
        : suffix === "rem"
          ? `${value.toFixed(2)}rem`
          : suffix === "px"
            ? `${Math.round(value)}px`
            : suffix === "×"
              ? value.toFixed(2)
              : suffix
                ? `${value}${suffix}`
                : String(Math.round(value));
  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between gap-2">
        <LabFieldLabel>{label}</LabFieldLabel>
        <span className="text-[10px] tabular-nums opacity-70">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[hsl(var(--aegis-warm))]"
      />
    </label>
  );
}

export function LabSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block space-y-1">
      <LabFieldLabel>{label}</LabFieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border border-[color:var(--bio-frame-border)] bg-[color:var(--bio-chip)] px-2 py-1.5 text-[11px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LabToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-[color:var(--bio-frame-border)] px-2.5 py-2 text-[11px]">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[hsl(var(--aegis-warm))]"
      />
    </label>
  );
}

export function LabSegmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1">
      <LabFieldLabel>{label}</LabFieldLabel>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md border px-2 py-1 text-[10px] font-medium transition-colors",
              value === o.value
                ? "aegis-bio-exec-lab__chip-active border-transparent"
                : "border-[color:var(--bio-frame-border)] opacity-75 hover:opacity-100",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

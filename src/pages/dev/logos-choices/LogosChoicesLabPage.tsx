import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LogosChoicesPickerModal,
  type LogosChoiceItem,
} from "@/features/logos/LogosChoicesPickerModal";

const SAMPLE: LogosChoiceItem[] = [
  {
    kind: "toolbox",
    id: "lab-1",
    title: "Isolation Proactive",
    subtitle: "4 min",
  },
  {
    kind: "pulse",
    id: "lab-2",
    title: "Ancrage matinal",
    subtitle: "1–2 min",
  },
  {
    kind: "toolbox",
    id: "lab-3",
    title: "Respiration en carré",
    subtitle: "3 min",
  },
];

/** Dev harness — production uses the same modal via LogosToolHost. */
export default function LogosChoicesLabPage() {
  const [open, setOpen] = useState(true);
  const [last, setLast] = useState<string | null>(null);

  return (
    <div className="min-h-dvh bg-[color:var(--aegis-bg)] text-[color:var(--aegis-ink)]">
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-[color:var(--aegis-ink-muted)]">
          <Link to="/dev">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
            Lab
          </Link>
        </Button>
        <h1 className="font-cormorant text-3xl font-light tracking-tight">LOGOS choices</h1>
        <p className="font-quattrocento text-sm text-[color:var(--aegis-ink-muted)]">
          Même modal que l&apos;app live. Toggle light/dark pour vérifier os+noir vs dark+gold.
        </p>
        {last ? (
          <p className="font-display text-xs uppercase tracking-[0.16em] text-[color:var(--aegis-gold)]">
            Dernier choix · {last}
          </p>
        ) : null}
        <Button type="button" onClick={() => setOpen(true)}>
          Ouvrir le picker
        </Button>
      </div>

      <LogosChoicesPickerModal
        open={open}
        items={SAMPLE}
        busy={false}
        onSelect={(item) => {
          setLast(item.title);
          setOpen(false);
        }}
        onDismiss={() => setOpen(false)}
      />
    </div>
  );
}

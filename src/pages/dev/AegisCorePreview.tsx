import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  AegisCore3D,
  EVOLUTION_LABELS,
  type AegisEvolutionState,
} from "@/components/aegis-core";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REF_BG = "#e5e4e2";

const STATES: AegisEvolutionState[] = ["seed", "emerging", "evolved"];

export default function AegisCorePreview() {
  const [state, setState] = useState<AegisEvolutionState>("seed");
  const [showTriptych, setShowTriptych] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ backgroundColor: state === "seed" && !showTriptych ? "#000000" : REF_BG }}>
      <header className="z-10 shrink-0 border-b border-black/10 bg-[#e5e4e2]/90 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="icon" asChild className="hover:bg-black/5">
            <Link to="/" aria-label="Retour">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-black/45">Dev preview</p>
            <h1 className="text-base font-semibold tracking-tight text-black/80">Evolution Celestial</h1>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {STATES.map((s) => (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={state === s && !showTriptych ? "default" : "outline"}
                className={cn(
                  "border-black/15 text-xs",
                  state === s && !showTriptych && "bg-teal-900 text-white hover:bg-teal-800",
                )}
                onClick={() => {
                  setShowTriptych(false);
                  setState(s);
                }}
              >
                {EVOLUTION_LABELS[s].fr}
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant={showTriptych ? "default" : "outline"}
              className="border-black/15 text-xs"
              onClick={() => setShowTriptych(true)}
            >
              3 états
            </Button>
          </div>
        </div>
      </header>

      <main className="relative min-h-0 flex-1">
        {showTriptych ? (
          <div className="grid h-full grid-rows-3 gap-px bg-black/10">
            {STATES.map((s) => (
              <div key={s} className="relative min-h-0" style={{ backgroundColor: REF_BG }}>
                <p className="pointer-events-none absolute left-3 top-2 z-10 text-[10px] font-medium uppercase tracking-wider text-black/40">
                  {EVOLUTION_LABELS[s].fr}
                </p>
                <AegisCore3D
                  size="100%"
                  backgroundColor={s === "seed" ? "#000000" : REF_BG}
                  evolutionState={s}
                  animate
                  interactive={false}
                  autoRotate={false}
                  maxDpr={2}
                  className="absolute inset-0"
                />
              </div>
            ))}
          </div>
        ) : (
          <AegisCore3D
            size="100%"
            backgroundColor={state === "seed" ? "#000000" : REF_BG}
            evolutionState={state}
            animate
            interactive={state !== "seed"}
            autoRotate={state !== "seed"}
            className="absolute inset-0"
          />
        )}
      </main>
    </div>
  );
}

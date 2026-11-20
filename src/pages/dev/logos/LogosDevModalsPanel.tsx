import { useCallback, useState } from "react";
import { useLogosToolHost } from "@/features/logos/LogosToolHostContext";
import { fetchLogosActionableCatalog } from "@/features/logos/logosActionableCatalog";
import { useToolboxExerciseSessionOptional } from "@/features/toolbox/ToolboxExerciseSessionContext";
import type { Locale } from "@/i18n/translations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  locale: Locale;
  isFR: boolean;
  className?: string;
};

export function LogosDevModalsPanel({ userId, locale, isFR, className }: Props) {
  const host = useLogosToolHost();
  const exercise = useToolboxExerciseSessionOptional();
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const run = useCallback(
    async (label: string, fn: () => Promise<string>) => {
      if (busy) return;
      setBusy(true);
      try {
        const result = await fn();
        const line = `${label}: ${result}`;
        setLastResult(line);
        console.info("[logos-lab-modal]", line);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        setLastResult(`${label}: error:${msg}`);
        console.error("[logos-lab-modal]", label, e);
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  const btn = (label: string, onClick: () => void, disabled?: boolean) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy || disabled}
      className="h-8 bg-background/80 px-2.5 font-display text-[9px] uppercase tracking-[0.14em]"
      onClick={() => onClick()}
    >
      {label}
    </Button>
  );

  return (
    <div
      className={cn(
        "pointer-events-auto fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 flex max-w-[min(100vw-2rem,22rem)] flex-col gap-2 rounded-xl border border-border/40 bg-background/90 p-3 shadow-lg backdrop-blur-md",
        className,
      )}
      aria-label={isFR ? "Preview modals LOGOS" : "LOGOS modal preview"}
    >
      <p className="font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        {isFR ? "Modals LOGOS" : "LOGOS modals"}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {btn(isFR ? "Choix" : "Choices", () => {
          void run("choices", () => host.proposeActionableChoicesAndWait(userId, locale, 3));
        })}
        {btn("Pulse", () => {
          void run("pulse", () => host.proposePulseAndWait(locale));
        })}
        {btn(isFR ? "People" : "People", () => {
          void run("people", () => host.openPeopleCheckinAndWait(userId));
        })}
        {btn(isFR ? "Quick log" : "Quick log", () => {
          void run("quick_log", () => host.openQuickLogAndWait());
        })}
        {btn(isFR ? "Décision" : "Decision", () => {
          void run("decision", () => host.openDecisionCaptureAndWait());
        })}
        {btn(
          "Toolbox",
          () => {
            void run("toolbox", async () => {
              const catalog = await fetchLogosActionableCatalog(userId, locale, 5);
              const first = catalog.toolbox[0];
              if (!first) return "error:no_toolbox";
              return host.openToolboxAndWait(userId, first.assignment_id);
            });
          },
          !exercise,
        )}
      </div>
      {!exercise ? (
        <p className="text-[10px] leading-snug text-muted-foreground">
          {isFR ? "Toolbox : provider absent." : "Toolbox: provider missing."}
        </p>
      ) : null}
      {lastResult ? (
        <p
          className="max-h-24 overflow-y-auto break-all font-mono text-[10px] leading-snug text-muted-foreground"
          role="status"
        >
          {lastResult}
        </p>
      ) : null}
    </div>
  );
}
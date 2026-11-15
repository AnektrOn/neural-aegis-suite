import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import QuickLogModal from "@/components/QuickLogModal";
import { useToolboxExerciseSessionOptional } from "@/features/toolbox/ToolboxExerciseSessionContext";
import { fetchPulseDeck, recordPulseSwipe } from "@/features/aegis-pulse/services/pulseService";
import type { PulseCard } from "@/features/aegis-pulse/domain/types";
import type { Locale } from "@/i18n/translations";
import { LOGOS_TOOLBOX_SESSION_END } from "./constants";
import { LogosPulseProposalModal } from "./LogosPulseProposalModal";
import { LogosPeopleCheckinModal } from "./LogosPeopleCheckinModal";
import {
  LogosChoicesPickerModal,
  type LogosChoiceItem,
} from "./LogosChoicesPickerModal";
import {
  fetchLogosActionableCatalog,
  resolveToolboxAssignmentId,
} from "./logosActionableCatalog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type LogosToolHostValue = {
  openToolboxAndWait: (userId: string, assignmentId?: string, slug?: string) => Promise<string>;
  proposePulseAndWait: (locale: Locale, cardId?: string) => Promise<string>;
  /** Opens a 2–3 choice picker; on select, opens toolbox/pulse and waits for completion. */
  proposeActionableChoicesAndWait: (
    userId: string,
    locale: Locale,
    limit?: number,
  ) => Promise<string>;
  openQuickLogAndWait: () => Promise<string>;
  openPeopleCheckinAndWait: (
    userId: string,
    contactId?: string,
    contactName?: string,
  ) => Promise<string>;
  openDecisionCaptureAndWait: () => Promise<string>;
};

const LogosToolHostContext = createContext<LogosToolHostValue | null>(null);

export function useLogosToolHost(): LogosToolHostValue {
  const ctx = useContext(LogosToolHostContext);
  if (!ctx) throw new Error("useLogosToolHost requires LogosToolHostProvider");
  return ctx;
}

function waitForToolboxSessionEnd(assignmentId: string): Promise<string> {
  return new Promise((resolve) => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ assignmentId: string; status: string }>).detail;
      if (detail?.assignmentId !== assignmentId) return;
      window.removeEventListener(LOGOS_TOOLBOX_SESSION_END, handler);
      resolve(detail.status);
    };
    window.addEventListener(LOGOS_TOOLBOX_SESSION_END, handler);
  });
}

export function LogosToolHostProvider({ children }: { children: ReactNode }) {
  const exercise = useToolboxExerciseSessionOptional();
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const quickLogResolve = useRef<((v: string) => void) | null>(null);

  const [pulseCard, setPulseCard] = useState<PulseCard | null>(null);
  const [pulseOpen, setPulseOpen] = useState(false);
  const [pulseBusy, setPulseBusy] = useState(false);
  const pulseResolve = useRef<((v: string) => void) | null>(null);
  const pulseLocaleRef = useRef<Locale>("fr");

  const [peopleOpen, setPeopleOpen] = useState(false);
  const peopleResolve = useRef<((v: string) => void) | null>(null);
  const [peopleUserId, setPeopleUserId] = useState<string | null>(null);
  const [peopleContactId, setPeopleContactId] = useState<string | null>(null);
  const [peopleContactName, setPeopleContactName] = useState<string | null>(null);

  const [decisionOpen, setDecisionOpen] = useState(false);
  const decisionResolve = useRef<((v: string) => void) | null>(null);

  const [choicesOpen, setChoicesOpen] = useState(false);
  const [choicesItems, setChoicesItems] = useState<LogosChoiceItem[]>([]);
  const [choicesBusy, setChoicesBusy] = useState(false);
  const choicesResolve = useRef<((v: string) => void) | null>(null);
  const choicesUserIdRef = useRef<string | null>(null);

  const openToolboxAndWait = useCallback(
    async (userId: string, assignmentId?: string, slug?: string): Promise<string> => {
      if (!exercise) return "error:no_toolbox_session_provider";
      const resolved = await resolveToolboxAssignmentId(userId, assignmentId, slug);
      if (!resolved) return "error:assignment_not_found";

      const waitPromise = waitForToolboxSessionEnd(resolved);
      exercise.openExercise(resolved);
      return waitPromise;
    },
    [exercise],
  );

  const proposePulseAndWait = useCallback(async (locale: Locale, cardId?: string): Promise<string> => {
    pulseLocaleRef.current = locale;
    const deck = await fetchPulseDeck(locale, 15);
    if ("error" in deck) return `error:${deck.error}`;
    const card =
      (cardId ? deck.cards.find((c) => c.id === cardId) : null) ?? deck.cards[0] ?? null;
    if (!card) return "error:no_pulse_card";

    return new Promise((resolve) => {
      pulseResolve.current = resolve;
      setPulseCard(card);
      setPulseOpen(true);
    });
  }, []);

  const finishChoices = useCallback((result: string) => {
    setChoicesOpen(false);
    setChoicesItems([]);
    setChoicesBusy(false);
    choicesResolve.current?.(result);
    choicesResolve.current = null;
    choicesUserIdRef.current = null;
  }, []);

  const proposeActionableChoicesAndWait = useCallback(
    async (userId: string, locale: Locale, limit = 3): Promise<string> => {
      const cap = Math.min(Math.max(limit, 2), 3);
      const catalog = await fetchLogosActionableCatalog(userId, locale, cap);
      const items: LogosChoiceItem[] = [
        ...catalog.toolbox.map((t) => ({
          kind: "toolbox" as const,
          id: t.assignment_id,
          title: t.title,
          subtitle: t.duration,
        })),
        ...catalog.pulse.map((p) => ({
          kind: "pulse" as const,
          id: p.card_id,
          title: p.title,
          subtitle: p.principle,
        })),
      ].slice(0, cap);

      if (items.length === 0) return "error:no_choices";

      return new Promise((resolve) => {
        choicesResolve.current = resolve;
        choicesUserIdRef.current = userId;
        pulseLocaleRef.current = locale;
        setChoicesItems(items);
        setChoicesOpen(true);
      });
    },
    [],
  );

  const handleChoiceSelect = useCallback(
    async (item: LogosChoiceItem) => {
      const userId = choicesUserIdRef.current;
      if (!userId) {
        finishChoices("error:not_authenticated");
        return;
      }
      setChoicesBusy(true);
      setChoicesOpen(false);
      try {
        if (item.kind === "toolbox") {
          const status = await openToolboxAndWait(userId, item.id);
          finishChoices(
            JSON.stringify({
              selected: { kind: "toolbox", id: item.id, title: item.title },
              status,
            }),
          );
          return;
        }
        const status = await proposePulseAndWait(pulseLocaleRef.current, item.id);
        finishChoices(
          JSON.stringify({
            selected: { kind: "pulse", id: item.id, title: item.title },
            status,
          }),
        );
      } catch (e) {
        finishChoices(
          `error:${e instanceof Error ? e.message : "choice_open_failed"}`,
        );
      }
    },
    [finishChoices, openToolboxAndWait, proposePulseAndWait],
  );

  const openQuickLogAndWait = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      quickLogResolve.current = resolve;
      setQuickLogOpen(true);
    });
  }, []);

  const openPeopleCheckinAndWait = useCallback(
    (userId: string, contactId?: string, contactName?: string): Promise<string> => {
      setPeopleUserId(userId);
      setPeopleContactId(contactId ?? null);
      setPeopleContactName(contactName ?? null);
      return new Promise((resolve) => {
        peopleResolve.current = resolve;
        setPeopleOpen(true);
      });
    },
    [],
  );

  const openDecisionCaptureAndWait = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      decisionResolve.current = resolve;
      setDecisionOpen(true);
    });
  }, []);

  const value = useMemo(
    () => ({
      openToolboxAndWait,
      proposePulseAndWait,
      proposeActionableChoicesAndWait,
      openQuickLogAndWait,
      openPeopleCheckinAndWait,
      openDecisionCaptureAndWait,
    }),
    [
      openToolboxAndWait,
      proposePulseAndWait,
      proposeActionableChoicesAndWait,
      openQuickLogAndWait,
      openPeopleCheckinAndWait,
      openDecisionCaptureAndWait,
    ],
  );

  const finishQuickLog = (result: string) => {
    setQuickLogOpen(false);
    quickLogResolve.current?.(result);
    quickLogResolve.current = null;
  };

  const finishPulse = (result: string) => {
    setPulseOpen(false);
    setPulseCard(null);
    pulseResolve.current?.(result);
    pulseResolve.current = null;
  };

  const handlePulseAction = async (action: "assimilated" | "ignored") => {
    if (!pulseCard) return;
    setPulseBusy(true);
    try {
      const res = await recordPulseSwipe(pulseCard.id, action);
      if (!("ok" in res) || res.ok === false) {
        finishPulse(`error:${"error" in res ? res.error : "swipe_failed"}`);
        return;
      }
      finishPulse(action);
    } finally {
      setPulseBusy(false);
    }
  };

  return (
    <LogosToolHostContext.Provider value={value}>
      {children}
      <LogosChoicesPickerModal
        open={choicesOpen}
        items={choicesItems}
        busy={choicesBusy}
        onSelect={(item) => void handleChoiceSelect(item)}
        onDismiss={() => finishChoices("dismissed")}
      />
      <QuickLogModal
        open={quickLogOpen}
        onClose={() => finishQuickLog("dismissed")}
        onSaved={() => finishQuickLog("saved")}
      />
      <LogosPulseProposalModal
        card={pulseCard}
        open={pulseOpen}
        busy={pulseBusy}
        onAssimilate={() => void handlePulseAction("assimilated")}
        onIgnore={() => void handlePulseAction("ignored")}
        onDismiss={() => finishPulse("dismissed")}
      />
      {peopleUserId ? (
        <LogosPeopleCheckinModal
          userId={peopleUserId}
          open={peopleOpen}
          initialContactId={peopleContactId}
          initialContactName={peopleContactName}
          onClose={(result) => {
            setPeopleOpen(false);
            peopleResolve.current?.(result);
            peopleResolve.current = null;
          }}
        />
      ) : null}
      <Dialog
        open={decisionOpen}
        onOpenChange={(o) => {
          if (!o) {
            decisionResolve.current?.("dismissed");
            decisionResolve.current = null;
            setDecisionOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Décision</DialogTitle>
            <DialogDescription>
              Utilise l&apos;outil write_decision pour enregistrer une décision à la voix.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => {
              decisionResolve.current?.("dismissed");
              decisionResolve.current = null;
              setDecisionOpen(false);
            }}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LogosToolHostContext.Provider>
  );
}

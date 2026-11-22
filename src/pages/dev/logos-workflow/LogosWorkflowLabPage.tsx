import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { LogosVoiceShell } from "@/features/logos/LogosVoiceShell";
import { useLogosToolHost } from "@/features/logos/LogosToolHostContext";
import { fetchLogosActionableCatalog } from "@/features/logos/logosActionableCatalog";
import {
  logosWriteDecision,
  logosWriteJournalEntry,
  logosWriteMoodEntry,
  logosWriteRelationNote,
} from "@/features/logos/logosWrites";
import { buildGuidedLogosInjection, buildOpenLogosInjection } from "@/features/logos/logosSessionInjection";
import {
  LogosChoicesPickerModal,
  type LogosChoiceItem,
} from "@/features/logos/LogosChoicesPickerModal";
import { LogosDevModalsPanel } from "@/pages/dev/logos/LogosDevModalsPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LOGOS_LAB_EXPECTED_GUIDE_SEQUENCE,
  LOGOS_LAB_INTENTS,
  LOGOS_LAB_SOMATIC_PATH,
  LOGOS_NODE_LABELS,
  LOGOS_NODE_TOOLS,
  LOGOS_WORKFLOW_EDGES,
  canTakeEdge,
  edgeById,
  makeTriggerId,
  resolveBackToTriageEdge,
  type LogosLabSessionMode,
  type LogosLabToolId,
  type LogosTriggerLogEntry,
  type LogosWorkflowNodeId,
} from "./logosWorkflowLabModel";

const TOOL_LABELS: Record<LogosLabToolId, string> = {
  list_actionable_content: "list_actionable_content",
  propose_actionable_choices: "propose_actionable_choices",
  open_toolbox_item: "open_toolbox_item",
  propose_pulse_card: "propose_pulse_card",
  open_quick_log: "open_quick_log",
  open_people_checkin: "open_people_checkin",
  open_decision_capture: "open_decision_capture",
  write_mood_entry: "write_mood_entry",
  write_journal_entry: "write_journal_entry",
  write_decision: "write_decision",
  write_relation_note: "write_relation_note",
};

/** Fixture when live catalog is empty — same as /dev/logos-choices. */
const LAB_SAMPLE_CHOICES: LogosChoiceItem[] = [
  { kind: "toolbox", id: "lab-1", title: "Isolation Proactive", subtitle: "4 min" },
  { kind: "pulse", id: "lab-2", title: "Ancrage matinal", subtitle: "1–2 min" },
  { kind: "toolbox", id: "lab-3", title: "Respiration en carré", subtitle: "3 min" },
];

function LabInner({ isFR }: { isFR: boolean }) {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const host = useLogosToolHost();
  const autoStarted = useRef(false);

  const [node, setNode] = useState<LogosWorkflowNodeId>("start_node");
  const [mode, setMode] = useState<LogosLabSessionMode | null>(null);
  const [openingPathId, setOpeningPathId] = useState<string | null>(null);
  const [openingPrompt, setOpeningPrompt] = useState<string | null>(null);
  const [firstMessage, setFirstMessage] = useState<string | null>(null);
  const [log, setLog] = useState<LogosTriggerLogEntry[]>([]);
  const [busyTool, setBusyTool] = useState<LogosLabToolId | null>(null);
  const [firedTools, setFiredTools] = useState<LogosLabToolId[]>([]);
  const [scenario, setScenario] = useState<"idle" | "note_somatic">("idle");
  const [fixtureOpen, setFixtureOpen] = useState(false);
  const [lastSmoke, setLastSmoke] = useState<string | null>(null);

  const pushLog = useCallback((entry: Omit<LogosTriggerLogEntry, "id" | "at">) => {
    setLog((prev) =>
      [{ id: makeTriggerId(), at: Date.now(), ...entry }, ...prev].slice(0, 80),
    );
  }, []);

  const takeEdge = useCallback(
    (edgeId: string, reason: string) => {
      const edge = edgeById(edgeId);
      if (!edge) {
        pushLog({ kind: "assert", message: `Edge inconnu: ${edgeId}`, ok: false });
        return;
      }
      if (!canTakeEdge(node, edgeId)) {
        pushLog({
          kind: "assert",
          message: `Edge ${edgeId} refusé depuis ${node}`,
          detail: edge.condition,
          ok: false,
        });
        return;
      }
      setNode(edge.target);
      setFiredTools([]);
      pushLog({
        kind: "edge",
        message: `${LOGOS_NODE_LABELS[edge.source][isFR ? "fr" : "en"]} → ${LOGOS_NODE_LABELS[edge.target][isFR ? "fr" : "en"]}`,
        detail: reason || edge.label,
        ok: true,
      });
    },
    [isFR, node, pushLog],
  );

  const startSession = useCallback(
    (kind: "open" | "guided_somatic") => {
      setFiredTools([]);
      setScenario(kind === "guided_somatic" ? "note_somatic" : "idle");

      if (kind === "guided_somatic") {
        const inj = buildGuidedLogosInjection(LOGOS_LAB_SOMATIC_PATH, "toi", user?.id);
        setMode("guided");
        setOpeningPathId(LOGOS_LAB_SOMATIC_PATH.id);
        setOpeningPrompt(inj.dynamicVariables.opening_prompt);
        setFirstMessage(inj.overrides?.agent.firstMessage ?? null);
        pushLog({
          kind: "session",
          message: isFR ? "Session guidée (fixture somatique Note)" : "Guided session (Note somatic fixture)",
          detail: inj.dynamicVariables.opening_prompt.slice(0, 120),
          ok: true,
        });
      } else {
        const inj = buildOpenLogosInjection("toi", user?.id);
        setMode("open");
        setOpeningPathId(null);
        setOpeningPrompt(inj.dynamicVariables.opening_prompt || null);
        setFirstMessage(null);
        pushLog({
          kind: "session",
          message: isFR ? "Session ouverte (triage)" : "Open session (triage)",
          ok: true,
        });
      }

      setNode("triage");
      pushLog({
        kind: "edge",
        message: `${LOGOS_NODE_LABELS.start_node[isFR ? "fr" : "en"]} → ${LOGOS_NODE_LABELS.triage[isFR ? "fr" : "en"]}`,
        detail: "start_node__greeting",
        ok: true,
      });
    },
    [isFR, pushLog, user?.id],
  );

  useEffect(() => {
    if (autoStarted.current || !user?.id) return;
    autoStarted.current = true;
    startSession("open");
  }, [startSession, user?.id]);

  const resetAll = useCallback(() => {
    setNode("start_node");
    setMode(null);
    setOpeningPathId(null);
    setOpeningPrompt(null);
    setFirstMessage(null);
    setFiredTools([]);
    setScenario("idle");
    setLog([]);
    autoStarted.current = false;
    pushLog({ kind: "session", message: "Lab reset", ok: true });
    window.setTimeout(() => {
      autoStarted.current = true;
      startSession("open");
    }, 0);
  }, [pushLog, startSession]);

  const fireIntent = useCallback(
    (intentId: string) => {
      const intent = LOGOS_LAB_INTENTS.find((i) => i.id === intentId);
      if (!intent) return;

      pushLog({
        kind: "intent",
        message: isFR ? intent.labelFr : intent.labelEn,
        ok: true,
      });

      if (intent.id === "back_triage") {
        const back = resolveBackToTriageEdge(node);
        if (back) {
          takeEdge(back, intent.labelFr);
        } else {
          setNode("triage");
          setFiredTools([]);
          pushLog({ kind: "edge", message: "→ triage (force)", ok: true });
        }
        return;
      }

      if (node !== "triage") {
        pushLog({
          kind: "assert",
          message: isFR
            ? `Intent « ${intent.labelFr} » attend triage (actuel: ${node})`
            : `Intent “${intent.labelEn}” needs triage (now: ${node})`,
          ok: false,
        });
        return;
      }

      if (intent.edgeId) takeEdge(intent.edgeId, intent.labelFr);

      if (intent.target === "guide_somatique" && scenario === "note_somatic") {
        pushLog({
          kind: "assert",
          message: isFR
            ? "Attendu: propose_actionable_choices (échec Note = annonce sans tool)"
            : "Expected: propose_actionable_choices (Note failure = announce without tool)",
          detail: LOGOS_LAB_EXPECTED_GUIDE_SEQUENCE.join(", "),
          ok: false,
        });
      }
    },
    [isFR, node, pushLog, scenario, takeEdge],
  );

  const openFixtureChoices = useCallback(() => {
    setFixtureOpen(true);
    setLastSmoke("fixture_choices:open");
    pushLog({
      kind: "tool",
      message: "propose_actionable_choices (fixture)",
      detail: "lab sample — catalogue live vide ou smoke",
      ok: true,
    });
  }, [pushLog]);

  const runTool = useCallback(
    async (tool: LogosLabToolId) => {
      if (!user?.id) {
        pushLog({ kind: "tool", message: tool, detail: "error:not_authenticated", ok: false });
        return;
      }
      const allowed = LOGOS_NODE_TOOLS[node];
      if (!allowed.includes(tool)) {
        pushLog({
          kind: "assert",
          message: `${tool} non prévu sur ${node}`,
          ok: false,
        });
        return;
      }

      setBusyTool(tool);
      pushLog({ kind: "tool", message: `${tool}…`, detail: `node=${node}` });

      try {
        let result = "ok";
        switch (tool) {
          case "list_actionable_content": {
            const catalog = await fetchLogosActionableCatalog(user.id, locale, 5);
            result = JSON.stringify({
              toolbox: catalog.toolbox.length,
              pulse: catalog.pulse.length,
            });
            break;
          }
          case "propose_actionable_choices": {
            result = await host.proposeActionableChoicesAndWait(user.id, locale, 3);
            if (result === "error:no_choices") {
              pushLog({
                kind: "assert",
                message: isFR
                  ? "Catalogue vide → ouverture fixture lab"
                  : "Empty catalog → opening lab fixture",
                ok: false,
              });
              openFixtureChoices();
              result = "fixture_opened";
            }
            break;
          }
          case "open_toolbox_item":
            result = await host.openToolboxAndWait(user.id);
            break;
          case "propose_pulse_card":
            result = await host.proposePulseAndWait(locale);
            break;
          case "open_quick_log":
            result = await host.openQuickLogAndWait();
            break;
          case "open_people_checkin":
            result = await host.openPeopleCheckinAndWait(user.id);
            break;
          case "open_decision_capture":
            result = await host.openDecisionCaptureAndWait();
            break;
          case "write_mood_entry": {
            const res = await logosWriteMoodEntry(user.id, { value: 3, sleep: 7, stress: 4 });
            result = "error" in res ? `error:${res.error}` : "ok";
            break;
          }
          case "write_journal_entry": {
            const res = await logosWriteJournalEntry(user.id, {
              title: "[lab] LOGOS workflow",
              content: "Entrée lab — logos-workflow",
              tags: ["lab", "logos-workflow"],
            });
            result = "error" in res ? `error:${res.error}` : "ok";
            break;
          }
          case "write_decision": {
            const res = await logosWriteDecision(user.id, {
              name: "[lab] Décision workflow",
              priority: 2,
              responsibility: 2,
            });
            result = "error" in res ? `error:${res.error}` : "ok";
            break;
          }
          case "write_relation_note": {
            const res = await logosWriteRelationNote(user.id, {
              contact_name: "Lab Contact",
              quality: 3,
              note: "[lab] note relation",
            });
            result = "error" in res ? `error:${res.error}` : "ok";
            break;
          }
          default:
            result = "error:unknown_tool";
        }

        const ok = !String(result).startsWith("error:");
        setFiredTools((prev) => (prev.includes(tool) ? prev : [...prev, tool]));
        pushLog({ kind: "tool", message: tool, detail: String(result).slice(0, 200), ok });

        if (
          tool === "propose_actionable_choices" &&
          scenario === "note_somatic" &&
          node === "guide_somatique" &&
          ok
        ) {
          pushLog({
            kind: "assert",
            message: isFR
              ? "Séquence corrigée: UI ouverte (ce que l’agent live n’a pas fait)"
              : "Corrected sequence: UI opened (what live agent skipped)",
            ok: true,
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        pushLog({ kind: "tool", message: tool, detail: `error:${msg}`, ok: false });
      } finally {
        setBusyTool(null);
      }
    },
    [host, isFR, locale, node, openFixtureChoices, pushLog, scenario, user?.id],
  );

  const jumpToGuideAndPropose = useCallback(() => {
    if (!user?.id) return;
    if (mode === null) startSession("guided_somatic");
    setNode("guide_somatique");
    setScenario("note_somatic");
    setFiredTools([]);
    pushLog({
      kind: "edge",
      message: `→ ${LOGOS_NODE_LABELS.guide_somatique[isFR ? "fr" : "en"]}`,
      detail: "lab shortcut",
      ok: true,
    });
    void (async () => {
      setBusyTool("propose_actionable_choices");
      try {
        let result = await host.proposeActionableChoicesAndWait(user.id, locale, 3);
        if (result === "error:no_choices") {
          openFixtureChoices();
          result = "fixture_opened";
        }
        const ok = !result.startsWith("error:");
        setFiredTools((prev) =>
          prev.includes("propose_actionable_choices")
            ? prev
            : [...prev, "propose_actionable_choices"],
        );
        pushLog({
          kind: "tool",
          message: "propose_actionable_choices",
          detail: result.slice(0, 200),
          ok,
        });
        setLastSmoke(`propose:${result}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        pushLog({
          kind: "tool",
          message: "propose_actionable_choices",
          detail: `error:${msg}`,
          ok: false,
        });
      } finally {
        setBusyTool(null);
      }
    })();
  }, [
    host,
    isFR,
    locale,
    mode,
    openFixtureChoices,
    pushLog,
    startSession,
    user?.id,
  ]);

  const nodeLabel = LOGOS_NODE_LABELS[node][isFR ? "fr" : "en"];
  const nodeTools = LOGOS_NODE_TOOLS[node];
  const outgoing = LOGOS_WORKFLOW_EDGES.filter((e) => e.source === node);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-16">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-cormorant text-3xl font-light tracking-tight">
            LOGOS — workflow lab
          </h1>
          <p className="mt-1 max-w-xl font-quattrocento text-sm text-muted-foreground">
            {isFR
              ? "1) Smoke modals en bas à droite (toujours). 2) Intent → nœud → tools. Local = même Supabase/UI ; pas besoin de prod."
              : "1) Smoke modals bottom-right (always). 2) Intent → node → tools. Local = same Supabase/UI; no prod needed."}
          </p>
        </div>
        <Badge variant="outline" className="font-normal">
          LAB · no voice
        </Badge>
      </header>

      <section className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {isFR ? "Smoke immédiat" : "Immediate smoke"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {isFR
            ? "Ces boutons ouvrent les vrais modals sans passer par triage. Si rien ne s’ouvre ici, le problème n’est pas le workflow."
            : "These open real modals without triage. If nothing opens here, it isn’t the workflow."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={jumpToGuideAndPropose}>
            {isFR ? "Guide + propose_actionable_choices" : "Guide + propose_actionable_choices"}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={openFixtureChoices}>
            {isFR ? "Picker fixture (sans catalogue)" : "Fixture picker (no catalog)"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void (async () => {
                const r = await host.openQuickLogAndWait();
                setLastSmoke(`quick_log:${r}`);
                pushLog({ kind: "tool", message: "open_quick_log", detail: r, ok: !r.startsWith("error:") });
              })();
            }}
          >
            open_quick_log
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              if (!user?.id) return;
              void (async () => {
                const r = await host.openDecisionCaptureAndWait();
                setLastSmoke(`decision:${r}`);
                pushLog({ kind: "tool", message: "open_decision_capture", detail: r, ok: !r.startsWith("error:") });
              })();
            }}
          >
            open_decision_capture
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void (async () => {
                const r = await host.proposePulseAndWait(locale);
                setLastSmoke(`pulse:${r}`);
                pushLog({ kind: "tool", message: "propose_pulse_card", detail: r, ok: !r.startsWith("error:") });
              })();
            }}
          >
            propose_pulse_card
          </Button>
        </div>
        {lastSmoke ? (
          <p className="font-mono text-[11px] text-muted-foreground">{lastSmoke}</p>
        ) : null}
      </section>

      {/* Session */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Session
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => startSession("open")}>
            <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Open (triage)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => startSession("guided_somatic")}
          >
            {isFR ? "Guided somatique (Note)" : "Guided somatic (Note)"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={resetAll}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Reset
          </Button>
        </div>
        <dl className="grid gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Node</dt>
            <dd className="font-medium">
              {nodeLabel} <span className="text-muted-foreground">({node})</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">session_mode</dt>
            <dd className="font-medium">{mode ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">opening_path_id</dt>
            <dd className="break-all font-mono text-xs">{openingPathId ?? "—"}</dd>
          </div>
          {openingPrompt ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">opening_prompt</dt>
              <dd className="text-xs leading-relaxed text-muted-foreground">{openingPrompt}</dd>
            </div>
          ) : null}
          {firstMessage ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">firstMessage</dt>
              <dd className="text-xs italic">{firstMessage}</dd>
            </div>
          ) : null}
        </dl>
        {node === "triage" ? (
          <p className="text-xs text-amber-700 dark:text-amber-200">
            {isFR
              ? "Sur triage il n’y a presque pas de modal (normal). Clique « Toolbox / pratique » puis un tool, ou utilise Smoke ci-dessus."
              : "On triage almost no modals (by design). Click “Toolbox / practice” then a tool, or use Smoke above."}
          </p>
        ) : null}
      </section>

      {/* Intents */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {isFR ? "Intents (depuis triage)" : "Intents (from triage)"}
        </h2>
        <div className="flex flex-wrap gap-2">
          {LOGOS_LAB_INTENTS.map((intent) => {
            const disabled =
              intent.id === "back_triage"
                ? node === "triage" || node === "start_node" || node === "end_node"
                : node !== "triage";
            return (
              <Button
                key={intent.id}
                type="button"
                size="sm"
                variant={intent.id === "toolbox" ? "default" : "outline"}
                disabled={disabled || mode === null}
                onClick={() => fireIntent(intent.id)}
              >
                {isFR ? intent.labelFr : intent.labelEn}
              </Button>
            );
          })}
        </div>
        {outgoing.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {isFR ? "Edges sortantes:" : "Outgoing edges:"}{" "}
            {outgoing.map((e) => e.label).join(" · ")}
          </p>
        ) : null}
      </section>

      {/* Tools */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {isFR ? "Client tools (nœud courant)" : "Client tools (current node)"}
        </h2>
        {nodeTools.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isFR ? "Aucun tool UI sur ce nœud." : "No UI tools on this node."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {nodeTools.map((tool) => {
              const fired = firedTools.includes(tool);
              const expected =
                scenario === "note_somatic" &&
                node === "guide_somatique" &&
                LOGOS_LAB_EXPECTED_GUIDE_SEQUENCE.includes(tool);
              return (
                <Button
                  key={tool}
                  type="button"
                  size="sm"
                  variant={expected && !fired ? "default" : fired ? "secondary" : "outline"}
                  disabled={busyTool !== null || mode === null}
                  className={cn(expected && !fired && "ring-2 ring-amber-500/50")}
                  onClick={() => void runTool(tool)}
                >
                  {busyTool === tool ? "…" : TOOL_LABELS[tool]}
                  {fired ? " ✓" : ""}
                </Button>
              );
            })}
          </div>
        )}
      </section>

      {/* Log */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Trigger log
        </h2>
        <ul className="max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-border/60 bg-background/80 p-2 font-mono text-[11px]">
          {log.length === 0 ? (
            <li className="px-2 py-3 text-muted-foreground">
              {isFR ? "Vide — démarre une session." : "Empty — start a session."}
            </li>
          ) : (
            log.map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  "rounded px-2 py-1.5",
                  entry.ok === false && "bg-destructive/10 text-destructive",
                  entry.ok === true && entry.kind === "assert" && "bg-emerald-500/10",
                  entry.kind === "tool" && entry.ok !== false && "bg-muted/40",
                )}
              >
                <span className="text-muted-foreground">
                  {new Date(entry.at).toLocaleTimeString()} · {entry.kind}
                </span>{" "}
                {entry.message}
                {entry.detail ? (
                  <div className="mt-0.5 truncate text-muted-foreground">{entry.detail}</div>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>

      {user?.id ? (
        <LogosDevModalsPanel userId={user.id} locale={locale} isFR={isFR} />
      ) : null}

      <LogosChoicesPickerModal
        open={fixtureOpen}
        items={LAB_SAMPLE_CHOICES}
        busy={false}
        onSelect={(item) => {
          setLastSmoke(`fixture_select:${item.title}`);
          setFixtureOpen(false);
          pushLog({
            kind: "tool",
            message: "fixture_choice",
            detail: item.title,
            ok: true,
          });
        }}
        onDismiss={() => {
          setFixtureOpen(false);
          pushLog({ kind: "tool", message: "fixture_choice", detail: "dismissed", ok: true });
        }}
      />
    </div>
  );
}

export default function LogosWorkflowLabPage() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  return (
    <div className="relative min-h-dvh bg-[color:var(--aegis-bg)] text-[color:var(--aegis-ink)]">
      <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between gap-3 px-4 py-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
          <Link to="/dev">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
            Lab
          </Link>
        </Button>
      </div>

      {!user ? (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">
            {isFR
              ? "Localhost a sa propre session. Connecte-toi ici (même compte prod), puis reviens — sinon aucun modal ne peut tourner."
              : "Localhost has its own session. Sign in here (same prod account), then come back — otherwise no modal can run."}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/auth?redirect=/dev/logos-workflow">Auth → lab</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dev/logos-choices">
              {isFR ? "Sans auth : picker fixture" : "No auth: fixture picker"}
            </Link>
          </Button>
        </div>
      ) : (
        <LogosVoiceShell>
          <LabInner isFR={isFR} />
        </LogosVoiceShell>
      )}
    </div>
  );
}

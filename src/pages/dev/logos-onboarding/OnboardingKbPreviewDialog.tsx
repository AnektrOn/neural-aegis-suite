import { useState } from "react";
import { ChevronDown, FileText, FolderOpen, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  fileHasEmbeddedPreview,
  type OnboardingDrivePreviewFile,
  type OnboardingDrivePreviewFileMeta,
} from "@/features/logos/onboardingReportDevApi";
import type { VoiceKnowledgeLocator } from "@/services/agentSessionService";
import type { MajorArchetypeScore } from "@/features/logos/onboardingReportOpening";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFR: boolean;
  driveFolderId: string;
  folderName?: string | null;
  driveFiles?: (OnboardingDrivePreviewFileMeta | OnboardingDrivePreviewFile)[];
  driveError?: string | null;
  loading?: boolean;
  sessionKnowledge?: VoiceKnowledgeLocator[] | null;
  voiceOpeningPreview?: {
    first_message: string;
    top_archetypes: MajorArchetypeScore[];
  } | null;
};

function formatCharCount(n: number | undefined, isFR: boolean): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1000) {
    const k = (n / 1000).toFixed(n >= 10_000 ? 0 : 1);
    return isFR ? `${k} k car.` : `${k}k chars`;
  }
  return isFR ? `${n} car.` : `${n} chars`;
}

export function OnboardingKbPreviewDialog({
  open,
  onOpenChange,
  isFR,
  driveFolderId,
  folderName,
  driveFiles,
  driveError,
  loading,
  sessionKnowledge,
  voiceOpeningPreview,
}: Props) {
  const driveCount = driveFiles?.length ?? 0;
  const sessionCount = sessionKnowledge?.length ?? 0;
  const [openPaths, setOpenPaths] = useState<Record<string, boolean>>({});

  const setFileOpen = (path: string, next: boolean) => {
    setOpenPaths((prev) => ({ ...prev, [path]: next }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl gap-0 p-0">
        <DialogHeader className="space-y-1 border-b border-border px-6 py-4 text-left">
          <DialogTitle>
            {isFR ? "Aperçu — knowledge onboarding" : "Preview — onboarding knowledge"}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {folderName ? `${folderName} · ` : ""}
            {driveFolderId}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[min(75vh,36rem)] px-6 py-4">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FolderOpen className="h-4 w-4 text-muted-foreground" aria-hidden />
              {isFR ? "Contenu Drive (aperçu)" : "Drive content (preview)"}
              <span className="text-muted-foreground">({driveCount})</span>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
              ) : null}
            </div>
            {driveError ? (
              <p className="text-sm text-destructive">{driveError}</p>
            ) : loading && !driveCount ? (
              <p className="text-sm text-muted-foreground">
                {isFR ? "Chargement du pack (un appel Drive)…" : "Loading pack (single Drive call)…"}
              </p>
            ) : driveCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isFR ? "Aucun .md dans le pack (attendu : 00_RAPPORT.md)." : "No .md in pack (expected 00_RAPPORT.md)."}
              </p>
            ) : (
              <ul className="space-y-3">
                {driveFiles!.map((meta) => {
                  const pathKey = meta.relativePath || meta.name;
                  const expanded = openPaths[pathKey] ?? true;
                  const file = fileHasEmbeddedPreview(meta) ? meta : null;
                  const rowError = "error" in meta && meta.error ? String(meta.error) : null;

                  return (
                    <li
                      key={meta.id}
                      className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
                    >
                      <Collapsible
                        open={expanded}
                        onOpenChange={(next) => setFileOpen(pathKey, next)}
                      >
                        <CollapsibleTrigger className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-muted/50">
                          <ChevronDown
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                              !expanded && "-rotate-90",
                            )}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs font-medium text-foreground">{pathKey}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              {loading && !file && !rowError ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                                  {isFR ? "Chargement…" : "Loading…"}
                                </>
                              ) : rowError ? (
                                <span className="text-destructive">{rowError}</span>
                              ) : (
                                <>
                                  {formatCharCount(file?.char_count, isFR)}
                                  {file?.truncated
                                    ? isFR
                                      ? ` · tronqué`
                                      : ` · truncated`
                                    : null}
                                </>
                              )}
                            </p>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t border-border bg-muted/30 px-3 py-2">
                            {loading && !file && !rowError ? (
                              <p className="text-xs text-muted-foreground">
                                {isFR ? "Lecture Drive…" : "Reading from Drive…"}
                              </p>
                            ) : rowError ? (
                              <p className="text-xs text-destructive">{rowError}</p>
                            ) : (
                              <ScrollArea className="max-h-64 rounded-md border border-border/60 bg-background">
                                <pre className="whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-relaxed text-foreground">
                                  {file?.preview?.trim()
                                    ? file.preview
                                    : isFR
                                      ? "(vide — redéploie agent-session ou attends si rate-limit Drive)"
                                      : "(empty — redeploy agent-session or wait if Drive rate limited)"}
                                </pre>
                              </ScrollArea>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {voiceOpeningPreview ? (
            <section className="mt-6 space-y-2 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">
                {isFR ? "Premier message LOGOS (oral)" : "LOGOS first spoken message"}
              </p>
              {voiceOpeningPreview.top_archetypes.length >= 3 ? (
                <p className="text-[10px] text-muted-foreground">
                  Top 3 : {voiceOpeningPreview.top_archetypes.map((a) => `${a.label} (${a.score})`).join(" · ")}
                </p>
              ) : null}
              <p className="rounded-md border border-border/80 bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
                {voiceOpeningPreview.first_message}
              </p>
            </section>
          ) : null}

          {sessionKnowledge != null ? (
            <section className="mt-6 space-y-2 border-t border-border pt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                {isFR ? "Injecté dans la session (ElevenLabs)" : "Injected in session (ElevenLabs)"}
                <span className="text-muted-foreground">({sessionCount})</span>
              </div>
              {sessionCount === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isFR ? "Aucun document retourné par agent-session." : "No documents returned from agent-session."}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {sessionKnowledge.map((kb) => (
                    <li
                      key={kb.id}
                      className="rounded-md border border-border/80 bg-muted/40 px-3 py-2 text-xs"
                    >
                      <p className="font-mono text-foreground">{kb.name}</p>
                      <p className="mt-0.5 text-muted-foreground">
                        {kb.type} · {kb.id}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
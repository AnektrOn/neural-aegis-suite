import { useRef, useState } from "react";
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  CloudDownload,
  Loader2,
  FileText,
  FileUp,
  FolderOpen,
  Check,
  X,
  CheckCheck,
  Eye,
  Globe,
  UserPlus,
} from "lucide-react";
import UserPicker from "@/features/admin-export/UserPicker";
import {
  ToolboxSection,
  toolboxFieldClass,
} from "@/components/admin/toolbox/ToolboxAdminUi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  parseAndPreviewImport,
  runPulseImport,
  fetchFromDrive,
  type ImportPreview,
  type PulseCardImportPayload,
} from "./pulseAdminService";
import { parseMarkdownCards } from "./pulseMarkdownParser";

type ImportResult = { ok: boolean; inserted: number; updated: number; errors: string[] };

function analyzeContent(content: string, fileName: string): ImportPreview {
  const trimmed = content.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return parseAndPreviewImport(content);
  }
  return parseMarkdownCards([{ name: fileName, content }]);
}

function analyzeMultipleFiles(files: { name: string; content: string }[]): ImportPreview {
  const mdFiles = files.filter((f) => f.name.endsWith(".md"));
  const jsonFiles = files.filter((f) => f.name.endsWith(".json"));

  let allCards: PulseCardImportPayload[] = [];
  let allErrors: string[] = [];
  let total = 0;

  if (mdFiles.length > 0) {
    const mdResult = parseMarkdownCards(mdFiles);
    allCards.push(...mdResult.cards);
    allErrors.push(...mdResult.errors);
    total += mdResult.total;
  }

  for (const jf of jsonFiles) {
    const jsonResult = parseAndPreviewImport(jf.content);
    allCards.push(...jsonResult.cards);
    allErrors.push(...jsonResult.errors);
    total += jsonResult.total;
  }

  return { total, valid: allCards.length, errors: allErrors, cards: allCards };
}

/* ── Component ───────────────────────────────────────────────────── */

export function PulseJsonImport({ onImported }: { onImported: () => void }) {
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const [driveUrl, setDriveUrl] = useState("");
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);

  const [forceActive, setForceActive] = useState(true);
  const [universalVisibility, setUniversalVisibility] = useState(false);
  const [assignUsers, setAssignUsers] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const applyPreview = (p: ImportPreview, label: string) => {
    setPreview(p);
    setResult(null);
    setSourceLabel(label);
    setSelectedKeys(new Set(p.cards.map((c) => c.external_key)));
  };

  /* ── Analyze pasted content ──────────────────────────── */
  const handleAnalyze = () => {
    const p = analyzeContent(content, sourceLabel ?? "paste");
    applyPreview(p, sourceLabel ?? "Collé manuellement");
  };

  /* ── Import selected cards ──────────────────────────── */
  const handleImport = async () => {
    if (!preview) return;
    const toImport = preview.cards
      .filter((c) => selectedKeys.has(c.external_key))
      .map((c) => {
        let targetIds = c.target_user_ids;
        let archetypes = c.archetype_targets;

        if (universalVisibility) {
          targetIds = [];
          archetypes = [];
        } else if (assignUsers.length > 0) {
          targetIds = assignUsers;
        }

        return {
          ...c,
          is_active: forceActive ? true : c.is_active,
          target_user_ids: targetIds,
          archetype_targets: archetypes,
        };
      });
    if (toImport.length === 0) return;
    setImporting(true);
    const res = await runPulseImport(toImport);
    setResult(res);
    setImporting(false);
    if (res.ok) onImported();
  };

  /* ── Google Drive (file or folder) ──────────────────── */
  const handleLoadFromDrive = async () => {
    if (!driveUrl.trim()) return;
    setDriveLoading(true);
    setDriveError(null);
    setSourceLabel(null);

    try {
      const resp = await fetchFromDrive(driveUrl);

      if (resp.mode === "folder") {
        const entries = resp.files.map((f) => ({ name: f.fileName, content: f.content }));
        const p = analyzeMultipleFiles(entries);
        setContent(`(${resp.folderFileCount} fichiers dans le dossier Drive)`);
        applyPreview(p, `Dossier Drive — ${resp.folderFileCount} fichier(s)`);
      } else {
        setContent(resp.content);
        const p = analyzeContent(resp.content, resp.fileName);
        applyPreview(p, resp.fileName);
      }
    } catch (err) {
      setDriveError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setDriveLoading(false);
    }
  };

  /* ── Local file(s) ──────────────────────────────────── */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    readFileList(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Local folder ───────────────────────────────────── */
  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    readFileList(files);
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const readFileList = (fileList: FileList) => {
    const validFiles = Array.from(fileList).filter(
      (f) => f.name.endsWith(".md") || f.name.endsWith(".json"),
    );

    if (validFiles.length === 0) {
      setDriveError("Aucun fichier .md ou .json trouvé.");
      return;
    }

    const entries: { name: string; content: string }[] = [];
    let loaded = 0;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          entries.push({
            name: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
            content: reader.result,
          });
        }
        loaded++;
        if (loaded === validFiles.length) {
          if (entries.length === 1) {
            setContent(entries[0].content);
            const p = analyzeContent(entries[0].content, entries[0].name);
            applyPreview(p, entries[0].name);
          } else {
            const p = analyzeMultipleFiles(entries);
            setContent(`(${entries.length} fichiers chargés)`);
            applyPreview(p, `${entries.length} fichier(s) local(aux)`);
          }
        }
      };
      reader.readAsText(file);
    });
  };

  /* ── Card selection helpers ─────────────────────────── */
  const toggleCard = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    if (!preview) return;
    setSelectedKeys(new Set(preview.cards.map((c) => c.external_key)));
  };

  const deselectAll = () => setSelectedKeys(new Set());

  /* ── Reset ──────────────────────────────────────────── */
  const reset = () => {
    setContent("");
    setPreview(null);
    setResult(null);
    setSourceLabel(null);
    setSelectedKeys(new Set());
    setDriveError(null);
  };

  const selectedCount = preview ? preview.cards.filter((c) => selectedKeys.has(c.external_key)).length : 0;

  return (
    <ToolboxSection
      title="Import de contenu"
      description="Importez des cartes Pulse depuis Google Drive (fichier ou dossier), un dossier local, ou en collant du contenu."
    >
      <div className="space-y-4">
        {/* ── Google Drive ─────────────────────────────────── */}
        <div className="ethereal-glass p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CloudDownload className="size-4 text-primary" />
            <p className="text-sm font-medium text-text-primary">Google Drive</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Lien vers un <strong>fichier</strong> (<code className="text-[10px] px-1 py-0.5 rounded bg-bg-elevated">.md</code> / <code className="text-[10px] px-1 py-0.5 rounded bg-bg-elevated">.json</code>) ou un <strong>dossier</strong> entier partagé avec le service account.
          </p>
          <div className="flex gap-2">
            <input
              value={driveUrl}
              onChange={(e) => { setDriveUrl(e.target.value); setDriveError(null); }}
              placeholder="https://drive.google.com/drive/folders/... ou /file/d/..."
              className={`${toolboxFieldClass} flex-1 font-mono text-xs`}
            />
            <Button
              onClick={handleLoadFromDrive}
              disabled={driveLoading || !driveUrl.trim()}
              variant="outline"
              className="gap-2 shrink-0"
            >
              {driveLoading ? <Loader2 className="size-4 animate-spin" /> : <CloudDownload className="size-4" />}
              {driveLoading ? "Chargement…" : "Charger"}
            </Button>
          </div>
          {driveError && (
            <div className="flex items-start gap-2 text-xs text-red-400">
              <AlertTriangle className="size-3 mt-0.5 shrink-0" />
              <span>{driveError}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">ou depuis votre machine</span>
          <Separator className="flex-1" />
        </div>

        {/* ── Local file / folder upload ───────────────────── */}
        <div className="flex flex-wrap gap-3">
          <input ref={fileInputRef} type="file" accept=".md,.json" multiple onChange={handleFileUpload} className="hidden" />
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory is non-standard
            webkitdirectory=""
            onChange={handleFolderUpload}
            className="hidden"
          />
          <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="size-4" />
            Fichier(s)
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => folderInputRef.current?.click()}>
            <FolderOpen className="size-4" />
            Dossier
          </Button>
          <span className="text-xs text-muted-foreground self-center">
            .md (Obsidian) ou .json — fichier unique, sélection multiple, ou dossier complet
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">ou coller du contenu</span>
          <Separator className="flex-1" />
        </div>

        {/* ── Textarea ────────────────────────────────────── */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setPreview(null);
              setResult(null);
              setSourceLabel(null);
              setSelectedKeys(new Set());
            }}
            rows={8}
            placeholder={
              "Lot de 10 : <!-- pulse-item --> puis --- par carte\n" +
              "── ou 1 carte ---\nexternal_key: pulse_...\nprinciple: MENTALISM\n---\n# Hook FR\n...\n\n── ou JSON ──\n[{ \"external_key\": ... }]"
            }
            className={`${toolboxFieldClass} h-auto resize-y font-mono text-xs`}
          />
          {content.length > 0 && (
            <button type="button" onClick={reset} className="absolute right-3 top-3 text-xs text-muted-foreground hover:text-text-primary transition-colors">
              Effacer
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleAnalyze} disabled={content.trim().length < 2 || content.startsWith("(")} variant="outline" className="gap-2">
            {content.trim().startsWith("---") ||
            content.includes("<!-- toolbox-item") ||
            content.includes("<!-- pulse-item") ? (
              <FileText className="size-4" />
            ) : (
              <FileJson className="size-4" />
            )}
            Analyser
          </Button>
        </div>

        {/* ── Source indicator ─────────────────────────────── */}
        {sourceLabel && !driveError && (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <CheckCircle2 className="size-3 shrink-0" />
            <span>Source : <span className="font-mono">{sourceLabel}</span></span>
          </div>
        )}

        {/* ── Preview + Validation ─────────────────────────── */}
        {preview && (
          <div className="ethereal-glass p-4 space-y-3">
            {/* Stats */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline">{preview.total} analysée(s)</Badge>
              <Badge variant="outline" className="text-green-400 border-green-400/30">
                {preview.valid} valide(s)
              </Badge>
              {preview.errors.length > 0 && (
                <Badge variant="outline" className="text-amber-400 border-amber-400/30">
                  {preview.errors.length} erreur(s)
                </Badge>
              )}
              {preview.cards.length > 0 && (
                <Badge variant="outline" className="text-primary border-primary/30">
                  {selectedCount}/{preview.cards.length} sélectionnée(s)
                </Badge>
              )}
            </div>

            {/* Import options */}
            <div className="space-y-3 p-3 rounded-lg border border-border-subtle bg-bg-elevated/30">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Options d'import</p>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={forceActive}
                    onClick={() => setForceActive((v) => !v)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${forceActive ? "bg-green-500" : "bg-border"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${forceActive ? "translate-x-4" : ""}`} />
                  </button>
                  <span className="flex items-center gap-1.5 text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                    <Eye className="size-3.5" />
                    Importer comme actives
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={universalVisibility}
                    onClick={() => setUniversalVisibility((v) => !v)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${universalVisibility ? "bg-green-500" : "bg-border"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${universalVisibility ? "translate-x-4" : ""}`} />
                  </button>
                  <span className="flex items-center gap-1.5 text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                    <Globe className="size-3.5" />
                    Visibilité universelle
                    <span className="text-[10px] text-muted-foreground">(ignore ciblage)</span>
                  </span>
                </label>
              </div>

              {/* User assignment */}
              {!universalVisibility && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserPlus className="size-3.5 text-cyan-400" />
                    <span className="text-xs text-text-secondary">
                      Attribuer à un(des) user(s)
                    </span>
                    {assignUsers.length > 0 && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-cyan-400 border-cyan-400/30">
                        {assignUsers.length} sélectionné(s)
                      </Badge>
                    )}
                    {assignUsers.length === 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        (vide = garde le user_id du fichier)
                      </span>
                    )}
                  </div>
                  <UserPicker selected={assignUsers} onChange={setAssignUsers} />
                </div>
              )}
            </div>

            {/* Errors */}
            {preview.errors.length > 0 && (
              <div className="space-y-1.5">
                {preview.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-400">
                    <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Card list with checkboxes */}
            {preview.cards.length > 0 && (
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Validation des cartes
                  </p>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] gap-1" onClick={selectAll}>
                      <CheckCheck className="size-3" /> Tout
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] gap-1" onClick={deselectAll}>
                      <X className="size-3" /> Aucun
                    </Button>
                  </div>
                </div>

                {preview.cards.map((card) => {
                  const isSelected = selectedKeys.has(card.external_key);
                  return (
                    <button
                      key={card.external_key}
                      type="button"
                      onClick={() => toggleCard(card.external_key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "bg-primary/5 border-primary/30"
                          : "bg-bg-elevated/30 border-border-subtle opacity-50"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`flex items-center justify-center size-5 rounded border-2 shrink-0 transition-colors ${
                        isSelected ? "bg-primary border-primary text-white" : "border-border bg-transparent"
                      }`}>
                        {isSelected && <Check className="size-3" strokeWidth={3} />}
                      </div>

                      {/* Card info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {card.title.fr}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] font-mono text-muted-foreground">{card.external_key}</span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">{card.principle}</Badge>
                          {card.content_type !== "card" && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-violet-400 border-violet-400/30">
                              {card.content_type}
                            </Badge>
                          )}
                          {card.archetype_targets.map((a) => (
                            <Badge key={a} variant="outline" className="text-[10px] py-0 px-1.5 text-accent-primary border-accent-primary/30">
                              {a}
                            </Badge>
                          ))}
                          {card.target_user_ids.length > 0 && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-cyan-400 border-cyan-400/30">
                              👤 {card.target_user_ids.length === 1
                                ? card.target_user_ids[0].slice(0, 8) + "…"
                                : `${card.target_user_ids.length} users`}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span>{card.time_label}</span>
                          {card.course_content?.fr?.hook && <span>· Hook ✓</span>}
                          {card.course_content?.fr?.concept && <span>· Concept ✓</span>}
                          {card.course_content?.fr?.action && <span>· Action ✓</span>}
                        </div>
                      </div>

                      <Badge variant={card.is_active ? "default" : "secondary"} className="shrink-0 text-[10px]">
                        {card.is_active ? "Actif" : "Draft"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Draft warning */}
            {(() => {
              const selectedCards = preview.cards.filter((c) => selectedKeys.has(c.external_key));
              const draftCount = selectedCards.filter((c) => !c.is_active).length;
              const targetedCount = selectedCards.filter((c) => c.target_user_ids.length > 0).length;
              const archetypeCount = selectedCards.filter((c) => c.archetype_targets.length > 0).length;

              if (draftCount === 0 && targetedCount === 0 && archetypeCount === 0) return null;
              return (
                <div className="p-3 rounded-lg border border-amber-400/30 bg-amber-400/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    <span>Visibilité limitée</span>
                  </div>
                  {draftCount > 0 && (
                    <p className="text-[11px] text-amber-400/80 ml-5">
                      <strong>{draftCount}</strong> carte(s) en <strong>draft</strong> (is_active: false) — invisibles côté user tant qu'elles ne sont pas activées dans le catalogue.
                    </p>
                  )}
                  {targetedCount > 0 && (
                    <p className="text-[11px] text-amber-400/80 ml-5">
                      <strong>{targetedCount}</strong> carte(s) ciblées par <strong>user_id</strong> — seul(s) le(s) user(s) visé(s) les verront.
                    </p>
                  )}
                  {archetypeCount > 0 && (
                    <p className="text-[11px] text-amber-400/80 ml-5">
                      <strong>{archetypeCount}</strong> carte(s) ciblées par <strong>archétype</strong> — seuls les users de l'archétype correspondant les verront.
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Import button */}
            {preview.cards.length > 0 && !result && (
              <div className="pt-2">
                <Button onClick={handleImport} disabled={importing || selectedCount === 0} className="gap-2 w-full sm:w-auto">
                  <Upload className="size-4" />
                  {importing
                    ? "Import en cours..."
                    : `Importer ${selectedCount} carte(s) validée(s)`}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Result ──────────────────────────────────────── */}
        {result && (
          <div className={`ethereal-glass p-4 flex items-start gap-3 ${result.ok ? "border-green-500/20" : "border-amber-500/20"}`}>
            {result.ok ? (
              <CheckCircle2 className="size-5 text-green-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-sm">
              <p className="text-text-primary font-medium">
                {result.inserted} insérée(s), {result.updated} mise(s) à jour
              </p>
              {result.errors.length > 0 && (
                <div className="space-y-0.5 text-xs text-amber-400">
                  {result.errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolboxSection>
  );
}

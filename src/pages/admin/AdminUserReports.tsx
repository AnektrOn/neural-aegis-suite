import { useEffect, useState, useCallback, useMemo, Component, type ReactNode } from "react";
import JSZip from "jszip";
import {
  Upload,
  Trash2,
  FileText,
  Loader2,
  Eye,
  X,
  Check,
  FolderArchive,
  Folder,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Bot,
  Zap,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import UserPicker from "@/features/admin-export/UserPicker";
import {
  listUserReports,
  importUserReport,
  importUserReportV3Pack,
  deleteUserReport,
} from "@/features/user-reports/service";
import type { UserReport } from "@/features/user-reports/types";
import {
  parseLevelPack,
  type ParsedLevelPackResult,
  type LevelPackFileEntry,
} from "@/features/user-reports/utils/parseLevelPack";
import { UserReportModal } from "@/features/user-reports/UserReportModal";
import { cn } from "@/lib/utils";

interface StagedPack {
  id: string;
  folderName: string;
  files: LevelPackFileEntry[];
  parsed: ParsedLevelPackResult;
}

function formatDateSafe(val: unknown, locale: string): string {
  if (!val) return "—";
  try {
    const d = new Date(String(val));
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// Helper récursif webkitGetAsEntry pour dossiers (résilient aux erreurs de lecture et fichiers cachés)
async function readEntryRecursively(
  entry: FileSystemEntry,
  path = "",
): Promise<Array<{ filename: string; path: string; file: File }>> {
  if (!entry || entry.name.startsWith(".") || entry.name.startsWith("__MACOSX")) {
    return [];
  }
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file(
        (f) => resolve([{ filename: f.name, path: path ? `${path}/${f.name}` : f.name, file: f }]),
        (err) => {
          console.warn("[readEntryRecursively] skip unreadable file", entry.name, err);
          resolve([]);
        },
      );
    });
  }
  if (!entry.isDirectory) return [];

  const reader = (entry as FileSystemDirectoryEntry).createReader();
  return new Promise((resolve) => {
    const acc: Array<{ filename: string; path: string; file: File }> = [];
    const readBatch = () => {
      reader.readEntries(
        async (entries) => {
          if (!entries || entries.length === 0) {
            resolve(acc);
            return;
          }
          try {
            const subResults = await Promise.all(
              entries.map((e) =>
                readEntryRecursively(e, path ? `${path}/${entry.name}` : entry.name),
              ),
            );
            acc.push(...subResults.flat());
            readBatch();
          } catch (err) {
            console.warn("[readEntryRecursively] batch error", err);
            resolve(acc);
          }
        },
        (err) => {
          console.warn("[readEntryRecursively] reader error", err);
          resolve(acc);
        },
      );
    };
    readBatch();
  });
}

function stagedPackToUserReport(staged: StagedPack, userId?: string | null): UserReport {
  const p = staged.parsed;
  const now = new Date().toISOString();
  const safeLevelCode = p.levelCode || `LEVEL_${p.level ?? 0}`;
  const safeScope = p.scope === "trans" ? "trans" : "intra";

  return {
    id: `preview-${staged.id}`,
    user_id: userId || "",
    slug: `preview-${safeLevelCode.toLowerCase()}-${Date.now()}`,
    title: p.title || "Diagnostic Clinique",
    glyph: p.glyph || "⚖️",
    tier: String(p.level ?? 0),
    orientation: safeScope === "intra" ? "Intra-Prisme" : "Trans-Prisme",
    tags: [safeLevelCode, p.prismCode || "MYSS"],
    content_md: p.packFiles?.rapport_md || "",
    level: p.level ?? 0,
    level_code: safeLevelCode,
    prism_code: p.prismCode || "MYSS",
    scope: safeScope,
    has_safeguard: Boolean(p.hasSafeguard),
    pack_files: p.packFiles || { rapport_md: "" },
    metadata: p.metadata || {},
    imported_by: null,
    created_at: now,
    updated_at: now,
    read_at: null,
  };
}

function AdminUserReportsView() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isFR = locale === "fr";

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const targetUserId = selectedIds[0];
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [stagedPacks, setStagedPacks] = useState<StagedPack[]>([]);
  const [previewReport, setPreviewReport] = useState<UserReport | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const refresh = useCallback(async () => {
    if (!targetUserId) {
      setReports([]);
      return;
    }
    setLoading(true);
    try {
      setReports(await listUserReports(targetUserId));
    } catch (e) {
      console.error("[AdminUserReports] refresh failed", e);
      toast({
        title: isFR ? "Erreur" : "Error",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [targetUserId, toast, isFR]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setStagedPacks([]);
  }, [targetUserId]);

  /**
   * Traitement et groupement des fichiers en packs de niveau
   */
  const processFilesIntoPacks = async (
    items: Array<{ filename: string; path: string; content: string }>,
  ) => {
    try {
      // Filtrer uniquement les .md
      const mdItems = items.filter((f) => /\.md$/i.test(f.filename));
      if (mdItems.length === 0) {
        toast({
          title: isFR ? "Aucun fichier Markdown" : "No Markdown files",
          description: isFR ? "Aucun fichier .md n'a été détecté." : "No .md files found.",
          variant: "destructive",
        });
        return;
      }

      // Regrouper par sous-dossier ou traiter comme pack global
      const groups: Record<string, LevelPackFileEntry[]> = {};

      for (const item of mdItems) {
        const parts = item.path.replace(/\\/g, "/").split("/");
        let groupName = "LEVEL_PACK";
        if (parts.length > 1) {
          // Le dossier parent immédiat ou racine (ex: LEVEL_2 ou BALANCE)
          groupName = parts[parts.length - 2] || parts[0];
        } else {
          // Fichier unitaire à la racine
          groupName = item.filename.replace(/\.md$/i, "");
        }
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push({
          filename: item.filename,
          content: item.content,
          relativePath: item.path,
        });
      }

      const nextPacks: StagedPack[] = [];
      for (const [folderName, files] of Object.entries(groups)) {
        const parsed = parseLevelPack(files, folderName);
        nextPacks.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          folderName,
          files,
          parsed,
        });
      }

      setStagedPacks((prev) => [...prev, ...nextPacks]);

      toast({
        title: isFR ? "Packs analysés" : "Packs parsed",
        description: isFR
          ? `${nextPacks.length} dossier(s) / pack(s) prêt(s) pour validation.`
          : `${nextPacks.length} pack(s) ready for validation.`,
      });
    } catch (err) {
      console.error("[AdminUserReports] processFilesIntoPacks error", err);
      toast({
        title: isFR ? "Erreur d'analyse" : "Parsing error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  /**
   * Extraction d'un fichier .zip via JSZip
   */
  const handleZipFile = async (file: File) => {
    try {
      const zip = await JSZip.loadAsync(file);
      const items: Array<{ filename: string; path: string; content: string }> = [];

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir && /\.md$/i.test(zipEntry.name) && !zipEntry.name.startsWith("__MACOSX")) {
          const content = await zipEntry.async("string");
          const name = zipEntry.name.split("/").pop() || zipEntry.name;
          items.push({ filename: name, path: relativePath, content });
        }
      }

      await processFilesIntoPacks(items);
    } catch (err) {
      console.error("[AdminUserReports] handleZipFile error", err);
      toast({
        title: isFR ? "Erreur ZIP" : "ZIP Error",
        description: isFR ? "Impossible de lire l'archive ZIP." : "Failed to parse ZIP archive.",
        variant: "destructive",
      });
    }
  };

  /**
   * Gestion du glisser-déposer universel (dossiers, zip, multi-md)
   */
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    try {
      const dt = e.dataTransfer;
      const items = dt.items;

      if (items && items.length > 0) {
        const rawEntries: Array<{ filename: string; path: string; file: File }> = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file") {
            const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
            if (entry) {
              const nested = await readEntryRecursively(entry);
              rawEntries.push(...nested);
            } else {
              const f = item.getAsFile();
              if (f) rawEntries.push({ filename: f.name, path: f.name, file: f });
            }
          }
        }

        // Traiter les archives ZIP séparément
        const zipEntries = rawEntries.filter((e) => /\.zip$/i.test(e.filename));
        for (const z of zipEntries) {
          await handleZipFile(z.file);
        }

        // Traiter les .md
        const textPromises = rawEntries
          .filter((e) => /\.md$/i.test(e.filename))
          .map(async (e) => ({
            filename: e.filename,
            path: e.path,
            content: await e.file.text(),
          }));

        const resolved = await Promise.all(textPromises);
        if (resolved.length > 0) {
          await processFilesIntoPacks(resolved);
        }
      } else if (dt.files && dt.files.length > 0) {
        await handleStandardFiles(dt.files);
      }
    } catch (err) {
      console.error("[AdminUserReports] handleDrop error", err);
      toast({
        title: isFR ? "Erreur de lecture" : "Read error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  /**
   * File input standard (sélection de fichiers ou dossiers)
   */
  const handleStandardFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const items: Array<{ filename: string; path: string; content: string }> = [];

      for (const f of Array.from(files)) {
        if (/\.zip$/i.test(f.name)) {
          await handleZipFile(f);
        } else if (/\.md$/i.test(f.name)) {
          const content = await f.text();
          const relativePath = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
          items.push({ filename: f.name, path: relativePath, content });
        }
      }

      if (items.length > 0) {
        await processFilesIntoPacks(items);
      }
    } catch (err) {
      console.error("[AdminUserReports] handleStandardFiles error", err);
      toast({
        title: isFR ? "Erreur de lecture" : "Read error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  /**
   * Confirmation & Envoi en base Supabase
   */
  const confirmImport = async () => {
    if (!targetUserId) {
      toast({
        title: isFR ? "Membre manquant" : "Member missing",
        description: isFR ? "Veuillez sélectionner un membre à l'étape 1 avant de publier." : "Please select a member before publishing.",
        variant: "destructive",
      });
      return;
    }
    if (stagedPacks.length === 0) return;

    setImporting(true);
    let ok = 0;
    let fail = 0;

    for (const staged of stagedPacks) {
      const p = staged.parsed;
      try {
        if (staged.files.length >= 2 || p.packFiles.resume_md || p.packFiles.graphique_md) {
          // Import V3.2 Pack enrichi
          await importUserReportV3Pack({
            userId: targetUserId,
            title: p.title || "Diagnostic Clinique",
            glyph: p.glyph || "⚖️",
            tier: String(p.level ?? 0),
            orientation: (p.scope || "intra") === "intra" ? "Intra-Prisme" : "Trans-Prisme",
            level: p.level ?? 0,
            levelCode: p.levelCode || "LEVEL_0",
            prismCode: p.prismCode || "MYSS",
            scope: p.scope || "intra",
            hasSafeguard: Boolean(p.hasSafeguard),
            packFiles: p.packFiles || { rapport_md: "" },
            metadata: p.metadata || {},
            tags: [p.levelCode || "LEVEL_0", p.prismCode || "MYSS"],
            importedBy: user?.id ?? null,
          });
        } else {
          // Mode Legacy monocanal
          await importUserReport({
            userId: targetUserId,
            filename: staged.files[0]?.filename || `${p.levelCode || "LEVEL_0"}.md`,
            contentMd: p.packFiles.rapport_md || "",
            importedBy: user?.id ?? null,
          });
        }
        ok++;
      } catch (err) {
        console.error("[AdminUserReports] import row error", err);
        fail++;
      }
    }

    setImporting(false);
    setStagedPacks([]);
    await refresh();

    if (ok > 0) {
      toast({
        title: isFR ? "Importation réussie" : "Import successful",
        description: isFR
          ? `${ok} dossier(s) clinique(s) publié(s) pour le membre.`
          : `${ok} report(s) published.`,
      });
    }
    if (fail > 0) {
      toast({
        title: isFR ? "Avertissement" : "Warning",
        description: isFR ? `${fail} dossier(s) n'ont pas pu être importés.` : `${fail} dossier(s) failed.`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isFR ? "Supprimer ce dossier clinique ?" : "Delete this clinical report?")) {
      return;
    }
    try {
      await deleteUserReport(id);
      toast({
        title: isFR ? "Dossier supprimé" : "Report deleted",
      });
      await refresh();
    } catch (e) {
      console.error("[AdminUserReports] delete failed", e);
      toast({
        title: isFR ? "Erreur" : "Error",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-16">
      {/* HEADER */}
      <header className="space-y-2 border-b border-border/40 pb-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-display text-[10px] tracking-widest uppercase px-2 py-0.5">
            AEGIS V3.2 STANDARD
          </Badge>
          <span className="text-xs text-muted-foreground uppercase tracking-widest">
            {isFR ? "Ingestion Clinique" : "Clinical Ingestor"}
          </span>
        </div>
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl font-cormorant-display">
          {isFR ? "Pack Ingestor Clinique & Dossiers V3.2" : "Clinical Pack Ingestor & V3.2 Dossiers"}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {isFR
            ? "Dépose un dossier de niveau (ex: LEVEL_2/ ou ⚖️ BALANCE/), une archive .ZIP ou des fichiers .MD. Le système valide automatiquement les quotas, le safeguard et compile les graphes Mermaid."
            : "Drop a level folder (e.g. LEVEL_2/ or ⚖️ BALANCE/), a .ZIP archive or .MD files. The system checks quotas, safeguards and compiles Mermaid diagrams."}
        </p>
      </header>

      {/* SÉLECTEUR MEMBRE & ZONE DE DROP */}
      <div className="rounded-2xl border border-border/30 bg-card/40 p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-display">
              {isFR ? "1. Membre / Patient Cible" : "1. Target Member / Patient"}
            </p>
            {targetUserId ? (
              <span className="text-[11px] text-emerald-400 font-display uppercase tracking-wider flex items-center gap-1">
                <Check size={12} />
                {isFR ? "Membre sélectionné" : "Member selected"}
              </span>
            ) : (
              <span className="text-[11px] text-amber-400 font-display uppercase tracking-wider">
                {isFR ? "Sélection requise pour publier" : "Selection required to publish"}
              </span>
            )}
          </div>
          <UserPicker
            selected={selectedIds}
            onChange={(ids) => setSelectedIds(ids.slice(-1))}
          />
        </div>

        {/* DROPZONE UNIVERSELLE : TOUJOURS ACCESSIBLE */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-display">
              {isFR ? "2. Fichiers Cliniques & Dossiers" : "2. Clinical Files & Dossiers"}
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl px-6 py-10 transition-all text-center",
              isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-border/40 hover:border-primary/50 hover:bg-background/40",
            )}
          >
            <div className="flex items-center gap-3 text-primary">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-xl">
                <FolderArchive size={24} />
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-base font-medium text-foreground">
                {isFR
                  ? "Glisse un dossier LEVEL_X, un dossier Myss, une archive .ZIP ou des .MD"
                  : "Drop a LEVEL_X folder, Myss folder, .ZIP archive or .MD files"}
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {isFR
                  ? "Détection universelle : packs 5 fichiers V3.2, cartographies d'archétypes Myss, ou diagnostics unitaires."
                  : "Universal support: V3.2 5-file packs, Myss archetype cartography, or individual diagnostics."}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild className="gap-2 text-xs">
                  <span>
                    <Upload size={14} />
                    {isFR ? "Fichiers .MD ou .ZIP" : "MD or ZIP Files"}
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".md,text/markdown,.zip,application/zip"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void handleStandardFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>

              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild className="gap-2 text-xs">
                  <span>
                    <Folder size={14} />
                    {isFR ? "Sélectionner un dossier" : "Select folder"}
                  </span>
                </Button>
                <input
                  type="file"
                  // @ts-expect-error webkitdirectory
                  webkitdirectory=""
                  directory=""
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void handleStandardFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* TABLEAU DE STAGING V3.2 AVEC BADGES DE CONFORMITÉ */}
      {stagedPacks.length > 0 ? (
        <div className="rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/10 to-transparent p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-primary/20 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <h3 className="font-cormorant-display text-xl text-foreground">
                  {isFR ? "Validation & Staging des Packs V3.2" : "V3.2 Pack Staging & Validation"}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {isFR
                  ? "Vérifie les critères cliniques avant la publication officielle."
                  : "Check clinical compliance before final publication."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStagedPacks([])}
                disabled={importing}
                className="text-xs"
              >
                <X size={14} className="mr-1" />
                {isFR ? "Vider la file" : "Discard all"}
              </Button>
              <Button
                size="sm"
                onClick={() => void confirmImport()}
                disabled={importing || !targetUserId}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-md"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Check size={14} className="mr-1.5" />
                )}
                {targetUserId
                  ? isFR
                    ? `Publier pour le membre (${stagedPacks.length})`
                    : `Publish to member (${stagedPacks.length})`
                  : isFR
                    ? "Sélectionner un membre pour publier"
                    : "Select a member to publish"}
              </Button>
            </div>
          </div>

          {!targetUserId && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400 shrink-0" />
              <span>
                {isFR
                  ? "Attention : Choisis un membre à l'étape 1 ci-dessus pour activer le bouton de publication."
                  : "Note: Pick a member above in step 1 to enable the publish button."}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {stagedPacks.map((staged, idx) => {
              const p = staged.parsed;
              const preview = stagedPackToUserReport(staged, targetUserId);

              return (
                <div
                  key={staged.id}
                  className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3 transition-all hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl">
                        {p.glyph || "⚖️"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-primary/20 text-primary border-primary/40 text-[10px] uppercase font-display">
                            {p.levelCode || "LEVEL_0"} · {(p.scope || "intra").toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="border-white/15 text-[10px] uppercase font-display">
                            PRISME {p.prismCode || "MYSS"}
                          </Badge>
                          {p.hasSafeguard ? (
                            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px] uppercase font-display flex items-center gap-1">
                              <ShieldCheck size={11} />
                              Safeguard Validé
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] uppercase font-display flex items-center gap-1">
                              <AlertTriangle size={11} />
                              Safeguard Manquant
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-cormorant-display text-xl text-foreground font-medium mt-1">
                          {p.title || "Diagnostic Clinique"}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewReport(preview)}
                        className="text-xs gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <Eye size={14} />
                        {isFR ? "Aperçu 5 Onglets" : "5-Pillar Preview"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setStagedPacks((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>

                  {/* Badges de contrôle des 5 fichiers */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/5 text-[11px]">
                    <div className={cn("p-2 rounded-lg border", p.packFiles?.rapport_md ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-red-500/30 bg-red-500/5 text-red-300")}>
                      <span className="block font-display text-[9px] uppercase tracking-wider text-muted-foreground">00. Rapport</span>
                      <span>{p.packFiles?.rapport_md ? "✓ Présent" : "✗ Manquant"}</span>
                    </div>

                    <div className={cn("p-2 rounded-lg border", p.packFiles?.resume_md ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-white/10 bg-white/5 text-muted-foreground")}>
                      <span className="block font-display text-[9px] uppercase tracking-wider text-muted-foreground">01. Synthèse</span>
                      <span>{p.packFiles?.resume_md ? "✓ Présent" : "Optionnel"}</span>
                    </div>

                    <div className={cn("p-2 rounded-lg border", p.packFiles?.bullet_points_md ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-white/10 bg-white/5 text-muted-foreground")}>
                      <span className="block font-display text-[9px] uppercase tracking-wider text-muted-foreground">02. Leviers</span>
                      <span>{p.packFiles?.bullet_points_md ? "✓ Présent" : "Optionnel"}</span>
                    </div>

                    <div className={cn("p-2 rounded-lg border", p.packFiles?.graphique_md ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-white/10 bg-white/5 text-muted-foreground")}>
                      <span className="block font-display text-[9px] uppercase tracking-wider text-muted-foreground">03. Graphes</span>
                      <span>{(p.metadata?.detected_diagrams_count ?? 0) > 0 ? `✓ ${p.metadata?.detected_diagrams_count} diagramme(s)` : "Optionnel"}</span>
                    </div>

                    <div className={cn("p-2 rounded-lg border", p.packFiles?.prompt_ai_md ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-white/10 bg-white/5 text-muted-foreground")}>
                      <span className="block font-display text-[9px] uppercase tracking-wider text-muted-foreground">04. Prompt IA</span>
                      <span>{p.packFiles?.prompt_ai_md ? `✓ ~${p.metadata?.estimated_tokens ?? 0} tok.` : "Optionnel"}</span>
                    </div>
                  </div>

                  {/* Barre d'état métriques / quotas */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>
                      {isFR ? "Volume total :" : "Total chars:"}{" "}
                      <strong className={p.quotaCheck?.passed ? "text-emerald-400" : "text-amber-400"}>
                        {(p.quotaCheck?.actualChars ?? 0).toLocaleString(isFR ? "fr-FR" : "en-US")}
                      </strong>{" "}
                      / {(p.quotaCheck?.requiredMinChars ?? 20000).toLocaleString(isFR ? "fr-FR" : "en-US")} car. min
                    </span>

                    <span>
                      {(p.sectionPairs || []).length} section(s) miroir détectée(s)
                    </span>
                  </div>

                  {(p.warnings || []).length > 0 ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-xs text-amber-200/90 space-y-1">
                      {(p.warnings || []).map((w, wi) => (
                        <p key={wi} className="flex items-center gap-1.5">
                          <AlertTriangle size={13} className="shrink-0 text-amber-400" />
                          {w}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* RAPPORTS EXISTANTS DU MEMBRE */}
      {targetUserId ? (
        <div className="rounded-2xl border border-border/30 bg-card/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-cormorant-display text-2xl text-foreground">
              {isFR ? "Dossiers Cliniques Publiés" : "Published Clinical Dossiers"}
            </h3>
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : null}
          </div>

          {reports.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">
              {isFR ? "Aucun dossier clinique pour ce membre." : "No clinical dossiers for this member."}
            </p>
          ) : (
            <ul className="divide-y divide-border/20">
              {reports.map((r) => {
                const levelCode = r.level_code || (r.tier ? `LEVEL_${r.tier}` : null);
                const hasPack = Boolean(r.pack_files);

                return (
                  <li key={r.id} className="flex items-center gap-3 py-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg">
                      {r.glyph || <FileText size={18} className="text-primary" />}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-base text-foreground font-cormorant-display font-medium truncate">
                          {r.title || "Diagnostic Clinique"}
                        </p>
                        {levelCode && (
                          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[9px] uppercase px-1.5 py-0">
                            {levelCode}
                          </Badge>
                        )}
                        {hasPack && (
                          <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-300 text-[9px] uppercase px-1.5 py-0">
                            Pack 5
                          </Badge>
                        )}
                        {r.has_safeguard && (
                          <span className="text-amber-400 flex items-center gap-0.5 text-[10px]" title="Safeguard Validé">
                            <ShieldCheck size={12} />
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
                        {r.slug || "dossier"} · {formatDateSafe(r.updated_at || r.created_at, isFR ? "fr" : "en")}
                        {r.orientation ? ` · ${r.orientation}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {r.read_at ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-400">
                          <Check size={10} />
                          {isFR ? "Lu" : "Read"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-400">
                          {isFR ? "Non lu" : "Unread"}
                        </span>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewReport(r)}
                        className="text-xs gap-1 h-8"
                      >
                        <Eye size={14} />
                        {isFR ? "Consulter" : "Inspect"}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void handleDelete(r.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label={isFR ? "Supprimer" : "Delete"}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {/* LECTEUR CLINIQUE 5 PILIERS POUR L'ADMIN & PRÉVISUALISATION */}
      <UserReportModal
        report={previewReport}
        open={previewReport !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewReport(null);
        }}
      />
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AdminUserReportsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("[AdminUserReportsErrorBoundary] caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-destructive/40 bg-destructive/10 p-6 space-y-4 my-8 text-center">
          <div className="flex justify-center text-destructive">
            <AlertTriangle size={36} />
          </div>
          <h3 className="font-cormorant-display text-2xl text-foreground font-medium">
            Une erreur est survenue lors du chargement des rapports
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {this.state.error?.message || "Erreur inattendue dans l'interface de gestion."}
          </p>
          <Button onClick={this.handleReset} variant="outline" className="gap-2">
            <RotateCcw size={15} />
            Réinitialiser le module
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminUserReports() {
  return (
    <AdminUserReportsErrorBoundary>
      <AdminUserReportsView />
    </AdminUserReportsErrorBoundary>
  );
}

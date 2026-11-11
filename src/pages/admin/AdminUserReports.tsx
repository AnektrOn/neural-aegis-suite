import { useEffect, useState, useCallback, useMemo } from "react";
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
import { parseFrontmatter } from "@/features/user-reports/parseReportMd";
import {
  parseLevelPack,
  type ParsedLevelPackResult,
  type LevelPackFileEntry,
} from "@/features/user-reports/utils/parseLevelPack";
import { UserReportModal } from "@/features/user-reports/UserReportModal";

interface StagedPack {
  id: string;
  folderName: string;
  files: LevelPackFileEntry[];
  parsed: ParsedLevelPackResult;
}

// Helper récursif webkitGetAsEntry pour dossiers
async function readEntryRecursively(
  entry: FileSystemEntry,
  path = "",
): Promise<Array<{ filename: string; path: string; file: File }>> {
  if (entry.isFile) {
    return new Promise((resolve, reject) => {
      (entry as FileSystemFileEntry).file(
        (f) => resolve([{ filename: f.name, path: path ? `${path}/${f.name}` : f.name, file: f }]),
        reject,
      );
    });
  }
  if (!entry.isDirectory) return [];

  const reader = (entry as FileSystemDirectoryEntry).createReader();
  return new Promise((resolve, reject) => {
    const acc: Array<{ filename: string; path: string; file: File }> = [];
    const readBatch = () => {
      reader.readEntries(async (entries) => {
        if (entries.length === 0) {
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
          reject(err);
        }
      }, reject);
    };
    readBatch();
  });
}

function stagedPackToUserReport(staged: StagedPack, userId: string): UserReport {
  const p = staged.parsed;
  const now = new Date().toISOString();
  return {
    id: `preview-${staged.id}`,
    user_id: userId,
    slug: `preview-${p.levelCode.toLowerCase()}-${Date.now()}`,
    title: p.title,
    glyph: p.glyph,
    tier: String(p.level),
    orientation: p.scope === "intra" ? "Intra-Prisme" : "Trans-Prisme",
    tags: [p.levelCode, p.prismCode],
    content_md: p.packFiles.rapport_md,
    level: p.level,
    level_code: p.levelCode,
    prism_code: p.prismCode,
    scope: p.scope,
    has_safeguard: p.hasSafeguard,
    pack_files: p.packFiles,
    metadata: p.metadata,
    imported_by: null,
    created_at: now,
    updated_at: now,
    read_at: null,
  };
}

export default function AdminUserReports() {
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
      console.error(e);
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
    // Filtrer uniquement les .md
    const mdItems = items.filter((f) => /\.md$/i.test(f.filename));
    if (mdItems.length === 0) return;

    // Regrouper par sous-dossier ou traiter comme pack global
    const groups: Record<string, LevelPackFileEntry[]> = {};

    for (const item of mdItems) {
      const parts = item.path.replace(/\\/g, "/").split("/");
      let groupName = "LEVEL_PACK";
      if (parts.length > 1) {
        // Le dossier parent immédiat ou racine (ex: LEVEL_2)
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
      toast({
        title: isFR ? "Archive ZIP analysée" : "ZIP archive parsed",
        description: isFR
          ? `${items.length} fichier(s) markdown détecté(s).`
          : `${items.length} markdown file(s) found.`,
      });
    } catch (err) {
      console.error(err);
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
    if (!targetUserId) return;

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
      void handleStandardFiles(dt.files);
    }
  };

  /**
   * File input standard
   */
  const handleStandardFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !targetUserId) return;
    const items: Array<{ filename: string; path: string; content: string }> = [];

    for (const f of Array.from(files)) {
      if (/\.zip$/i.test(f.name)) {
        await handleZipFile(f);
      } else if (/\.md$/i.test(f.name)) {
        const content = await f.text();
        items.push({ filename: f.name, path: f.name, content });
      }
    }

    if (items.length > 0) {
      await processFilesIntoPacks(items);
    }
  };

  /**
   * Confirmation & Envoi en base Supabase
   */
  const confirmImport = async () => {
    if (!targetUserId || stagedPacks.length === 0) return;
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
            title: p.title,
            glyph: p.glyph,
            tier: String(p.level),
            orientation: p.scope === "intra" ? "Intra-Prisme" : "Trans-Prisme",
            level: p.level,
            levelCode: p.levelCode,
            prismCode: p.prismCode,
            scope: p.scope,
            hasSafeguard: p.hasSafeguard,
            packFiles: p.packFiles,
            metadata: p.metadata,
            tags: [p.levelCode, p.prismCode],
            importedBy: user?.id ?? null,
          });
        } else {
          // Mode Legacy monocanal
          await importUserReport({
            userId: targetUserId,
            filename: staged.files[0]?.filename || `${p.levelCode}.md`,
            contentMd: p.packFiles.rapport_md,
            importedBy: user?.id ?? null,
          });
        }
        ok++;
      } catch (err) {
        console.error("[AdminUserReports] import failed", staged.folderName, err);
        fail++;
      }
    }

    setImporting(false);
    setStagedPacks([]);
    toast({
      title: isFR ? "Publication effectuée" : "Reports published",
      description: isFR
        ? `${ok} pack(s) clinique(s) publié(s) pour le membre${fail ? `, ${fail} échec(s)` : ""}.`
        : `${ok} clinical pack(s) published${fail ? `, ${fail} failed` : ""}.`,
    });
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isFR ? "Supprimer ce rapport ?" : "Delete this report?")) return;
    try {
      await deleteUserReport(id);
      await refresh();
      toast({
        title: isFR ? "Rapport supprimé" : "Report deleted",
      });
    } catch (e) {
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
            ? "Dépose un dossier de niveau (ex: LEVEL_2/) ou un fichier .ZIP contenant les 5 fichiers standardisés. Le système valide automatiquement les quotas, le safeguard et compile les graphes Mermaid."
            : "Drop a level folder (e.g. LEVEL_2/) or a .ZIP file containing the 5 standardized files. The system checks quotas, safeguards and compiles Mermaid diagrams."}
        </p>
      </header>

      {/* SÉLECTEUR MEMBRE & ZONE DE DROP */}
      <div className="rounded-2xl border border-border/30 bg-card/40 p-5 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-display">
            {isFR ? "Membre / Patient Cible" : "Target Member / Patient"}
          </p>
          <UserPicker
            selected={selectedIds}
            onChange={(ids) => setSelectedIds(ids.slice(-1))}
          />
        </div>

        {targetUserId ? (
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
                  ? "Glisse un dossier LEVEL_X, une archive .ZIP ou des fichiers .MD"
                  : "Drop a LEVEL_X folder, .ZIP archive or .MD files"}
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {isFR
                  ? "Reconnaissance automatique : 00_RAPPORT, 01_RESUME, 02_BULLET_POINTS, 03_GRAPHIQUE, 04_PROMPT_AI."
                  : "Automatic detection of all 5 clinical files and epistemic safeguards."}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild className="gap-2 text-xs">
                  <span>
                    <Upload size={14} />
                    {isFR ? "Parcourir des fichiers / ZIP" : "Browse files / ZIP"}
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
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isFR ? "Sélectionne un utilisateur pour activer l'ingestion." : "Pick a user to activate ingestion."}
          </p>
        )}
      </div>

      {/* TABLEAU DE STAGING V3.2 AVEC BADGES DE CONFORMITÉ */}
      {targetUserId && stagedPacks.length > 0 ? (
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
                disabled={importing}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-md"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Check size={14} className="mr-1.5" />
                )}
                {isFR
                  ? `Publier pour le membre (${stagedPacks.length})`
                  : `Publish to member (${stagedPacks.length})`}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {stagedPacks.map((staged, idx) => {
              const p = staged.parsed;
              const preview = stagedPackToUserReport(staged, targetUserId);
              const filesCount = staged.files.length;
              const has5Files =
                filesCount >= 5 ||
                Boolean(p.packFiles.resume_md && p.packFiles.bullet_points_md && p.packFiles.graphique_md && p.packFiles.prompt_ai_md);

              return (
                <div
                  key={staged.id}
                  className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3 transition-all hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl">
                        {p.glyph}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-primary/20 text-primary border-primary/40 text-[10px] uppercase font-display">
                            {p.levelCode} · {p.scope.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="border-white/15 text-[10px] uppercase font-display">
                            PRISME {p.prismCode}
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
                          {p.title}
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
                    <div className={cn("p-2 rounded-lg border", p.packFiles.rapport_md ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-red-500/30 bg-red-500/5 text-red-300")}>
                      <span className="block font-display text-[9px] uppercase tracking-wider text-muted-foreground">00. Rapport</span>
                      <span>{p.packFiles.rapport_md ? "✓ Présent" : "✗ Manquant"}</span>
                    </div>

                    <div className={cn("p-2 rounded-lg border", p.packFiles.resume_md ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-white/10 bg-white/5 text-muted-foreground")}>
                      <span className="block font-display text-[9px] uppercase tracking-wider text-muted-foreground">01. Synthèse</span>
                      <span>{p.packFiles.resume_md ? "✓ Présent" : "Optionnel"}</span>
                    </div>

                    <div className={cn("p-2 rounded-lg border", p.packFiles.bullet_points_md ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-white/10 bg-white/5 text-muted-foreground")}>
                      <span className="block font-display text-[9px] uppercase tracking-wider text-muted-foreground">02. Leviers</span>
                      <span>{p.packFiles.bullet_points_md ? "✓ Présent" : "Optionnel"}</span>
                    </div>

                    <div className={cn("p-2 rounded-lg border", p.packFiles.graphique_md ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-white/10 bg-white/5 text-muted-foreground")}>
                      <span className="block font-display text-[9px] uppercase tracking-wider text-muted-foreground">03. Graphes</span>
                      <span>{p.metadata.detected_diagrams_count ? `✓ ${p.metadata.detected_diagrams_count} diagramme(s)` : "Optionnel"}</span>
                    </div>

                    <div className={cn("p-2 rounded-lg border", p.packFiles.prompt_ai_md ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-white/10 bg-white/5 text-muted-foreground")}>
                      <span className="block font-display text-[9px] uppercase tracking-wider text-muted-foreground">04. Prompt IA</span>
                      <span>{p.packFiles.prompt_ai_md ? `✓ ~${p.metadata.estimated_tokens} tok.` : "Optionnel"}</span>
                    </div>
                  </div>

                  {/* Barre d'état métriques / quotas */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>
                      {isFR ? "Volume total :" : "Total chars:"}{" "}
                      <strong className={p.quotaCheck.passed ? "text-emerald-400" : "text-amber-400"}>
                        {p.quotaCheck.actualChars.toLocaleString(isFR ? "fr-FR" : "en-US")}
                      </strong>{" "}
                      / {p.quotaCheck.requiredMinChars.toLocaleString(isFR ? "fr-FR" : "en-US")} car. min
                    </span>

                    <span>
                      {p.sectionPairs.length} section(s) miroir détectée(s)
                    </span>
                  </div>

                  {p.warnings.length > 0 ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-xs text-amber-200/90 space-y-1">
                      {p.warnings.map((w, wi) => (
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
                          {r.title}
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
                        {r.slug} · {new Date(r.updated_at).toLocaleDateString(isFR ? "fr-FR" : "en-US", { day: "2-digit", month: "short", year: "numeric" })}
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

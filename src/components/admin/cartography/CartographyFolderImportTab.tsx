import { useCallback, useState } from "react";
import { FolderOpen, FileArchive, Loader2, Upload, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  previewCartographyFolder,
  readFolderFromFileList,
  readZipFile,
  basename,
  type FolderImportPreview,
} from "@/lib/cartography-folder-import";
import { importCartographyFolder } from "@/services/cartographyService";
import {
  ToolboxEmptyState,
  ToolboxPanel,
  toolboxFieldClass,
  toolboxLabelClass,
} from "@/components/admin/toolbox/ToolboxAdminUi";

interface Profile {
  id: string;
  display_name: string | null;
}

interface CartographyFolderImportTabProps {
  profiles: Profile[];
  onImported: () => void;
}

const MYSS_TREE = `Myss/
  2026-05/
    ⚖️ BALANCE/   → 7 fichiers
    🌑 SHADOW/    → 7 fichiers
    🌕 LIGHT/     → 7 fichiers
  (Echols/ est ignoré automatiquement)`;

export default function CartographyFolderImportTab({
  profiles,
  onImported,
}: CartographyFolderImportTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  const [selectedUserId, setSelectedUserId] = useState("");
  const [publishOnImport, setPublishOnImport] = useState(true);
  const [preview, setPreview] = useState<FolderImportPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const effectiveUserId = preview?.manifest?.user_id || selectedUserId;

  const runPreview = useCallback(async (entries: Array<{ path: string; content: string }>) => {
    setLoadingPreview(true);
    try {
      setPreview(previewCartographyFolder(entries, { mode: "analyse" }));
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  const onFolderPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    await runPreview(await readFolderFromFileList(list));
    e.target.value = "";
  };

  const onZipPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingPreview(true);
    try {
      await runPreview(await readZipFile(file));
    } catch (err) {
      toast({
        title: isFR ? "Erreur" : "Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
      e.target.value = "";
    }
  };

  const blockingIssues = preview?.issues.filter((i) => i.path === "(import)") ?? [];
  const canImport =
    Boolean(effectiveUserId) &&
    (preview?.files.length ?? 0) > 0 &&
    blockingIssues.length === 0;

  const handleImport = async () => {
    if (!user || !preview || !canImport) return;
    setSubmitting(true);
    try {
      const result = await importCartographyFolder({
        createdBy: user.id,
        manifest: preview.manifest
          ? { ...preview.manifest, user_id: effectiveUserId! }
          : { user_id: effectiveUserId!, publish: publishOnImport },
        files: preview.files,
        defaultUserId: selectedUserId,
        publish: publishOnImport,
      });
      toast({
        title: isFR ? "Import terminé" : "Import done",
        description: isFR
          ? `${result.bundlesUpserted} rapports (Balance, Ombre, Lumière) · ${result.sectionsUpserted} fichiers.`
          : `${result.bundlesUpserted} reports, ${result.sectionsUpserted} files.`,
      });
      setPreview(null);
      onImported();
    } catch (err) {
      toast({
        title: isFR ? "Échec" : "Failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToolboxPanel
        title={isFR ? "Votre dossier Myss — sans rien renommer" : "Your Myss folder — no renaming"}
        description={
          isFR
            ? "Zippez ou sélectionnez le dossier parent. Seul Myss/ est importé ; Echols/ est ignoré."
            : "Zip or select the parent folder. Only Myss/ is imported; Echols/ is skipped."
        }
      >
        <pre className="overflow-x-auto rounded-lg border border-border-subtle/60 bg-black/20 p-4 text-xs leading-relaxed text-text-secondary whitespace-pre">
          {MYSS_TREE}
        </pre>
        <ul className="mt-4 space-y-1 text-xs text-text-tertiary">
          <li>00-Cartographie_Integrale… → onglet Cartographie</li>
          <li>GLOBAL-MYSS-ANALYSE… → Synthèse globale</li>
          <li>P01·ARC… à P05·INT… → Rapports détaillés</li>
        </ul>
      </ToolboxPanel>

      <ToolboxPanel title={isFR ? "1. Utilisateur" : "1. User"}>
        <label className="block max-w-md">
          <span className={toolboxLabelClass}>{isFR ? "Pour qui ?" : "For whom?"}</span>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className={cn(toolboxFieldClass, "mt-1.5 w-full")}
          >
            <option value="">{isFR ? "— Choisir (ex. note) —" : "— Select user —"}</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || p.id.slice(0, 8) + "…"}
              </option>
            ))}
          </select>
        </label>
      </ToolboxPanel>

      <ToolboxPanel title={isFR ? "2. Déposer le zip ou le dossier" : "2. Drop zip or folder"}>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[hsl(var(--aegis-warm)/0.35)] bg-[hsl(var(--aegis-warm-muted)/0.3)] px-4 py-2 text-sm font-medium text-[hsl(var(--aegis-warm))]">
            <FileArchive size={16} strokeWidth={1.5} aria-hidden />
            {isFR ? "Choisir un .zip" : "Choose .zip"}
            <input type="file" accept=".zip,application/zip" className="sr-only" onChange={onZipPick} />
          </label>
          <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-border-subtle bg-white/[0.04] px-4 py-2 text-sm">
            <FolderOpen size={16} strokeWidth={1.5} aria-hidden />
            {isFR ? "Choisir le dossier" : "Choose folder"}
            <input
              type="file"
              className="sr-only"
              // @ts-expect-error webkitdirectory
              webkitdirectory=""
              directory=""
              multiple
              onChange={onFolderPick}
            />
          </label>
        </div>

        <label className="mt-4 flex min-h-[44px] items-center gap-3">
          <input
            type="checkbox"
            checked={publishOnImport}
            onChange={(e) => setPublishOnImport(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-sm text-text-primary">
            {isFR ? "Publier tout de suite (recommandé)" : "Publish immediately (recommended)"}
          </span>
        </label>
      </ToolboxPanel>

      {loadingPreview && (
        <div className="flex justify-center gap-2 py-6 text-text-tertiary">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          {isFR ? "Lecture…" : "Reading…"}
        </div>
      )}

      {preview && !loadingPreview && (
        <ToolboxPanel title={isFR ? "3. Importer" : "3. Import"}>
          {preview.myssLayout && (
            <p className="mb-3 text-sm text-success">
              {isFR
                ? `Format Myss détecté — ${preview.files.length} fichier(s), ${preview.bundleKeys.length} rapport(s) : ${preview.bundleKeys.join(", ")}`
                : `Myss layout — ${preview.files.length} files`}
              {preview.skippedOutsideMyss > 0 &&
                (isFR
                  ? ` · ${preview.skippedOutsideMyss} fichier(s) hors Myss ignoré(s) (ex. Echols)`
                  : ` · ${preview.skippedOutsideMyss} skipped outside Myss`)}
            </p>
          )}

          {blockingIssues.map((issue, i) => (
            <p key={i} className="mb-2 text-sm text-destructive">
              {issue.message}
            </p>
          ))}

          <ul className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-border-subtle/50 bg-black/10 p-3 text-xs text-text-secondary space-y-0.5">
            {preview.files.map((f) => (
              <li key={f.relativePath}>
                ✓ {basename(f.relativePath)}
                <span className="text-text-tertiary">
                  {" "}
                  → {f.pole} / {f.sectionKey}
                  {f.reportCode ? ` (${f.reportCode})` : ""}
                </span>
              </li>
            ))}
          </ul>

          <Button className="gap-2" disabled={!canImport || submitting} onClick={handleImport}>
            {submitting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <Upload size={16} strokeWidth={1.5} aria-hidden />
            )}
            {isFR ? "Importer les 3 pôles (Myss)" : "Import Myss (3 poles)"}
          </Button>

          {!selectedUserId && (
            <p className="mt-2 text-xs text-destructive">
              {isFR ? "Choisissez l'utilisateur à l'étape 1." : "Select user in step 1."}
            </p>
          )}
        </ToolboxPanel>
      )}

      {!preview && !loadingPreview && (
        <ToolboxEmptyState
          icon={CheckCircle2}
          title={isFR ? "Prêt" : "Ready"}
          hint={
            isFR
              ? "Utilisateur + zip du dossier parent (avec Myss/ dedans)."
              : "User + zip of parent folder (containing Myss/)."
          }
        />
      )}
    </div>
  );
}

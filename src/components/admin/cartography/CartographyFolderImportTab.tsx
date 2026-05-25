import { useCallback, useState } from "react";
import { FolderOpen, FileArchive, Loader2, Upload, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalysisMode } from "@/lib/archetype-cartography/types";
import {
  previewCartographyFolder,
  readFolderFromFileList,
  readZipFile,
  basename,
  type FolderImportPreview,
} from "@/lib/cartography-folder-import";
import {
  importCartographyFolder,
  resolveCartographyTargetUserId,
} from "@/services/cartographyService";
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

const IMPORT_TREE = `analysis/                → mode Analyse
  Myss/
    2026-05/
      ⚖️ BALANCE/   → 7 fichiers
      🌑 SHADOW/    → 7 fichiers
      🌕 LIGHT/     → 7 fichiers

high-res/                → mode Clinique
  Myss/
    2026-05/
      ⚖️ BALANCE/   → 7 fichiers
      🌑 SHADOW/
      🌕 LIGHT/

Ou zip un seul des deux + sélection du mode`;

export default function CartographyFolderImportTab({
  profiles,
  onImported,
}: CartographyFolderImportTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  const [selectedUserId, setSelectedUserId] = useState("");
  const [importMode, setImportMode] = useState<AnalysisMode>("analyse");
  const [publishOnImport, setPublishOnImport] = useState(true);
  const [preview, setPreview] = useState<FolderImportPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const effectiveUserId = resolveCartographyTargetUserId(preview?.manifest ?? null, selectedUserId);
  const selectedProfile = profiles.find((p) => p.id === selectedUserId);

  const runPreview = useCallback(
    async (entries: Array<{ path: string; content: string }>) => {
      setLoadingPreview(true);
      try {
        setPreview(previewCartographyFolder(entries, { mode: importMode }));
      } finally {
        setLoadingPreview(false);
      }
    },
    [importMode],
  );

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
        manifest: {
          ...(preview.manifest ?? {}),
          user_id: effectiveUserId!,
          publish: publishOnImport,
          meta: {
            ...(preview.manifest?.meta ?? {}),
            user_value:
              (preview.manifest?.meta?.user_value as string | undefined) ??
              selectedProfile?.display_name ??
              undefined,
          },
        },
        files: preview.files,
        defaultUserId: effectiveUserId!,
        publish: publishOnImport,
      });
      toast({
        title: isFR ? "Import terminé" : "Import done",
        description: isFR
          ? `Lié à ${selectedProfile?.display_name ?? effectiveUserId}. ${result.bundlesUpserted} rapports · ${result.sectionsUpserted} fichiers. Le client doit se connecter avec CE compte.`
          : `Linked to ${selectedProfile?.display_name ?? effectiveUserId}. ${result.bundlesUpserted} reports.`,
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
        title={isFR ? "Structure des dossiers" : "Folder structure"}
        description={
          isFR
            ? "analysis/Myss/ → analyse · high-res/Myss/ → clinique. Ou zippez un seul et choisissez le mode."
            : "analysis/Myss/ → analysis · high-res/Myss/ → clinical. Or zip one and select the mode."
        }
      >
        <pre className="overflow-x-auto rounded-lg border border-border-subtle/60 bg-black/20 p-4 text-xs leading-relaxed text-text-secondary whitespace-pre">
          {IMPORT_TREE}
        </pre>
        <ul className="mt-4 space-y-1 text-xs text-text-tertiary">
          <li>
            <strong>analysis/Myss</strong> : 00-Cartographie… · GLOBAL-MYSS… · P01·ARC… → P05
          </li>
          <li>
            <strong>high-res/Myss</strong> : mêmes noms de fichiers → mode clinique
          </li>
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

      <ToolboxPanel title={isFR ? "2. Mode d'import" : "2. Import mode"}>
        <div className="flex gap-2">
          {(["analyse", "clinique"] as const).map((m) => {
            const active = importMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setImportMode(m);
                  setPreview(null);
                }}
                className={cn(
                  "flex-1 min-h-[44px] rounded-lg border px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? m === "analyse"
                      ? "border-[hsl(var(--aegis-warm)/0.5)] bg-[hsl(var(--aegis-warm-muted)/0.4)] text-[hsl(var(--aegis-warm))]"
                      : "border-[hsl(var(--neural-accent)/0.5)] bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--neural-accent))]"
                    : "border-border-subtle/50 bg-white/[0.03] text-text-tertiary hover:bg-white/[0.06]",
                )}
              >
                {m === "analyse"
                  ? isFR ? "Analyse (Myss)" : "Analysis (Myss)"
                  : isFR ? "Clinique (HIGH_RES)" : "Clinical (HIGH_RES)"}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-text-tertiary">
        {importMode === "analyse"
          ? isFR
            ? "Les fichiers seront importés en mode Analyse. Dossier type : analysis/Myss/"
            : "Files will be imported as Analysis. Typical folder: analysis/Myss/"
          : isFR
            ? "Les fichiers seront importés en mode Clinique. Dossier type : high-res/Myss/"
            : "Files will be imported as Clinical. Typical folder: high-res/Myss/"}
        </p>
      </ToolboxPanel>

      <ToolboxPanel title={isFR ? "3. Déposer le zip ou le dossier" : "3. Drop zip or folder"}>
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
        <ToolboxPanel title={isFR ? "4. Importer" : "4. Import"}>
          {(preview.myssLayout || preview.highResLayout) && (
            <p className="mb-3 text-sm text-success">
              {isFR ? "Formats détectés :" : "Detected:"}{" "}
              {preview.myssLayout && !preview.highResLayout && "Myss (analyse)"}
              {preview.highResLayout && !preview.myssLayout && "high-res (clinique)"}
              {preview.myssLayout && preview.highResLayout && "analysis + high-res (auto)"}
              {" — "}
              {preview.files.length} {isFR ? "fichier(s)" : "file(s)"} →{" "}
              {preview.bundleKeys.join(", ")}
              {preview.skippedOutsideMyss > 0 &&
                (isFR
                  ? ` · ${preview.skippedOutsideMyss} hors dossiers ignoré(s)`
                  : ` · ${preview.skippedOutsideMyss} skipped`)}
            </p>
          )}

          {selectedProfile && (
            <p className="mb-3 rounded-lg border border-[hsl(var(--aegis-warm)/0.3)] bg-[hsl(var(--aegis-warm-muted)/0.25)] px-3 py-2 text-sm text-text-primary">
              {isFR ? "Sera enregistré pour :" : "Will save for:"}{" "}
              <strong>{selectedProfile.display_name}</strong>
              <span className="block text-xs text-text-tertiary mt-1 font-mono">{selectedUserId}</span>
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
                  → {f.pole} / {f.mode} / {f.sectionKey}
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
            {importMode === "analyse"
              ? isFR ? "Importer — Analyse (Myss)" : "Import — Analysis (Myss)"
              : isFR ? "Importer — Clinique (HIGH_RES)" : "Import — Clinical (HIGH_RES)"}
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
              ? "Utilisateur + mode (Analyse ou Clinique) + zip du dossier."
              : "User + mode (Analysis or Clinical) + zip of the folder."
          }
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { FolderUp, Loader2, FileArchive, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { POLE_PART_META, WU_XING_META, type PolePartId, type WuXingPole } from "../domain/types";
import {
  buildTaoBulkImportPreview,
  extractMdFilesFromZip,
  importTaoPortraitBundle,
  type TaoBulkImportPreview,
} from "../services/taoPortraitBulkImport";

function targetLabel(pole: WuXingPole, partId: PolePartId): string {
  if (pole === "transversal") return `T2 · ${POLE_PART_META[partId].code}`;
  const m = WU_XING_META[pole];
  return `${m.emoji} ${m.label_fr} · ${POLE_PART_META[partId].code}`;
}

interface TaoPortraitBulkImportPanelProps {
  userId: string;
  onImported?: () => void;
}

export function TaoPortraitBulkImportPanel({ userId, onImported }: TaoPortraitBulkImportPanelProps) {
  const { toast } = useToast();
  const [preview, setPreview] = useState<TaoBulkImportPreview | null>(null);
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);

  const scanFiles = async (files: File[]) => {
    setScanning(true);
    try {
      const result = await buildTaoBulkImportPreview(files);
      setPreview(result);
      toast({
        title: "Dossier analysé",
        description: `${result.entries.length} section(s) reconnue(s), ${result.skipped.length} ignorée(s).`,
      });
    } catch (e) {
      toast({
        title: "Erreur lecture",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    await scanFiles(Array.from(list));
    e.target.value = "";
  };

  const handleZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const mdFiles = await extractMdFilesFromZip(file);
      const result = await buildTaoBulkImportPreview(mdFiles);
      setPreview(result);
      toast({
        title: "Archive analysée",
        description: `${result.entries.length} section(s) dans le zip.`,
      });
    } catch (err) {
      toast({
        title: "Erreur zip",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setScanning(false);
      e.target.value = "";
    }
  };

  const handleImport = async () => {
    if (!userId) {
      toast({ title: "Sélectionnez un utilisateur", variant: "destructive" });
      return;
    }
    if (!preview?.entries.length) return;

    setImporting(true);
    try {
      const { saved, errors } = await importTaoPortraitBundle(userId, preview.entries);
      if (errors.length) {
        toast({
          title: "Import partiel",
          description: `${saved} enregistré(s), ${errors.length} erreur(s).`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import terminé",
          description: `${saved} section(s) publiées pour cet utilisateur.`,
        });
      }
      onImported?.();
    } catch (e) {
      toast({
        title: "Erreur import",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Importe un dossier Benebell Wen en une fois — structure attendue :{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">2026-05/T2_….md</code> et{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">🌲 BOIS/P01·DIA.md</code> …{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">P05·SCL.md</code> pour chaque pôle.
        </p>

        <div className="flex flex-wrap gap-3">
          <label className="cursor-pointer inline-flex">
            <input
              type="file"
              className="sr-only"
              multiple
              // @ts-expect-error webkitdirectory is non-standard but supported for folder pick
              webkitdirectory=""
              directory=""
              onChange={handleFolder}
              disabled={scanning || importing}
            />
            <span className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium min-h-[44px] hover:bg-accent">
              {scanning ? <Loader2 size={16} className="animate-spin" /> : <FolderUp size={16} />}
              Choisir un dossier
            </span>
          </label>

          <label className="cursor-pointer inline-flex">
            <input
              type="file"
              accept=".zip,application/zip"
              className="sr-only"
              onChange={handleZip}
              disabled={scanning || importing}
            />
            <span className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium min-h-[44px] hover:bg-accent">
              <FileArchive size={16} />
              Archive .zip
            </span>
          </label>
        </div>
      </Card>

      {preview ? (
        <Card className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {preview.entries.length} section(s) prête(s)
              </p>
              {preview.skipped.length > 0 ? (
                <p className="text-xs text-muted-foreground mt-1">
                  {preview.skipped.length} fichier(s) ignoré(s)
                </p>
              ) : null}
            </div>
            <Button
              onClick={() => void handleImport()}
              disabled={!userId || importing || preview.entries.length === 0}
              className="min-h-[44px] gap-2"
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Importer tout
            </Button>
          </div>

          <div className="max-h-72 overflow-auto rounded-lg border border-border/50">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr>
                  <th className="px-3 py-2 font-display uppercase tracking-wider text-muted-foreground">Fichier</th>
                  <th className="px-3 py-2 font-display uppercase tracking-wider text-muted-foreground">Cible</th>
                </tr>
              </thead>
              <tbody>
                {preview.entries.map((e) => (
                  <tr key={`${e.pole}:${e.partId}`} className="border-t border-border/30">
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{e.relativePath}</td>
                    <td className="px-3 py-2 text-foreground">{targetLabel(e.pole, e.partId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.skipped.length > 0 ? (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer flex items-center gap-2 text-amber-600/90">
                <AlertTriangle size={14} />
                Fichiers ignorés ({preview.skipped.length})
              </summary>
              <ul className="mt-2 space-y-1 font-mono text-[11px] pl-5 list-disc">
                {preview.skipped.map((s) => (
                  <li key={s.relativePath}>
                    {s.relativePath} — {s.reason}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

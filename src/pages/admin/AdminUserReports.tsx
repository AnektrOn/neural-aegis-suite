import { useEffect, useState, useCallback } from "react";
import { Upload, Trash2, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import UserPicker from "@/features/admin-export/UserPicker";
import {
  listUserReports,
  importUserReport,
  deleteUserReport,
} from "@/features/user-reports/service";
import type { UserReport } from "@/features/user-reports/types";

export default function AdminUserReports() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isFR = locale === "fr";

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const targetUserId = selectedIds[0];
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

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

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !targetUserId) return;
    setImporting(true);
    let ok = 0;
    let fail = 0;
    for (const file of Array.from(files)) {
      if (!/\.md$/i.test(file.name)) {
        fail++;
        continue;
      }
      try {
        const contentMd = await file.text();
        await importUserReport({
          userId: targetUserId,
          filename: file.name,
          contentMd,
          importedBy: user?.id ?? null,
        });
        ok++;
      } catch (e) {
        console.error("[AdminUserReports] import failed", file.name, e);
        fail++;
      }
    }
    setImporting(false);
    toast({
      title: isFR ? "Import terminé" : "Import complete",
      description: isFR
        ? `${ok} rapport(s) importé(s)${fail ? `, ${fail} échec(s)` : ""}.`
        : `${ok} report(s) imported${fail ? `, ${fail} failed` : ""}.`,
    });
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isFR ? "Supprimer ce rapport ?" : "Delete this report?")) return;
    try {
      await deleteUserReport(id);
      await refresh();
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
      <header className="space-y-2 border-b border-border/40 pb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">
          {isFR ? "Rapports utilisateur" : "User reports"}
        </p>
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">
          {isFR ? "Import Markdown par utilisateur" : "Per-user Markdown import"}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {isFR
            ? "Sélectionne un utilisateur puis dépose un ou plusieurs fichiers .md. Ils apparaîtront comme rapports lisibles dans sa page Persona."
            : "Pick a user, then drop one or more .md files. They will appear as readable reports on their Persona page."}
        </p>
      </header>

      <div className="rounded-2xl border border-border/30 bg-card/40 p-5 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {isFR ? "Utilisateur" : "User"}
          </p>
          <UserPicker
            selected={selectedIds}
            onChange={(ids) => setSelectedIds(ids.slice(-1))}
          />
        </div>

        {targetUserId ? (
          <div className="space-y-3">
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border/40 rounded-xl px-6 py-8 cursor-pointer hover:bg-background/40 transition-colors">
              <Upload size={18} aria-hidden />
              <span className="text-sm">
                {importing
                  ? isFR
                    ? "Import en cours…"
                    : "Importing…"
                  : isFR
                    ? "Choisir des fichiers .md (multi)"
                    : "Choose .md files (multi)"}
              </span>
              <input
                type="file"
                accept=".md,text/markdown"
                multiple
                className="hidden"
                disabled={importing}
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isFR ? "Sélectionne un utilisateur pour continuer." : "Pick a user to continue."}
          </p>
        )}
      </div>

      {targetUserId ? (
        <div className="rounded-2xl border border-border/30 bg-card/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-cormorant-display text-lg">
              {isFR ? "Rapports existants" : "Existing reports"}
            </h3>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
          </div>
          {reports.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">
              {isFR ? "Aucun rapport pour cet utilisateur." : "No reports for this user."}
            </p>
          ) : (
            <ul className="divide-y divide-border/30">
              {reports.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <span className="text-lg" aria-hidden>
                    {r.glyph || <FileText size={16} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
                      {r.slug} · {new Date(r.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleDelete(r.id)}
                    aria-label={isFR ? "Supprimer" : "Delete"}
                  >
                    <Trash2 size={16} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

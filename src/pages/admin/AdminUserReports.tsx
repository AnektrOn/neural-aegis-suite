import { useEffect, useState, useCallback, useMemo } from "react";
import { Upload, Trash2, FileText, Loader2, Eye, X, Check } from "lucide-react";
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
import { parseFrontmatter } from "@/features/user-reports/parseReportMd";
import { UserReportModal } from "@/features/user-reports/UserReportModal";

interface StagedFile {
  filename: string;
  contentMd: string;
  title: string;
  glyph: string | null;
  slug: string;
}

function stageFromMd(filename: string, contentMd: string): StagedFile {
  const { frontmatter } = parseFrontmatter(contentMd);
  const title =
    (typeof frontmatter.title === "string" && frontmatter.title) ||
    filename.replace(/\.md$/i, "");
  const glyph =
    (typeof frontmatter.glyph === "string" && frontmatter.glyph) ||
    (typeof frontmatter.glyphe === "string" && frontmatter.glyphe) ||
    null;
  const slug =
    (typeof frontmatter.slug === "string" && frontmatter.slug) ||
    filename.replace(/\.md$/i, "").toLowerCase();
  return { filename, contentMd, title, glyph, slug };
}

function stagedToPreview(s: StagedFile, userId: string): UserReport {
  const now = new Date().toISOString();
  return {
    id: `preview-${s.filename}`,
    user_id: userId,
    slug: s.slug,
    title: s.title,
    glyph: s.glyph,
    tier: null,
    orientation: null,
    tags: [],
    content_md: s.contentMd,
    imported_by: null,
    created_at: now,
    updated_at: now,
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
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [previewReport, setPreviewReport] = useState<UserReport | null>(null);

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

  // Clear staging when switching user
  useEffect(() => {
    setStaged([]);
  }, [targetUserId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !targetUserId) return;
    const next: StagedFile[] = [];
    let rejected = 0;
    for (const file of Array.from(files)) {
      if (!/\.md$/i.test(file.name)) {
        rejected++;
        continue;
      }
      try {
        const contentMd = await file.text();
        next.push(stageFromMd(file.name, contentMd));
      } catch {
        rejected++;
      }
    }
    setStaged((prev) => [...prev, ...next]);
    if (rejected > 0) {
      toast({
        title: isFR ? "Fichiers ignorés" : "Files skipped",
        description: isFR
          ? `${rejected} fichier(s) non-.md ignoré(s).`
          : `${rejected} non-.md file(s) skipped.`,
      });
    }
  };

  const confirmImport = async () => {
    if (!targetUserId || staged.length === 0) return;
    setImporting(true);
    let ok = 0;
    let fail = 0;
    for (const s of staged) {
      try {
        await importUserReport({
          userId: targetUserId,
          filename: s.filename,
          contentMd: s.contentMd,
          importedBy: user?.id ?? null,
        });
        ok++;
      } catch (e) {
        console.error("[AdminUserReports] import failed", s.filename, e);
        fail++;
      }
    }
    setImporting(false);
    setStaged([]);
    toast({
      title: isFR ? "Envoyé à l'utilisateur" : "Sent to user",
      description: isFR
        ? `${ok} rapport(s) publié(s)${fail ? `, ${fail} échec(s)` : ""}.`
        : `${ok} report(s) published${fail ? `, ${fail} failed` : ""}.`,
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

  const stagedPreviews = useMemo(
    () => (targetUserId ? staged.map((s) => stagedToPreview(s, targetUserId)) : []),
    [staged, targetUserId],
  );

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
            ? "Dépose un ou plusieurs .md, prévisualise le rendu tel que l'utilisateur le verra, puis envoie."
            : "Drop one or more .md files, preview what the user will see, then send."}
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
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border/40 rounded-xl px-6 py-8 cursor-pointer hover:bg-background/40 transition-colors">
            <Upload size={18} aria-hidden />
            <span className="text-sm">
              {isFR
                ? "Choisir des fichiers .md (multi)"
                : "Choose .md files (multi)"}
            </span>
            <input
              type="file"
              accept=".md,text/markdown"
              multiple
              className="hidden"
              onChange={(e) => {
                void handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isFR ? "Sélectionne un utilisateur pour continuer." : "Pick a user to continue."}
          </p>
        )}
      </div>

      {targetUserId && staged.length > 0 ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h3 className="font-cormorant-display text-lg">
                {isFR ? "Aperçu avant envoi" : "Preview before sending"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isFR
                  ? "Ces rapports ne sont pas encore visibles par l'utilisateur."
                  : "These reports are not yet visible to the user."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStaged([])}
                disabled={importing}
              >
                <X size={14} className="mr-1" />
                {isFR ? "Annuler" : "Discard"}
              </Button>
              <Button size="sm" onClick={() => void confirmImport()} disabled={importing}>
                {importing ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Check size={14} className="mr-1" />
                )}
                {isFR
                  ? `Envoyer à l'utilisateur (${staged.length})`
                  : `Send to user (${staged.length})`}
              </Button>
            </div>
          </div>
          <ul className="divide-y divide-border/30">
            {stagedPreviews.map((r, idx) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <span className="text-lg" aria-hidden>
                  {r.glyph || <FileText size={16} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
                    {staged[idx].filename}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewReport(r)}
                >
                  <Eye size={14} className="mr-1" />
                  {isFR ? "Aperçu" : "Preview"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setStaged((prev) => prev.filter((_, i) => i !== idx))
                  }
                  aria-label={isFR ? "Retirer" : "Remove"}
                  disabled={importing}
                >
                  <Trash2 size={16} />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {targetUserId ? (
        <div className="rounded-2xl border border-border/30 bg-card/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-cormorant-display text-lg">
              {isFR ? "Rapports publiés" : "Published reports"}
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
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewReport(r)}
                  >
                    <Eye size={14} className="mr-1" />
                    {isFR ? "Aperçu" : "Preview"}
                  </Button>
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

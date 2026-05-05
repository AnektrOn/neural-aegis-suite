import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import type { LibraryScope } from "@/lib/library-scope";
import { isLibraryScope } from "@/lib/library-scope";
import VideoLibraryUserPicker, { type VideoLibraryProfileOption } from "@/components/admin/VideoLibraryUserPicker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoRow {
  id: string;
  title: string;
  external_url: string;
  library_scope: string;
  created_at: string;
  userIds: string[];
}

interface VideoLibraryOrganizeTabProps {
  profiles: VideoLibraryProfileOption[];
  refreshKey: number;
}

export default function VideoLibraryOrganizeTab({ profiles, refreshKey }: VideoLibraryOrganizeTabProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [editVideo, setEditVideo] = useState<VideoRow | null>(null);
  const [draftUserIds, setDraftUserIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VideoRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of profiles) {
      m.set(p.id, p.display_name?.trim() || t("users.noName"));
    }
    return m;
  }, [profiles, t]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: vids, error: vErr } = await supabase
        .from("library_videos")
        .select("id, title, external_url, library_scope, created_at")
        .order("created_at", { ascending: false });

      if (vErr) {
        toast({ title: t("toast.error"), description: vErr.message, variant: "destructive" });
        setVideos([]);
        return;
      }

      const list = (vids || []) as Omit<VideoRow, "userIds">[];
      if (list.length === 0) {
        setVideos([]);
        return;
      }

      const videoIds = list.map((v) => v.id);
      const { data: assigns, error: aErr } = await supabase
        .from("library_video_assignments")
        .select("video_id, user_id")
        .in("video_id", videoIds);

      if (aErr) {
        toast({ title: t("toast.error"), description: aErr.message, variant: "destructive" });
        setVideos([]);
        return;
      }

      const byVideo = new Map<string, string[]>();
      for (const row of assigns || []) {
        const vid = (row as { video_id: string; user_id: string }).video_id;
        const uid = (row as { video_id: string; user_id: string }).user_id;
        if (!byVideo.has(vid)) byVideo.set(vid, []);
        byVideo.get(vid)!.push(uid);
      }

      setVideos(
        list.map((v) => ({
          ...v,
          userIds: byVideo.get(v.id) || [],
        })),
      );
    } catch (e) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : t("toast.unexpected"),
        variant: "destructive",
      });
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    if (editVideo) setDraftUserIds([...editVideo.userIds]);
  }, [editVideo]);

  const scopeLabel = (scope: string) => {
    const s = isLibraryScope(scope) ? scope : ("global_fr" as LibraryScope);
    if (s === "global_fr") return t("admin.driveImport.scopeGlobalFr");
    if (s === "global_en") return t("admin.driveImport.scopeGlobalEn");
    return t("admin.driveImport.scopePerso");
  };

  const saveAssignments = async () => {
    if (!editVideo || !user) return;
    setSaving(true);
    try {
      const prev = new Set(editVideo.userIds);
      const next = new Set(draftUserIds);
      const toRemove = [...prev].filter((id) => !next.has(id));
      const toAdd = [...next].filter((id) => !prev.has(id));

      for (const uid of toRemove) {
        const { error } = await supabase
          .from("library_video_assignments")
          .delete()
          .eq("video_id", editVideo.id)
          .eq("user_id", uid);
        if (error) {
          toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
          return;
        }
      }

      if (toAdd.length > 0) {
        const rows = toAdd.map((uid) => ({
          video_id: editVideo.id,
          user_id: uid,
          assigned_by: user.id,
        }));
        const { error } = await supabase.from("library_video_assignments").insert(rows);
        if (error) {
          toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
          return;
        }
      }

      toast({ title: t("admin.videoLibrary.assignmentsSaved") });
      setEditVideo(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("library_videos").delete().eq("id", deleteTarget.id);
      if (error) {
        toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: t("admin.videoLibrary.videoDeleted") });
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {loading && (
        <div className="ethereal-glass p-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className="ethereal-glass p-12 text-center text-muted-foreground text-sm">{t("admin.videoLibrary.organizeEmpty")}</div>
      )}

      {!loading && videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((v) => (
            <div
              key={v.id}
              className="ethereal-glass p-4 flex flex-col sm:flex-row sm:items-center gap-3 border border-border/20 rounded-xl"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{v.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{v.external_url}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-border/40 text-muted-foreground">
                    {scopeLabel(v.library_scope)}
                  </span>
                  <span className="text-neural-label text-xs">
                    {v.userIds.length === 0
                      ? t("admin.videoLibrary.noAssignments")
                      : v.userIds.map((id) => nameById.get(id) || id.slice(0, 8)).join(" · ")}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditVideo(v)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/30 text-sm text-foreground hover:border-primary/30 transition-colors"
                >
                  <Pencil size={14} />
                  {t("admin.videoLibrary.editAssignments")}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(v)}
                  className="p-2 rounded-lg border border-border/30 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                  title={t("admin.videoLibrary.deleteVideo")}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editVideo} onOpenChange={(open) => !open && setEditVideo(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.videoLibrary.editAssignmentsTitle")}</DialogTitle>
          </DialogHeader>
          {editVideo && (
            <>
              <p className="text-sm text-muted-foreground truncate">{editVideo.title}</p>
              <VideoLibraryUserPicker profiles={profiles} mode="multiple" value={draftUserIds} onChange={setDraftUserIds} />
              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setEditVideo(null)}
                  className="px-4 py-2 rounded-lg border border-border/30 text-sm"
                >
                  {t("general.cancel")}
                </button>
                <button type="button" disabled={saving} onClick={saveAssignments} className="btn-neural disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {t("admin.videoLibrary.saveAssignments")}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.videoLibrary.deleteVideo")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.videoLibrary.confirmDelete")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("general.cancel")}</AlertDialogCancel>
            <button
              type="button"
              disabled={deleting}
              onClick={() => void confirmDelete()}
              className={cn(buttonVariants(), "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : t("general.delete")}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrackRow {
  id: string;
  title: string;
  drive_file_id: string;
  library_scope: string;
  created_at: string;
  userIds: string[];
}

interface MeditationLibraryOrganizeTabProps {
  profiles: VideoLibraryProfileOption[];
  refreshKey: number;
}

export default function MeditationLibraryOrganizeTab({ profiles, refreshKey }: MeditationLibraryOrganizeTabProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [editTrack, setEditTrack] = useState<TrackRow | null>(null);
  const [draftUserIds, setDraftUserIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TrackRow | null>(null);
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
        .from("meditation_tracks")
        .select("id, title, drive_file_id, library_scope, created_at")
        .order("created_at", { ascending: false });

      if (vErr) {
        toast({ title: t("toast.error"), description: vErr.message, variant: "destructive" });
        setTracks([]);
        return;
      }

      const list = (vids || []) as Omit<TrackRow, "userIds">[];
      if (list.length === 0) {
        setTracks([]);
        return;
      }

      const videoIds = list.map((v) => v.id);
      const { data: assigns, error: aErr } = await supabase
        .from("meditation_assignments")
        .select("track_id, user_id")
        .in("track_id", videoIds);

      if (aErr) {
        toast({ title: t("toast.error"), description: aErr.message, variant: "destructive" });
        setTracks([]);
        return;
      }

      const byVideo = new Map<string, string[]>();
      for (const row of assigns || []) {
        const vid = (row as { track_id: string; user_id: string }).track_id;
        const uid = (row as { track_id: string; user_id: string }).user_id;
        if (!byVideo.has(vid)) byVideo.set(vid, []);
        byVideo.get(vid)!.push(uid);
      }

      setTracks(
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
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    if (editTrack) setDraftUserIds([...editTrack.userIds]);
  }, [editTrack]);

  const scopeLabel = (scope: string) => {
    const s = isLibraryScope(scope) ? scope : ("global_fr" as LibraryScope);
    if (s === "global_fr") return t("admin.driveImport.scopeGlobalFr");
    if (s === "global_en") return t("admin.driveImport.scopeGlobalEn");
    return t("admin.driveImport.scopePerso");
  };

  const saveAssignments = async () => {
    if (!editTrack || !user) return;
    setSaving(true);
    try {
      const prev = new Set(editTrack.userIds);
      const next = new Set(draftUserIds);
      const toRemove = [...prev].filter((id) => !next.has(id));
      const toAdd = [...next].filter((id) => !prev.has(id));

      for (const uid of toRemove) {
        const { error } = await supabase
          .from("meditation_assignments")
          .delete()
          .eq("track_id", editTrack.id)
          .eq("user_id", uid);
        if (error) {
          toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
          return;
        }
      }

      if (toAdd.length > 0) {
        const rows = toAdd.map((uid) => ({
          track_id: editTrack.id,
          user_id: uid,
          assigned_by: user.id,
        }));
        const { error } = await supabase.from("meditation_assignments").insert(rows);
        if (error) {
          toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
          return;
        }
      }

      toast({ title: t("admin.videoLibrary.assignmentsSaved") });
      setEditTrack(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("meditation_tracks").delete().eq("id", deleteTarget.id);
      if (error) {
        toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: t("admin.meditation.trackDeleted") });
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

      {!loading && tracks.length === 0 && (
        <div className="ethereal-glass p-12 text-center text-muted-foreground text-sm">{t("admin.meditation.organizeEmpty")}</div>
      )}

      {!loading && tracks.length > 0 && (
        <div className="space-y-2">
          {tracks.map((v) => (
            <div
              key={v.id}
              className="ethereal-glass p-4 flex flex-col sm:flex-row sm:items-center gap-3 border border-border/20 rounded-xl"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{v.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{v.drive_file_id}</p>
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
                  onClick={() => setEditTrack(v)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/30 text-sm text-foreground hover:border-primary/30 transition-colors"
                >
                  <Pencil size={14} />
                  {t("admin.videoLibrary.editAssignments")}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(v)}
                  className="p-2 rounded-lg border border-border/30 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                  title={t("admin.meditation.deleteTrack")}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editTrack} onOpenChange={(open) => !open && setEditTrack(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.videoLibrary.editAssignmentsTitle")}</DialogTitle>
          </DialogHeader>
          {editTrack && (
            <>
              <p className="text-sm text-muted-foreground truncate">{editTrack.title}</p>
              <VideoLibraryUserPicker profiles={profiles} mode="multiple" value={draftUserIds} onChange={setDraftUserIds} />
              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setEditTrack(null)}
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
            <AlertDialogTitle>{t("admin.meditation.deleteTrack")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.meditation.confirmDelete")}</AlertDialogDescription>
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

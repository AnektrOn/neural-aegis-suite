import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  getRecoveryDiagnostics,
  resetUserArchetypeResults,
  type RecoveryDiagnostics,
} from "../services/assessmentService";

interface ProfileOption {
  id: string;
  display_name: string | null;
}

export function AdminArchetypeResetPanel({ onReset }: { onReset?: () => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [userId, setUserId] = useState("");
  const [diag, setDiag] = useState<RecoveryDiagnostics | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [resetting, setResetting] = useState<"t1" | "t2" | "both" | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, display_name")
      .order("display_name", { ascending: true })
      .limit(2000)
      .then(({ data }) => setProfiles((data ?? []) as ProfileOption[]));
  }, []);

  const selectedLabel = useMemo(() => {
    const p = profiles.find((x) => x.id === userId);
    return p?.display_name || (userId ? userId.slice(0, 8) : "");
  }, [profiles, userId]);

  const loadDiag = useCallback(async (id: string) => {
    if (!id) {
      setDiag(null);
      return;
    }
    setDiagLoading(true);
    try {
      setDiag(await getRecoveryDiagnostics(id));
    } catch (e) {
      setDiag(null);
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setDiagLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void loadDiag(userId);
  }, [userId, loadDiag]);

  const runReset = async (scope: { t1: boolean; t2: boolean }, kind: "t1" | "t2" | "both") => {
    if (!userId) return;
    const label =
      kind === "t1"
        ? t("admin.assessments.reset.confirmT1")
        : kind === "t2"
          ? t("admin.assessments.reset.confirmT2")
          : t("admin.assessments.reset.confirmBoth");
    if (!window.confirm(label.replace("{name}", selectedLabel || userId))) return;

    setResetting(kind);
    try {
      const result = await resetUserArchetypeResults(userId, scope);
      toast({
        title: t("admin.assessments.reset.success"),
        description: t("admin.assessments.reset.successDesc", {
          sessions: result.t1_sessions_deleted ?? 0,
          snapshots: result.t1_snapshots_deleted ?? 0,
          deepdive: result.t2_responses_deleted ?? 0,
        }),
      });
      await loadDiag(userId);
      onReset?.();
    } catch (e) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setResetting(null);
    }
  };

  return (
    <Card className="p-4 sm:p-5 border-border/40 bg-card/50 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <h2 className="text-sm font-semibold">{t("admin.assessments.reset.title")}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("admin.assessments.reset.desc")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">{t("admin.assessments.reset.user")}</span>
          <select
            className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">{t("admin.assessments.reset.pickUser")}</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || p.id.slice(0, 8)} · {p.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!userId || diagLoading}
          onClick={() => void loadDiag(userId)}
        >
          {diagLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("admin.assessments.reset.refresh")}
        </Button>
      </div>

      {userId && diag ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded-md border border-border/40 px-3 py-2">
            <div className="text-muted-foreground">{t("admin.assessments.reset.statSessions")}</div>
            <div className="text-lg font-semibold tabular-nums">{diag.submittedSessions}</div>
          </div>
          <div className="rounded-md border border-border/40 px-3 py-2">
            <div className="text-muted-foreground">{t("admin.assessments.reset.statSnapshots")}</div>
            <div className="text-lg font-semibold tabular-nums">{diag.snapshotCount}</div>
          </div>
          <div className="rounded-md border border-border/40 px-3 py-2">
            <div className="text-muted-foreground">{t("admin.assessments.reset.statT2")}</div>
            <div className="text-lg font-semibold tabular-nums">{diag.deepdiveResponseCount}</div>
          </div>
          <div className="rounded-md border border-border/40 px-3 py-2 col-span-2 sm:col-span-1">
            <div className="text-muted-foreground">{t("admin.assessments.reset.statTriad")}</div>
            <div className="text-sm font-medium truncate">
              {diag.currentTopTriad.length > 0 ? diag.currentTopTriad.join(" · ") : "—"}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={!userId || resetting !== null}
          onClick={() => void runReset({ t1: true, t2: false }, "t1")}
        >
          {resetting === "t1" ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RotateCcw className="w-4 h-4 mr-2" />
          )}
          {t("admin.assessments.reset.btnT1")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={!userId || resetting !== null}
          onClick={() => void runReset({ t1: false, t2: true }, "t2")}
        >
          {resetting === "t2" ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RotateCcw className="w-4 h-4 mr-2" />
          )}
          {t("admin.assessments.reset.btnT2")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!userId || resetting !== null}
          onClick={() => void runReset({ t1: true, t2: true }, "both")}
        >
          {resetting === "both" ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RotateCcw className="w-4 h-4 mr-2" />
          )}
          {t("admin.assessments.reset.btnBoth")}
        </Button>
      </div>
    </Card>
  );
}

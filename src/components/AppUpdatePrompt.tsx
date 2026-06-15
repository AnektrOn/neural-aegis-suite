import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { installApkUpdate } from "@/lib/appRelease";
import { logUpdateEvent } from "@/services/appReleasesService";
import { useLanguage } from "@/i18n/LanguageContext";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AppUpdatePrompt() {
  const { update, dismiss } = useAppUpdate();
  const { t } = useLanguage();
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const loggedPromptForRef = useRef<number | null>(null);

  useEffect(() => {
    if (!update) {
      setInstalling(false);
      setProgress(0);
      setError(null);
      return;
    }
    if (loggedPromptForRef.current === update.release.versionCode) return;
    loggedPromptForRef.current = update.release.versionCode;
    logUpdateEvent({
      type: "prompt_shown",
      versionCode: update.release.versionCode,
      releaseId: update.release.releaseId,
    });
  }, [update]);

  if (!update) return null;

  const handleDismiss = () => {
    logUpdateEvent({
      type: "prompt_dismissed",
      versionCode: update.release.versionCode,
      releaseId: update.release.releaseId,
    });
    dismiss();
  };

  const handleInstall = async () => {
    setInstalling(true);
    setProgress(0);
    setError(null);
    try {
      await installApkUpdate(update.release.apkUrl, {
        versionCode: update.release.versionCode,
        releaseId: update.release.releaseId,
        onProgress: setProgress,
        onError: (message) => {
          setError(message);
          setInstalling(false);
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("appUpdate.errorGeneric");
      setError(message);
      setInstalling(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && !update.forced && handleDismiss()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            {t("appUpdate.title", { version: update.release.versionName })}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left">
              <p>{update.forced ? t("appUpdate.forcedDesc") : t("appUpdate.optionalDesc")}</p>
              {update.release.releaseNotes ? (
                <p className="text-sm whitespace-pre-wrap rounded-lg bg-secondary/40 p-3 border border-border-subtle">
                  {update.release.releaseNotes}
                </p>
              ) : null}
              {installing ? (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {t("appUpdate.downloadProgress", { progress: String(progress) })}
                  </p>
                </div>
              ) : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!update.forced && !installing ? (
            <AlertDialogCancel onClick={handleDismiss}>{t("appUpdate.later")}</AlertDialogCancel>
          ) : null}
          <AlertDialogAction
            disabled={installing}
            onClick={(e) => {
              e.preventDefault();
              void handleInstall();
            }}
          >
            {installing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("appUpdate.installing")}
              </>
            ) : (
              t("appUpdate.install")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

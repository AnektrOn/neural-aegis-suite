import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, ShieldCheck, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  getPublishedRelease,
  type AppRelease,
} from "@/services/appReleasesService";
import { Button } from "@/components/ui/button";

export default function InstallAndroid() {
  const { t, locale } = useLanguage();
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedRelease("android")
      .then(setRelease)
      .catch(() => setRelease(null))
      .finally(() => setLoading(false));
  }, []);

  const pageUrl =
    typeof window !== "undefined" ? window.location.href : "";
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    pageUrl,
  )}`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full ethereal-glass p-8 rounded-xl border border-primary/15 space-y-6"
      >
        <div className="flex items-center gap-3">
          <Smartphone className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-cinzel">
              {t("installAndroid.title" as never)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("installAndroid.subtitle" as never)}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !release ? (
          <p className="text-sm text-muted-foreground">
            {t("installAndroid.noRelease" as never)}
          </p>
        ) : (
          <>
            <div className="ethereal-glass p-4 rounded-md border border-border/40">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {t("installAndroid.currentVersion" as never)}
              </p>
              <p className="text-xl font-cinzel mt-1">
                v{release.version_name}{" "}
                <span className="text-xs text-muted-foreground">
                  ({release.version_code})
                </span>
              </p>
              {release.published_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(release.published_at).toLocaleDateString(locale)}
                </p>
              )}
              {release.release_notes && (
                <p className="text-sm whitespace-pre-wrap mt-3 text-muted-foreground/90">
                  {release.release_notes}
                </p>
              )}
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => (window.location.href = release.apk_public_url)}
            >
              <Download className="w-4 h-4 mr-2" />
              {t("installAndroid.download" as never)}
            </Button>

            <div className="space-y-3 text-sm">
              <h2 className="font-cinzel flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                {t("installAndroid.steps.title" as never)}
              </h2>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>{t("installAndroid.steps.s1" as never)}</li>
                <li>{t("installAndroid.steps.s2" as never)}</li>
                <li>{t("installAndroid.steps.s3" as never)}</li>
              </ol>
            </div>

            <div className="flex items-center justify-center pt-4 border-t border-border/40">
              <div className="text-center">
                <img
                  src={qrSrc}
                  alt="QR code"
                  className="rounded-md bg-white p-2"
                  width={200}
                  height={200}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {t("installAndroid.qrHint" as never)}
                </p>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

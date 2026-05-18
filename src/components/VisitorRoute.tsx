import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BootLoadingScreen } from "@/components/BootLoadingScreen";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

export default function VisitorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, bootScreenActive, ensureAnonymousSession } = useAuth();
  const { t } = useLanguage();
  const [authError, setAuthError] = useState<string | null>(null);
  const [ensuring, setEnsuring] = useState(false);

  useEffect(() => {
    if (loading || bootScreenActive || user) return;

    let alive = true;
    setEnsuring(true);
    setAuthError(null);

    ensureAnonymousSession()
      .catch((e: unknown) => {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : String(e);
        setAuthError(msg);
      })
      .finally(() => {
        if (alive) setEnsuring(false);
      });

    return () => {
      alive = false;
    };
  }, [loading, bootScreenActive, user, ensureAnonymousSession]);

  if (loading || bootScreenActive || ensuring) {
    return (
      <div className="relative z-10 min-h-screen">
        <BootLoadingScreen />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-6 max-w-md space-y-4 text-center">
          <p className="text-destructive text-sm">{authError}</p>
          <p className="text-muted-foreground text-xs">{t("visitor.authErrorHint")}</p>
          <Button
            onClick={() => {
              setAuthError(null);
              setEnsuring(true);
              void ensureAnonymousSession()
                .catch((e: unknown) =>
                  setAuthError(e instanceof Error ? e.message : String(e))
                )
                .finally(() => setEnsuring(false));
            }}
          >
            {t("visitor.retry")}
          </Button>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

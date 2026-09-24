import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  fetchEmployerConsent,
  setEmployerConsent,
} from "@/services/b2bTenancyService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/** Employee opt-in so company managers can read journal / decision text. */
export default function EmployerDataConsentCard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const [{ data: profile }, consent] = await Promise.all([
        supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle(),
        fetchEmployerConsent(user.id).catch(() => null),
      ]);
      if (!alive) return;
      setCompanyId((profile as { company_id: string | null } | null)?.company_id ?? null);
      setAccepted(!!consent?.accepted_at);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  if (!user || loading || !companyId) return null;

  const onToggle = async (next: boolean) => {
    setSaving(true);
    try {
      await setEmployerConsent({ userId: user.id, companyId, accept: next });
      setAccepted(next);
      toast({
        title: next ? t("consent.employerAccepted") : t("consent.employerRevoked"),
      });
    } catch (e) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ethereal-glass p-5 space-y-3">
      <h3 className="text-sm font-medium text-foreground">{t("consent.employerTitle")}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{t("consent.employerBody")}</p>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={accepted}
          disabled={saving}
          onChange={(e) => void onToggle(e.target.checked)}
          className="rounded border-border"
        />
        {t("consent.employerCheckbox")}
      </label>
    </div>
  );
}

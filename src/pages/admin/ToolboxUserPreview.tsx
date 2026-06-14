import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  ToolboxEmptyState,
  ToolboxLoadingBlock,
  toolboxFieldClass,
  toolboxLabelClass,
} from "@/components/admin/toolbox/ToolboxAdminUi";
import { ToolboxUserView } from "@/features/toolbox/ToolboxUserView";
import { loadToolboxAdminProfiles } from "@/services/toolboxAdminService";
import { supabase } from "@/integrations/supabase/client";

export default function ToolboxUserPreview() {
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const dateLocaleTag = locale === "fr" ? "fr-FR" : "en-US";

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Array<{ id: string; display_name: string | null }>>([]);
  const [userIdsWithToolbox, setUserIdsWithToolbox] = useState<Set<string>>(new Set());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    setLoading(true);
    try {
      const [profs, assignRes] = await Promise.all([
        loadToolboxAdminProfiles(),
        supabase
          .from("toolbox_assignments" as never)
          .select("user_id")
          .neq("user_delivery_status", "inactive"),
      ]);
      if (assignRes.error) throw assignRes.error;
      setProfiles(profs);
      setUserIdsWithToolbox(
        new Set(((assignRes.data || []) as Array<{ user_id: string }>).map((row) => row.user_id)),
      );
    } catch (error: unknown) {
      toast({
        title: t("toast.error"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const usersWithToolbox = useMemo(
    () =>
      profiles
        .filter((p) => userIdsWithToolbox.has(p.id))
        .sort((a, b) => (a.display_name || a.id).localeCompare(b.display_name || b.id, dateLocaleTag)),
    [profiles, userIdsWithToolbox, dateLocaleTag],
  );

  const selectedUserLabel =
    usersWithToolbox.find((p) => p.id === selectedUserId)?.display_name ||
    (selectedUserId ? selectedUserId.slice(0, 8) : null);

  if (loading) {
    return <ToolboxLoadingBlock message={t("admin.toolboxPreview.loading")} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      <header className="space-y-3 border-b border-border/40 pb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">
          {t("admin.hub.tab.toolboxUserView")}
        </p>
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">
          {t("admin.toolboxPreview.title")}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("admin.toolboxPreview.description")}</p>
      </header>

      <div className="ethereal-glass space-y-2 p-4 lg:p-5">
        <label htmlFor="toolbox-preview-user-select" className={toolboxLabelClass}>
          {t("admin.toolboxMgmt.userLabel")}
        </label>
        <div className="relative max-w-xl">
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <select
            id="toolbox-preview-user-select"
            className={`${toolboxFieldClass} appearance-none pr-10`}
            value={selectedUserId ?? ""}
            onChange={(e) => setSelectedUserId(e.target.value || null)}
          >
            <option value="">{t("admin.toolboxPreview.selectUser")}</option>
            {usersWithToolbox.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.display_name || profile.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
        {selectedUserLabel ? (
          <p className="text-xs text-muted-foreground">
            {t("admin.toolboxPreview.viewingAs", { name: selectedUserLabel })}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("admin.toolboxPreview.selectUserHint")}</p>
        )}
      </div>

      {!selectedUserId ? (
        <ToolboxEmptyState
          icon={Eye}
          title={t("admin.toolboxPreview.emptyTitle")}
          hint={t("admin.toolboxPreview.emptyHint")}
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-text-primary">
            {t("admin.toolboxPreview.banner")}
          </div>
          <div className="rounded-2xl border border-border/40 bg-bg-base/80 p-4 sm:p-6 lg:p-8">
            <ToolboxUserView key={selectedUserId} userId={selectedUserId} readOnly />
          </div>
        </div>
      )}
    </div>
  );
}

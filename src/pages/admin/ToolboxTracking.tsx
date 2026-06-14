import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronDown, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import {
  ToolboxEmptyState,
  ToolboxLoadingBlock,
  ToolboxPageStat,
  ToolboxSection,
  toolboxFieldClass,
  toolboxLabelClass,
} from "@/components/admin/toolbox/ToolboxAdminUi";
import ToolboxTrackingRowCard from "@/features/toolbox-admin/ToolboxTrackingRowCard";
import { ToolboxBucketFilterBar, ToolboxListToolbar } from "@/features/toolbox-admin/ToolboxByUserViews";
import { BUCKET_ORDER } from "@/features/toolbox-admin/toolboxTrackingBuckets";
import { pickLocalizedText } from "@/lib/content-i18n";
import {
  loadToolboxAdminProfiles,
  loadToolboxTrackingRows,
  resendToolboxAssignment,
  type ToolboxTrackingBucket,
  type ToolboxTrackingRow,
} from "@/services/toolboxAdminService";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function ToolboxTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const dateLocaleTag = locale === "fr" ? "fr-FR" : "en-US";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ToolboxTrackingRow[]>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; display_name: string | null }>>([]);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [bucketFilter, setBucketFilter] = useState<ToolboxTrackingBucket | "all">("all");
  const [resendingId, setResendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, profs] = await Promise.all([loadToolboxTrackingRows(), loadToolboxAdminProfiles()]);
      setRows(data);
      setProfiles(profs);
    } catch (error: unknown) {
      toast({ title: t("toast.error"), description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSearch("");
    setFilterType("all");
    setBucketFilter("all");
  }, [selectedUserId]);

  const usersWithTools = useMemo(() => {
    const ids = new Set(rows.map((r) => r.user_id));
    return profiles
      .filter((p) => ids.has(p.id))
      .sort((a, b) => (a.display_name || a.id).localeCompare(b.display_name || b.id, dateLocaleTag));
  }, [rows, profiles, dateLocaleTag]);

  const scopedRows = useMemo(() => {
    if (!selectedUserId) return rows;
    return rows.filter((r) => r.user_id === selectedUserId);
  }, [rows, selectedUserId]);

  const allTypes = useMemo(
    () => ["all", ...new Set(scopedRows.map((r) => r.content_type))],
    [scopedRows],
  );

  useEffect(() => {
    if (filterType !== "all" && !allTypes.includes(filterType)) {
      setFilterType("all");
    }
  }, [allTypes, filterType]);

  const filtered = useMemo(() => {
    return scopedRows
      .filter((r) => (bucketFilter === "all" ? true : r.trackingBucket === bucketFilter))
      .filter((r) => filterType === "all" || r.content_type === filterType)
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const title = pickLocalizedText(locale as Locale, r.title_i18n, r.title).toLowerCase();
        const name = (r.user_name || "").toLowerCase();
        return name.includes(q) || title.includes(q);
      });
  }, [scopedRows, locale, search, bucketFilter, filterType]);

  const bucketCounts = useMemo(() => {
    const counts = Object.fromEntries(BUCKET_ORDER.map((b) => [b, 0])) as Record<ToolboxTrackingBucket, number>;
    for (const row of scopedRows) counts[row.trackingBucket] += 1;
    return counts;
  }, [scopedRows]);

  const statTracked = scopedRows.length;
  const statCompleted = bucketCounts.completed + bucketCounts.reused;
  const statResendable = scopedRows.filter((r) => r.canResend).length;

  const handleResend = async (row: ToolboxTrackingRow) => {
    if (!user || !row.canResend) return;
    setResendingId(row.id);
    try {
      const title = pickLocalizedText(locale as Locale, row.title_i18n, row.title);
      await resendToolboxAssignment({
        assignmentId: row.id,
        actorId: user.id,
        userId: row.user_id,
        title,
      });
      toast({ title: t("admin.toolboxTracking.resendSuccess"), description: title });
      await load();
    } catch (error: unknown) {
      toast({ title: t("toast.error"), description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setResendingId(null);
    }
  };

  if (loading) {
    return <ToolboxLoadingBlock message={t("admin.toolboxTracking.loading")} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      <header className="space-y-3 border-b border-border/40 pb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">
          {t("admin.hub.tab.toolboxTracking")}
        </p>
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">{t("admin.toolboxTracking.title")}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("admin.toolboxTracking.description")}</p>
      </header>

      <div className="ethereal-glass space-y-2 p-4 lg:p-5">
        <label htmlFor="toolbox-tracking-user-select" className={toolboxLabelClass}>
          {t("admin.toolboxMgmt.userLabel")}
        </label>
        <div className="relative max-w-xl">
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <select
            id="toolbox-tracking-user-select"
            className={`${toolboxFieldClass} appearance-none pr-10`}
            value={selectedUserId ?? ""}
            onChange={(e) => setSelectedUserId(e.target.value || null)}
          >
            <option value="">{t("admin.toolboxMgmt.filterAllUsers")}</option>
            {usersWithTools.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.display_name || profile.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ToolboxBucketFilterBar
        counts={bucketCounts}
        activeBucket={bucketFilter}
        onBucketChange={setBucketFilter}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ToolboxPageStat label={t("admin.toolboxTracking.statTracked")} value={statTracked} icon={BarChart3} />
        <ToolboxPageStat label={t("admin.toolboxTracking.statCompleted")} value={statCompleted} icon={BarChart3} />
        <ToolboxPageStat label={t("admin.toolboxTracking.statResendable")} value={statResendable} icon={RotateCcw} />
      </div>

      <ToolboxSection
        title={t("admin.toolboxTracking.sectionTitle")}
        description={t("admin.toolboxTracking.sectionDesc")}
        badge={t("admin.toolboxMgmt.resultsCount", { count: String(filtered.length) })}
      >
        <ToolboxListToolbar
          search={search}
          onSearchChange={setSearch}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          typeOptions={allTypes}
          searchId="toolbox-tracking-search"
          typeSelectId="toolbox-tracking-type"
        />

        {filtered.length === 0 ? (
          <ToolboxEmptyState
            icon={BarChart3}
            title={t("admin.toolboxTracking.emptyTitle")}
            hint={t("admin.toolboxTracking.emptyHint")}
          />
        ) : (
          <ul className="space-y-4">
            {filtered.map((row) => (
              <ToolboxTrackingRowCard
                key={row.id}
                row={row}
                locale={locale as Locale}
                dateLocaleTag={dateLocaleTag}
                resending={resendingId === row.id}
                onResend={() => void handleResend(row)}
              />
            ))}
          </ul>
        )}
      </ToolboxSection>
    </div>
  );
}

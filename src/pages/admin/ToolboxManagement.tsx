import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wind,
  Eye,
  Scan,
  Sparkles,
  Stars,
  Heart,
  BookOpen,
  Link as LinkIcon,
  Package,
  ShieldAlert,
  Target,
  Library,
  User,
  ChevronDown,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import {
  ToolboxEmptyState,
  ToolboxLoadingBlock,
  ToolboxPageStat,
  ToolboxSection,
  toolboxFieldClass,
  toolboxLabelClass,
} from "@/components/admin/toolbox/ToolboxAdminUi";
import ToolboxByUserToolCard from "@/features/toolbox-admin/ToolboxByUserToolCard";
import {
  ToolboxBucketFilterBar,
  ToolboxListToolbar,
  ToolboxUserDirectoryCard,
} from "@/features/toolbox-admin/ToolboxByUserViews";
import { BUCKET_ORDER } from "@/features/toolbox-admin/toolboxTrackingBuckets";
import { pickLocalizedText } from "@/lib/content-i18n";
import type { Locale } from "@/i18n/translations";
import {
  loadToolboxAdminProfiles,
  loadToolboxTrackingRows,
  type ToolboxTrackingBucket,
  type ToolboxTrackingRow,
} from "@/services/toolboxAdminService";

interface UserSummary {
  userId: string;
  userName: string;
  toolCount: number;
  typeCount: number;
}

const TYPE_META_BASE: Record<string, { icon: typeof Wind; color: string; labelKey: TranslationKey }> = {
  breathwork: { icon: Wind, color: "text-primary", labelKey: "toolbox.typeBreathwork" },
  focus_introspectif: { icon: Eye, color: "text-neural-accent", labelKey: "toolbox.typeFocusIntrospectif" },
  body_scan: { icon: Scan, color: "text-neural-warm", labelKey: "toolbox.typeBodyScan" },
  visualization: { icon: Sparkles, color: "text-neural-accent", labelKey: "admin.toolboxMgmt.type.visualization" },
  stop_protocol: { icon: ShieldAlert, color: "text-destructive", labelKey: "admin.toolboxMgmt.type.stop_protocol" },
  intention: { icon: Target, color: "text-primary", labelKey: "toolbox.typeIntention" },
  affirmations: { icon: Stars, color: "text-primary", labelKey: "toolbox.typeAffirmations" },
  gratitude: { icon: Heart, color: "text-destructive", labelKey: "toolbox.typeGratitude" },
  journal_prompt: { icon: BookOpen, color: "text-neural-accent", labelKey: "toolbox.typeJournalPrompt" },
  external_link: { icon: LinkIcon, color: "text-muted-foreground", labelKey: "admin.toolboxMgmt.type.external_link" },
  meditation: { icon: Eye, color: "text-primary", labelKey: "admin.toolboxMgmt.type.meditation" },
  course: { icon: BookOpen, color: "text-neural-warm", labelKey: "admin.toolboxMgmt.type.course" },
};

export default function ToolboxManagement() {
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const dateLocaleTag = locale === "fr" ? "fr-FR" : "en-US";

  const TYPE_META = useMemo(() => {
    const out: Record<string, { icon: typeof Wind; color: string; label: string }> = {};
    for (const [k, v] of Object.entries(TYPE_META_BASE)) {
      out[k] = { icon: v.icon, color: v.color, label: t(v.labelKey) };
    }
    return out;
  }, [t]);

  const [rows, setRows] = useState<ToolboxTrackingRow[]>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; display_name: string | null }>>([]);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [bucketFilter, setBucketFilter] = useState<ToolboxTrackingBucket | "all">("all");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [items, profs] = await Promise.all([loadToolboxTrackingRows(), loadToolboxAdminProfiles()]);
      setRows(items);
      setProfiles(profs);
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
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setSearch("");
    setFilterType("all");
    setBucketFilter("all");
  }, [selectedUserId]);

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from("toolbox_assignments").delete().eq("id", id);
    if (error) {
      toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("admin.toolboxMgmt.toastRemoved") });
    void loadData();
  };

  const usersWithTools = useMemo(() => {
    const ids = new Set(rows.map((r) => r.user_id));
    return profiles
      .filter((p) => ids.has(p.id))
      .sort((a, b) => (a.display_name || a.id).localeCompare(b.display_name || b.id, dateLocaleTag));
  }, [rows, profiles, dateLocaleTag]);

  const userSummaries = useMemo((): UserSummary[] => {
    const map = new Map<string, ToolboxTrackingRow[]>();
    for (const item of rows) {
      const list = map.get(item.user_id) ?? [];
      list.push(item);
      map.set(item.user_id, list);
    }
    return usersWithTools
      .map((profile) => {
        const items = map.get(profile.id) ?? [];
        return {
          userId: profile.id,
          userName: profile.display_name || t("users.noName"),
          toolCount: items.length,
          typeCount: new Set(items.map((i) => i.content_type)).size,
        };
      })
      .filter((u) => u.toolCount > 0);
  }, [rows, t, usersWithTools]);

  const scopedRows = useMemo(() => {
    if (!selectedUserId) return rows;
    return rows.filter((r) => r.user_id === selectedUserId);
  }, [rows, selectedUserId]);

  const bucketCounts = useMemo(() => {
    const counts = Object.fromEntries(BUCKET_ORDER.map((b) => [b, 0])) as Record<ToolboxTrackingBucket, number>;
    for (const row of scopedRows) counts[row.trackingBucket] += 1;
    return counts;
  }, [scopedRows]);

  const statAssigned = scopedRows.length;
  const statUsers = selectedUserId ? 1 : new Set(rows.map((r) => r.user_id)).size;
  const statTypes = new Set(scopedRows.map((r) => r.content_type)).size;

  const allTypes = useMemo(
    () => ["all", ...new Set(scopedRows.map((r) => r.content_type))],
    [scopedRows],
  );

  useEffect(() => {
    if (filterType !== "all" && !allTypes.includes(filterType)) {
      setFilterType("all");
    }
  }, [allTypes, filterType]);

  const filteredTools = scopedRows
    .filter((r) => bucketFilter === "all" || r.trackingBucket === bucketFilter)
    .filter((r) => filterType === "all" || r.content_type === filterType)
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const title = pickLocalizedText(locale as Locale, r.title_i18n, r.title).toLowerCase();
      const userName = (r.user_name || "").toLowerCase();
      return title.includes(q) || userName.includes(q);
    })
    .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime());

  const filteredUserSummaries = userSummaries.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.userName.toLowerCase().includes(q) || u.userId.toLowerCase().includes(q);
  });

  const selectedUserLabel =
    usersWithTools.find((p) => p.id === selectedUserId)?.display_name ||
    (selectedUserId ? selectedUserId.slice(0, 8) : null);

  const sectionTitle =
    selectedUserId
      ? t("admin.toolboxMgmt.userToolsTitle", { name: selectedUserLabel || t("users.noName") })
      : bucketFilter !== "all"
        ? t("admin.toolboxMgmt.toolsByStatusTitle")
        : t("admin.toolboxMgmt.browseUsersTitle");

  const sectionDesc = selectedUserId
    ? t("admin.toolboxMgmt.userToolsGridDesc")
    : bucketFilter !== "all"
      ? t("admin.toolboxMgmt.toolsByStatusDesc")
      : t("admin.toolboxMgmt.browseUsersDesc");

  const showToolGrid = Boolean(selectedUserId) || bucketFilter !== "all";
  const gridTools = showToolGrid ? filteredTools : [];
  const resultCount = showToolGrid ? gridTools.length : filteredUserSummaries.length;

  if (loading) {
    return <ToolboxLoadingBlock message={t("admin.toolboxMgmt.loading")} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      <header className="space-y-3 border-b border-border/40 pb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">
          {t("admin.hub.tab.toolboxUsers")}
        </p>
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">
          {t("admin.toolboxMgmt.title")}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("admin.toolboxMgmt.pageSubtitle")}</p>
      </header>

      <div className="ethereal-glass space-y-2 p-4 lg:p-5">
        <label htmlFor="toolbox-by-user-select" className={toolboxLabelClass}>
          {t("admin.toolboxMgmt.userLabel")}
        </label>
        <div className="relative max-w-xl">
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <select
            id="toolbox-by-user-select"
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
        {selectedUserLabel ? (
          <p className="text-xs text-muted-foreground">
            {t("admin.toolboxMgmt.selectedUserHint", { name: selectedUserLabel })}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("admin.toolboxMgmt.selectUserPrompt")}</p>
        )}
      </div>

      <ToolboxBucketFilterBar
        counts={bucketCounts}
        activeBucket={bucketFilter}
        onBucketChange={setBucketFilter}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ToolboxPageStat label={t("admin.toolboxMgmt.statAssigned")} value={statAssigned} icon={Package} />
        <ToolboxPageStat label={t("admin.toolboxMgmt.statUsers")} value={statUsers} icon={Library} />
        <ToolboxPageStat label={t("admin.toolboxMgmt.statTypes")} value={statTypes} icon={Sparkles} />
      </div>

      <ToolboxSection
        title={sectionTitle}
        description={sectionDesc}
        badge={t("admin.toolboxMgmt.resultsCount", {
          count: String(resultCount),
        })}
      >
        <div className="space-y-4">
          <ToolboxListToolbar
            search={search}
            onSearchChange={setSearch}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            typeOptions={allTypes}
            hideTypeFilter={!showToolGrid}
            searchId="toolbox-by-user-search"
            typeSelectId="toolbox-by-user-type"
          />

          {!showToolGrid ? (
            filteredUserSummaries.length === 0 ? (
              <ToolboxEmptyState
                icon={Users}
                title={t("admin.toolboxMgmt.emptyByUserTitle")}
                hint={t("admin.toolboxMgmt.emptyByUserHint")}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredUserSummaries.map((user) => (
                  <ToolboxUserDirectoryCard
                    key={user.userId}
                    userName={user.userName}
                    userId={user.userId}
                    toolCount={user.toolCount}
                    typeCount={user.typeCount}
                    onSelect={() => setSelectedUserId(user.userId)}
                  />
                ))}
              </div>
            )
          ) : gridTools.length === 0 ? (
            <ToolboxEmptyState
              icon={User}
              title={t("admin.toolboxMgmt.emptyByUserTitle")}
              hint={t("admin.toolboxMgmt.emptySelectedUserHint")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {gridTools.map((item) => {
                const meta = TYPE_META[item.content_type] || TYPE_META.course;
                return (
                  <ToolboxByUserToolCard
                    key={item.id}
                    row={item}
                    locale={locale as Locale}
                    dateLocaleTag={dateLocaleTag}
                    typeMeta={meta}
                    showUserName={!selectedUserId}
                    onDelete={() => void deleteAssignment(item.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </ToolboxSection>
    </div>
  );
}

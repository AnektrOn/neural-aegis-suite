import { useState, useEffect, useMemo } from "react";
import {
  Wind, Eye, Scan, Sparkles, Stars, Heart, BookOpen, Link as LinkIcon,
  Search, Trash2, Users, Package, ShieldAlert, Target, Library, Loader2, Wrench, FileJson,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import ToolboxAssignmentForm from "@/components/admin/ToolboxAssignmentForm";
import ToolboxItemPreview from "@/components/admin/ToolboxItemPreview";
import ToolboxJsonImportTab from "@/components/admin/toolbox/ToolboxJsonImportTab";
import {
  ToolboxEmptyState,
  ToolboxLoadingBlock,
  ToolboxPageStat,
  ToolboxPanel,
  ToolboxResourceCard,
  ToolboxSection,
  toolboxFieldClass,
  toolboxLabelClass,
} from "@/components/admin/toolbox/ToolboxAdminUi";
import { isLikelyVideoUrl } from "@/lib/video-links";
import { assignToolboxTemplateToUser, assignJournalPromptTemplateToUser } from "@/services/programBuilderService";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";
import { pickLocalizedText } from "@/lib/content-i18n";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import type { Locale } from "@/i18n/translations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolboxAssignment {
  id: string;
  user_id: string;
  template_id?: string | null;
  user_delivery_status?: string | null;
  content_type: string;
  title: string;
  title_i18n?: unknown;
  duration: string | null;
  description?: string | null;
  description_i18n?: unknown;
  assigned_at: string;
  external_url: string | null;
  widget_config: any;
  user_name?: string;
}

interface ToolboxTemplate {
  id: string;
  external_key?: string | null;
  content_type: string;
  title: string;
  title_i18n?: unknown;
  duration: string | null;
  description: string | null;
  description_i18n?: unknown;
  widget_config: any;
  is_active: boolean;
  created_at: string;
}

interface JournalTemplate {
  id: string;
  title: string;
  title_i18n?: unknown;
  prompt_text: string;
  prompt_text_i18n?: unknown;
  duration: string | null;
  is_active: boolean;
  created_at: string;
}

interface UserProfile {
  id: string;
  display_name: string | null;
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

function TypeBadge({ label }: { label: string }) {
  return (
    <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
      {label}
    </Badge>
  );
}

function DurationBadge({ duration }: { duration: string | null }) {
  return (
    <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-normal text-muted-foreground">
      {duration || "—"}
    </Badge>
  );
}

export default function ToolboxManagement() {
  const { user } = useAuth();
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

  const [assignments, setAssignments] = useState<ToolboxAssignment[]>([]);
  const [templates, setTemplates] = useState<ToolboxTemplate[]>([]);
  const [journalTemplates, setJournalTemplates] = useState<JournalTemplate[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);

  const [catalogSelectedUser, setCatalogSelectedUser] = useState("");
  const [catalogAssigning, setCatalogAssigning] = useState<string | null>(null);
  const [journalAssigning, setJournalAssigning] = useState<string | null>(null);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState("all");
  const [catalogDurationFilter, setCatalogDurationFilter] = useState("");
  const [catalogCreatedFrom, setCatalogCreatedFrom] = useState("");
  const [catalogCreatedTo, setCatalogCreatedTo] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [assignRes, profilesRes, templatesRes, journalTemplatesRes] = await Promise.all([
      supabase.from("toolbox_assignments").select("*").order("assigned_at", { ascending: false }),
      supabase.from("profiles").select("id, display_name"),
      supabase.from("toolbox_templates" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("journal_prompt_templates" as any).select("*").order("created_at", { ascending: false }),
    ]);
    const profs = (profilesRes.data || []) as UserProfile[];
    setProfiles(profs);
    const items = (assignRes.data || [])
      .filter((a: any) => !(a.content_type === "external_link" && isLikelyVideoUrl(a.external_url)))
      .map((a: any) => ({
        ...a,
        user_name: profs.find((p) => p.id === a.user_id)?.display_name || t("users.noName"),
      }));
    setAssignments(items);
    setTemplates(((templatesRes.data || []) as unknown) as ToolboxTemplate[]);
    setJournalTemplates(((journalTemplatesRes.data || []) as unknown) as JournalTemplate[]);
    setLoading(false);
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from("toolbox_assignments").delete().eq("id", id);
    if (error) toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
    else { toast({ title: t("admin.toolboxMgmt.toastRemoved") }); loadData(); }
  };

  const assignFromCatalog = async (templateId: string) => {
    if (!user || !catalogSelectedUser) {
      toast({ title: t("toast.error"), description: t("admin.toolboxMgmt.toastPickUserCatalog"), variant: "destructive" });
      return;
    }
    setCatalogAssigning(templateId);
    try {
      await assignToolboxTemplateToUser({ actorId: user.id, userId: catalogSelectedUser, templateId });
      toast({ title: t("admin.toolboxMgmt.toastAssignedTitle"), description: t("admin.toolboxMgmt.toastAssignedDesc") });
      loadData();
    } catch (e: any) {
      toast({ title: t("toast.error"), description: e.message, variant: "destructive" });
    } finally {
      setCatalogAssigning(null);
    }
  };

  const assignJournalFromCatalog = async (templateId: string) => {
    if (!user || !catalogSelectedUser) {
      toast({ title: t("toast.error"), description: t("admin.toolboxMgmt.toastPickUserCatalog"), variant: "destructive" });
      return;
    }
    setJournalAssigning(templateId);
    try {
      await assignJournalPromptTemplateToUser({ actorId: user.id, userId: catalogSelectedUser, templateId });
      toast({ title: t("admin.toolboxMgmt.toastJournalAssignedTitle"), description: t("admin.toolboxMgmt.toastJournalAssignedDesc") });
      loadData();
    } catch (e: any) {
      toast({ title: t("toast.error"), description: e.message, variant: "destructive" });
    } finally {
      setJournalAssigning(null);
    }
  };

  const allTypes = ["all", ...new Set(assignments.map((a) => a.content_type))];
  const catalogTypes = ["all", ...new Set(templates.map((tmpl) => tmpl.content_type))];
  const filteredTemplates = templates.filter((tmpl) => {
    const byCategory = catalogCategoryFilter === "all" || tmpl.content_type === catalogCategoryFilter;
    const byDuration =
      !catalogDurationFilter.trim() ||
      (tmpl.duration || "").toLowerCase().includes(catalogDurationFilter.toLowerCase().trim());
    const created = new Date(tmpl.created_at);
    const fromOk = !catalogCreatedFrom || created >= new Date(`${catalogCreatedFrom}T00:00:00`);
    const toOk = !catalogCreatedTo || created <= new Date(`${catalogCreatedTo}T23:59:59`);
    return byCategory && byDuration && fromOk && toOk;
  });

  const filtered = assignments
    .filter((a) => filterType === "all" || a.content_type === filterType)
    .filter((a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const titleFr = pickLocalizedText("fr", (a as any).title_i18n, a.title).toLowerCase();
      const titleEn = pickLocalizedText("en", (a as any).title_i18n, a.title).toLowerCase();
      const name = (a.user_name || "").toLowerCase();
      return name.includes(q) || titleFr.includes(q) || titleEn.includes(q);
    });

  const catalogUserName =
    profiles.find((p) => p.id === catalogSelectedUser)?.display_name || t("users.noName");

  const tabTriggerClass =
    "h-11 rounded-md px-3 text-sm font-medium text-text-secondary data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary data-[state=active]:shadow-sm sm:px-4";

  const filterChipClass = (active: boolean) =>
    cn(
      "h-10 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border/60 bg-bg-elevated/60 text-text-secondary hover:border-primary/30 hover:text-text-primary",
    );

  const renderCatalogItem = (
    tmpl: ToolboxTemplate,
    isAssigning: boolean,
    onAssign: () => void,
  ) => {
    const meta = TYPE_META[tmpl.content_type] || TYPE_META.course;
    const title = pickCatalogTemplateDisplayTitle(locale as Locale, {
      title: tmpl.title,
      title_i18n: tmpl.title_i18n as any,
    });
    const description = pickWidgetCatalogCopy(locale as Locale, tmpl.description_i18n as any, tmpl.description);

    return (
      <ToolboxResourceCard
        key={tmpl.id}
        icon={meta.icon}
        iconClassName={meta.color}
        title={title}
        badges={
          <>
            <TypeBadge label={meta.label} />
            <DurationBadge duration={tmpl.duration} />
          </>
        }
        description={description || null}
        footer={
          <>
            <ToolboxItemPreview
              contentType={tmpl.content_type}
              title={title}
              description={description}
              widgetConfig={tmpl.widget_config}
            />
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              disabled={isAssigning || !catalogSelectedUser}
              onClick={onAssign}
            >
              {isAssigning ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {t("admin.toolboxMgmt.assignAction")}
            </Button>
          </>
        }
      />
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 pb-16 md:space-y-12">
      <header className="space-y-4 border-b border-border/40 pb-8 md:pb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">
          {t("admin.toolboxMgmt.kicker")}
        </p>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
              {t("admin.toolboxMgmt.pageTitle")}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-text-secondary">
              {t("admin.toolboxMgmt.pageSubtitle")}
            </p>
          </div>
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary md:size-16">
            <Wrench className="size-7 md:size-8" strokeWidth={1.5} aria-hidden />
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("admin.toolboxMgmt.kicker")}>
        <ToolboxPageStat label={t("admin.toolboxMgmt.statAssigned")} value={assignments.length} icon={Package} />
        <ToolboxPageStat
          label={t("admin.toolboxMgmt.statUsers")}
          value={new Set(assignments.map((a) => a.user_id)).size}
          icon={Users}
        />
        <ToolboxPageStat label={t("admin.toolboxMgmt.statCatalogTemplates")} value={templates.length} icon={Library} />
      </section>

      <Tabs defaultValue="catalog" className="space-y-8 md:space-y-10">
        <TabsList className="ethereal-glass grid h-auto w-full grid-cols-1 gap-2 p-2 sm:grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="catalog" className={tabTriggerClass}>
            <Library className="size-4 shrink-0" aria-hidden />
            {t("admin.toolboxMgmt.tabCatalog")}
          </TabsTrigger>
          <TabsTrigger value="assign" className={tabTriggerClass}>
            <Package className="size-4 shrink-0" aria-hidden />
            {t("admin.toolboxMgmt.assignHeading")}
          </TabsTrigger>
          <TabsTrigger value="list" className={tabTriggerClass}>
            <Users className="size-4 shrink-0" aria-hidden />
            {t("admin.toolboxMgmt.tabActiveAssignments")}
          </TabsTrigger>
          <TabsTrigger value="import" className={tabTriggerClass}>
            <FileJson className="size-4 shrink-0" aria-hidden />
            {t("admin.toolboxMgmt.tabImport")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-0 space-y-10 focus-visible:outline-none">
          <ToolboxPanel
            title={t("admin.toolboxMgmt.catalogStepUser")}
            description={t("admin.toolboxMgmt.catalogStepUserDesc")}
            highlight={!catalogSelectedUser}
          >
            <div className="max-w-xl space-y-3">
              <label htmlFor="toolbox-catalog-user" className={toolboxLabelClass}>
                {t("admin.toolboxMgmt.catalogTargetUser")}
              </label>
              <select
                id="toolbox-catalog-user"
                value={catalogSelectedUser}
                onChange={(e) => setCatalogSelectedUser(e.target.value)}
                className={toolboxFieldClass}
              >
                <option value="">{t("admin.toolboxMgmt.catalogSelectUser")}</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.display_name || t("users.noName")}</option>
                ))}
              </select>
              {!catalogSelectedUser ? (
                <p className="text-sm text-accent-warning">{t("admin.toolboxMgmt.catalogNoUserHint")}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-text-primary">{catalogUserName}</span>
                  {" — "}
                  {t("admin.toolboxMgmt.catalogAssignTitle").toLowerCase()}
                </p>
              )}
            </div>
          </ToolboxPanel>

          <ToolboxPanel
            title={t("admin.toolboxMgmt.catalogStepFilters")}
            description={t("admin.toolboxMgmt.catalogStepFiltersDesc")}
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <label htmlFor="toolbox-catalog-category" className={toolboxLabelClass}>
                  {t("admin.toolboxMgmt.catalogCategory")}
                </label>
                <select
                  id="toolbox-catalog-category"
                  value={catalogCategoryFilter}
                  onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                  className={toolboxFieldClass}
                >
                  {catalogTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === "all" ? t("admin.toolboxMgmt.filterAll") : TYPE_META[type]?.label || type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="toolbox-catalog-duration" className={toolboxLabelClass}>
                  {t("admin.toolboxMgmt.catalogDuration")}
                </label>
                <input
                  id="toolbox-catalog-duration"
                  type="text"
                  value={catalogDurationFilter}
                  onChange={(e) => setCatalogDurationFilter(e.target.value)}
                  placeholder={t("admin.toolboxMgmt.catalogDurationPlaceholder")}
                  className={toolboxFieldClass}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="toolbox-catalog-from" className={toolboxLabelClass}>
                  {t("admin.toolboxMgmt.catalogCreatedFrom")}
                </label>
                <input
                  id="toolbox-catalog-from"
                  type="date"
                  value={catalogCreatedFrom}
                  onChange={(e) => setCatalogCreatedFrom(e.target.value)}
                  className={toolboxFieldClass}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="toolbox-catalog-to" className={toolboxLabelClass}>
                  {t("admin.toolboxMgmt.catalogCreatedTo")}
                </label>
                <input
                  id="toolbox-catalog-to"
                  type="date"
                  value={catalogCreatedTo}
                  onChange={(e) => setCatalogCreatedTo(e.target.value)}
                  className={toolboxFieldClass}
                />
              </div>
            </div>
          </ToolboxPanel>

          {loading ? (
            <ToolboxLoadingBlock message={t("admin.toolboxMgmt.loadingCatalog")} />
          ) : templates.length === 0 && journalTemplates.length === 0 ? (
            <ToolboxEmptyState
              icon={Library}
              title={t("admin.toolboxMgmt.catalogEmptyTitle")}
              hint={t("admin.toolboxMgmt.catalogEmptyHint")}
            />
          ) : (
            <div className="space-y-12">
              {templates.length > 0 && (
                <ToolboxSection
                  title={t("admin.toolboxMgmt.catalogResults")}
                  badge={t("admin.toolboxMgmt.catalogToolsHeading", {
                    current: filteredTemplates.length,
                    total: templates.length,
                  })}
                >
                  <div className="grid gap-4 lg:gap-5">
                    {filteredTemplates.map((tmpl) =>
                      renderCatalogItem(tmpl, catalogAssigning === tmpl.id, () => assignFromCatalog(tmpl.id)),
                    )}
                  </div>
                </ToolboxSection>
              )}

              {journalTemplates.length > 0 && (
                <ToolboxSection
                  title={t("admin.toolboxMgmt.catalogJournalHeading", { n: journalTemplates.length })}
                >
                  <div className="grid gap-4 lg:gap-5">
                    {journalTemplates.map((jt) => {
                      const isAssigning = journalAssigning === jt.id;
                      const title = pickCatalogTemplateDisplayTitle(locale as Locale, {
                        title: jt.title,
                        title_i18n: jt.title_i18n as any,
                      });
                      const prompt = pickLocalizedText(locale as Locale, jt.prompt_text_i18n as any, jt.prompt_text);

                      return (
                        <ToolboxResourceCard
                          key={jt.id}
                          icon={BookOpen}
                          iconClassName="text-neural-accent"
                          title={title}
                          badges={
                            <>
                              <TypeBadge label={TYPE_META.journal_prompt.label} />
                              {jt.duration ? <DurationBadge duration={jt.duration} /> : null}
                            </>
                          }
                          description={prompt}
                          footer={
                            <>
                              <ToolboxItemPreview
                                contentType="journal_prompt"
                                title={title}
                                widgetConfig={{ prompt }}
                              />
                              <Button
                                type="button"
                                size="lg"
                                className="w-full sm:w-auto"
                                disabled={isAssigning || !catalogSelectedUser}
                                onClick={() => assignJournalFromCatalog(jt.id)}
                              >
                                {isAssigning ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                                {t("admin.toolboxMgmt.assignAction")}
                              </Button>
                            </>
                          }
                        />
                      );
                    })}
                  </div>
                </ToolboxSection>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assign" className="mt-0 space-y-8 focus-visible:outline-none">
          <ToolboxPanel
            title={t("admin.toolboxMgmt.assignHeading")}
            description={t("admin.toolboxMgmt.assignCustomDesc")}
          >
            <div className="max-w-xl space-y-3">
              <label htmlFor="toolbox-assign-user" className={toolboxLabelClass}>
                {t("admin.toolboxMgmt.userLabel")}
              </label>
              <select
                id="toolbox-assign-user"
                value={selectedUser || ""}
                onChange={(e) => setSelectedUser(e.target.value || null)}
                className={toolboxFieldClass}
              >
                <option value="">{t("admin.toolboxMgmt.selectUserPlaceholder")}</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.display_name || t("users.noName")}</option>
                ))}
              </select>
            </div>
          </ToolboxPanel>

          {selectedUser ? (
            <div className="ethereal-glass p-5 md:p-8">
              <ToolboxAssignmentForm userId={selectedUser} onAssigned={loadData} />
            </div>
          ) : (
            <ToolboxEmptyState
              icon={Users}
              title={t("admin.toolboxMgmt.selectUserPlaceholder")}
              hint={t("admin.toolboxMgmt.assignCustomDesc")}
            />
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-0 space-y-8 focus-visible:outline-none">
          <ToolboxPanel
            title={t("admin.toolboxMgmt.listFiltersTitle")}
            description={t("admin.toolboxMgmt.listFiltersDesc")}
          >
            <div className="space-y-5">
              <div className="relative max-w-xl">
                <label htmlFor="toolbox-assignments-search" className="sr-only">
                  {t("admin.toolboxMgmt.assignmentsSearchLabel")}
                </label>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="toolbox-assignments-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("common.searchByNameOrTool")}
                  autoComplete="off"
                  className={cn(toolboxFieldClass, "pl-11")}
                />
              </div>
              <div className="space-y-3">
                <p className={toolboxLabelClass}>{t("admin.toolboxMgmt.filterByType")}</p>
                <div className="flex flex-wrap gap-2">
                  {allTypes.map((typeKey) => (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => setFilterType(typeKey)}
                      className={filterChipClass(filterType === typeKey)}
                    >
                      {typeKey === "all" ? t("admin.toolboxMgmt.filterAll") : TYPE_META[typeKey]?.label || typeKey}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ToolboxPanel>

          {loading ? (
            <ToolboxLoadingBlock message={t("general.loading")} />
          ) : filtered.length === 0 ? (
            <ToolboxEmptyState icon={Package} title={t("common.noToolsAssigned")} />
          ) : (
            <div className="space-y-4">
              <div
                className="ethereal-glass hidden gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary lg:grid"
                style={{ gridTemplateColumns: "1fr 160px 140px 120px 140px" }}
              >
                <span>{t("admin.toolboxMgmt.listColumnTool")}</span>
                <span>{t("admin.toolboxMgmt.listColumnUser")}</span>
                <span>{t("admin.toolboxMgmt.listColumnType")}</span>
                <span>{t("admin.toolboxMgmt.listColumnDate")}</span>
                <span className="text-right">{t("admin.toolboxMgmt.listColumnActions")}</span>
              </div>

              <ul className="grid gap-4 lg:gap-3">
                {filtered.map((item) => {
                  const meta = TYPE_META[item.content_type] || TYPE_META.course;
                  const title = pickLocalizedText(locale as Locale, (item as any).title_i18n, item.title);
                  const dateStr = new Date(item.assigned_at).toLocaleDateString(dateLocaleTag, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <li key={item.id}>
                      <div className="ethereal-glass lg:grid lg:items-center lg:gap-4 lg:px-6 lg:py-4" style={{ gridTemplateColumns: "1fr 160px 140px 120px 140px" }}>
                        <div className="flex gap-4 border-b border-border/40 p-5 lg:border-0 lg:p-0">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/50 lg:hidden">
                            <meta.icon className={cn("size-5", meta.color)} strokeWidth={1.5} aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1 space-y-2 lg:space-y-1">
                            <p className="text-base font-semibold leading-snug text-text-primary">{title}</p>
                            <div className="flex flex-wrap gap-2 lg:hidden">
                              <TypeBadge label={meta.label} />
                              <DurationBadge duration={item.duration} />
                            </div>
                            <p className="text-sm text-muted-foreground lg:hidden">
                              {item.user_name} · {dateStr}
                            </p>
                          </div>
                        </div>

                        <p className="hidden truncate px-0 text-sm text-text-primary lg:block">{item.user_name}</p>
                        <div className="hidden lg:block">
                          <TypeBadge label={meta.label} />
                        </div>
                        <p className="hidden text-sm text-muted-foreground lg:block">{dateStr}</p>

                        <div className="flex flex-col gap-3 border-t border-border/40 p-5 sm:flex-row sm:items-center sm:justify-end lg:border-0 lg:p-0">
                          <ToolboxItemPreview
                            contentType={item.content_type}
                            title={title}
                            description={pickWidgetCatalogCopy(locale as Locale, item.description_i18n as any, item.description)}
                            widgetConfig={item.widget_config}
                            externalUrl={item.external_url}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-11 shrink-0 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                            onClick={() => deleteAssignment(item.id)}
                            aria-label={t("admin.toolboxMgmt.removeTitle")}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="import" className="mt-0 focus-visible:outline-none">
          <ToolboxJsonImportTab
            profiles={profiles}
            templates={templates}
            assignments={assignments.map((a) => ({
              user_id: a.user_id,
              template_id: a.template_id ?? null,
            }))}
            onImported={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

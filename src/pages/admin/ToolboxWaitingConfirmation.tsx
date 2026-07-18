import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Send, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import ToolboxItemPreview from "@/components/admin/ToolboxItemPreview";
import {
  ToolboxEmptyState,
  ToolboxLoadingBlock,
  ToolboxSection,
} from "@/components/admin/toolbox/ToolboxAdminUi";
import ToolboxUserFilterBar from "@/features/toolbox-admin/ToolboxUserFilterBar";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";
import { pickLocalizedText } from "@/lib/content-i18n";
import {
  loadToolboxAdminProfiles,
  loadWaitingAssignments,
  publishWaitingAssignments,
  type ToolboxAdminAssignment,
} from "@/services/toolboxAdminService";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface UserGroup {
  userId: string;
  userName: string;
  items: ToolboxAdminAssignment[];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function resolveTargetUserId(item: ToolboxAdminAssignment): string {
  return item.user_id;
}

export default function ToolboxWaitingConfirmation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [assignments, setAssignments] = useState<ToolboxAdminAssignment[]>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; display_name: string | null }>>([]);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, profs] = await Promise.all([loadWaitingAssignments(), loadToolboxAdminProfiles()]);
      setAssignments(rows);
      setProfiles(profs);
      setSelectedIds(new Set());
    } catch (error: unknown) {
      toast({ title: t("toast.error"), description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return assignments
      .filter((a) => (selectedUserId ? a.user_id === selectedUserId : true))
      .filter((a) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const title = pickLocalizedText(locale as Locale, a.title_i18n, a.title).toLowerCase();
        const name = (a.user_name || "").toLowerCase();
        const uid = a.user_id.toLowerCase();
        return name.includes(q) || title.includes(q) || uid.includes(q);
      });
  }, [assignments, locale, search, selectedUserId]);

  const groups = useMemo((): UserGroup[] => {
    const map = new Map<string, ToolboxAdminAssignment[]>();
    for (const item of filtered) {
      const list = map.get(item.user_id) ?? [];
      list.push(item);
      map.set(item.user_id, list);
    }
    return Array.from(map.entries())
      .map(([userId, items]) => ({
        userId,
        userName: items[0]?.user_name ?? t("users.noName"),
        items: items.sort(
          (a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime(),
        ),
      }))
      .sort((a, b) => a.userName.localeCompare(b.userName));
  }, [filtered, t]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllForUser = (userId: string) => {
    const ids = filtered.filter((a) => a.user_id === userId).map((a) => a.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  };

  const handlePublishSelected = async () => {
    if (!user || selectedIds.size === 0) return;
    setPublishing(true);
    try {
      const published = await publishWaitingAssignments({
        assignmentIds: Array.from(selectedIds),
        actorId: user.id,
        assignments,
      });
      toast({
        title: t("admin.toolboxReview.publishSuccess"),
        description: t("admin.toolboxReview.publishSuccessDesc", { count: String(published) }),
      });
      await load();
    } catch (error: unknown) {
      toast({ title: t("toast.error"), description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishUser = async (userId: string) => {
    if (!user) return;
    const ids = filtered.filter((a) => a.user_id === userId).map((a) => a.id);
    if (!ids.length) return;
    setPublishing(true);
    try {
      const published = await publishWaitingAssignments({
        assignmentIds: ids,
        actorId: user.id,
        assignments,
      });
      toast({
        title: t("admin.toolboxReview.publishSuccess"),
        description: t("admin.toolboxReview.publishSuccessDesc", { count: String(published) }),
      });
      await load();
    } catch (error: unknown) {
      toast({ title: t("toast.error"), description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <ToolboxLoadingBlock message={t("admin.toolboxReview.loading")} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      <header className="space-y-3 border-b border-border/40 pb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">
          {t("admin.hub.tab.toolboxReviewQueue")}
        </p>
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">{t("admin.toolboxReview.title")}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("admin.toolboxReview.description")}</p>
      </header>

      <ToolboxSection
        title={t("admin.toolboxReview.sectionTitle")}
        description={t("admin.toolboxReview.sectionDesc")}
        badge={t("admin.toolboxReview.pendingCount", { count: String(filtered.length) })}
      >
        <ToolboxUserFilterBar
          profiles={profiles}
          search={search}
          onSearchChange={setSearch}
          selectedUserId={selectedUserId}
          onSelectedUserChange={setSelectedUserId}
          searchId="toolbox-review-search"
        />

        {selectedIds.size > 0 ? (
          <div className="flex flex-wrap items-center gap-3 px-1 pt-4">
            <Badge variant="secondary">{t("admin.toolboxReview.selectedCount", { count: String(selectedIds.size) })}</Badge>
            <Button type="button" disabled={publishing} onClick={() => void handlePublishSelected()}>
              {publishing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
              {t("admin.toolboxReview.publishSelected")}
            </Button>
          </div>
        ) : null}

        {groups.length === 0 ? (
          <ToolboxEmptyState
            icon={User}
            title={t("admin.toolboxReview.emptyTitle")}
            hint={t("admin.toolboxReview.emptyHint")}
          />
        ) : (
          <Accordion type="multiple" defaultValue={groups.length === 1 ? [groups[0].userId] : []} className="mt-4 space-y-3">
            {groups.map((group) => (
              <AccordionItem
                key={group.userId}
                value={group.userId}
                className="ethereal-glass overflow-hidden rounded-2xl border border-border/40 px-4 lg:px-6"
              >
                <AccordionTrigger className="py-5 hover:no-underline">
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-4 pr-2 text-left">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                        <User className="size-4 text-muted-foreground" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-text-primary">{group.userName}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{group.userId}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{group.items.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <div className="mb-4 flex flex-wrap gap-2 border-t border-border/40 pt-4">
                    <Button type="button" size="sm" variant="outline" onClick={() => selectAllForUser(group.userId)}>
                      {t("admin.toolboxReview.selectAllUser")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={publishing}
                      onClick={() => void handlePublishUser(group.userId)}
                    >
                      {publishing ? <Loader2 className="mr-2 size-3 animate-spin" /> : <Send className="mr-2 size-3" />}
                      {t("admin.toolboxReview.publishUser")}
                    </Button>
                  </div>
                  <ul className="space-y-3">
                    {group.items.map((item) => {
                      const title = pickCatalogTemplateDisplayTitle(locale as Locale, {
                        title: item.title,
                        title_i18n: item.title_i18n,
                      });
                      const checked = selectedIds.has(item.id);
                      return (
                        <li
                          key={item.id}
                          className="flex flex-col gap-3 rounded-xl border border-border/30 bg-background/40 p-4 lg:flex-row lg:items-start lg:justify-between"
                        >
                          <div className="flex min-w-0 flex-1 gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelection(item.id)}
                              className="mt-1 size-4 shrink-0"
                              aria-label={title}
                            />
                            <div className="min-w-0 space-y-1">
                              <p className="font-medium text-text-primary">{title}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.content_type} · {resolveTargetUserId(item).slice(0, 8)}…
                              </p>
                            </div>
                          </div>
                          <ToolboxItemPreview
                            contentType={item.content_type}
                            title={item.title}
                            title_i18n={item.title_i18n}
                            description={item.description}
                            description_i18n={item.description_i18n}
                            widgetConfig={item.widget_config}
                            externalUrl={item.external_url}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </ToolboxSection>
    </div>
  );
}

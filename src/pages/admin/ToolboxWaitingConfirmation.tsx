import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  bootstrapContentTypeDefinitions,
  createProposalFromDefinition,
  listContentTypeDefinitions,
  listWidgetProposals,
  publishProposal,
  validateAgainstContentType,
  type WidgetProposalRow,
} from "@/services/toolboxPublishService";
import { supabase } from "@/integrations/supabase/client";
import ToolboxItemPreview from "@/components/admin/ToolboxItemPreview";
import { TOOLBOX_TYPE_META } from "@/lib/toolbox-renderer-registry";
import type { ToolboxContentTypeDefinition } from "@/lib/toolbox-content-type-definitions";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";
import type { Locale } from "@/i18n/translations";

interface Profile {
  id: string;
  display_name: string | null;
}

type ProposalSelectionState = Record<string, string[]>;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function ToolboxWaitingConfirmation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [creatingFromDefinition, setCreatingFromDefinition] = useState<string | null>(null);
  const [definitions, setDefinitions] = useState<ToolboxContentTypeDefinition[]>([]);
  const [proposals, setProposals] = useState<WidgetProposalRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUsersByProposal, setSelectedUsersByProposal] = useState<ProposalSelectionState>({});

  const defBySlug = useMemo(
    () => Object.fromEntries(definitions.map((def) => [def.slug, def])),
    [definitions],
  );

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await bootstrapContentTypeDefinitions(user.id);
      const [defs, rows, profilesRes] = await Promise.all([
        listContentTypeDefinitions(),
        listWidgetProposals(),
        supabase.from("profiles").select("id, display_name"),
      ]);
      setDefinitions(defs);
      setProposals(rows);
      setProfiles((profilesRes.data || []) as Profile[]);
      setSelectedUsersByProposal((prev) => {
        const next = { ...prev };
        for (const row of rows) {
          if (!next[row.id]) {
            next[row.id] = row.suggested_user_ids || [];
          }
        }
        return next;
      });
    } catch (error: unknown) {
      toast({ title: t("toast.error"), description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, t, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const queue = proposals.filter((p) => p.status === "pending_review");

  const toggleUserSelection = (proposalId: string, userId: string) => {
    setSelectedUsersByProposal((prev) => {
      const current = new Set(prev[proposalId] || []);
      if (current.has(userId)) current.delete(userId);
      else current.add(userId);
      return { ...prev, [proposalId]: Array.from(current) };
    });
  };

  const createFromDefinition = async (def: ToolboxContentTypeDefinition) => {
    if (!user) return;
    setCreatingFromDefinition(def.slug);
    try {
      await createProposalFromDefinition({ actorId: user.id, def });
      toast({ title: "Proposal added", description: `${def.label_en} queued for review.` });
      await load();
    } catch (error: unknown) {
      toast({ title: t("toast.error"), description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setCreatingFromDefinition(null);
    }
  };

  const handlePublish = async (proposal: WidgetProposalRow) => {
    if (!user) return;
    const def = defBySlug[proposal.content_type_slug];
    if (!def) {
      toast({ title: t("toast.error"), description: `Missing content type definition: ${proposal.content_type_slug}`, variant: "destructive" });
      return;
    }
    const selectedUserIds = selectedUsersByProposal[proposal.id] || [];
    if (selectedUserIds.length === 0) {
      toast({ title: t("toast.error"), description: "Select at least one user.", variant: "destructive" });
      return;
    }
    const issues = validateAgainstContentType(def, proposal);
    if (issues.length > 0) {
      toast({ title: t("toast.error"), description: issues.join(" "), variant: "destructive" });
      return;
    }

    setPublishingId(proposal.id);
    try {
      await publishProposal({
        actorId: user.id,
        proposal,
        selectedUserIds,
        createTemplate: true,
      });
      toast({ title: "Published", description: `${proposal.title} assigned to ${selectedUserIds.length} user(s).` });
      await load();
    } catch (error: unknown) {
      toast({ title: t("toast.error"), description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setPublishingId(null);
    }
  };

  if (loading) {
    return (
      <div className="ethereal-glass p-12 flex justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <p className="text-neural-label mb-2">Toolbox orchestration</p>
        <h1 className="text-neural-title text-3xl text-foreground">Toolbox Waiting Confirmation</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Review pending proposals, test every renderer and publish to selected users.
        </p>
      </div>

      <div className="ethereal-glass p-4 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Content type gallery ({definitions.length})
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {definitions.map((def) => {
            const actionLoading = creatingFromDefinition === def.slug;
            return (
              <div key={def.slug} className="rounded-xl border border-border/30 bg-background/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {locale === "fr" ? def.label_fr : def.label_en}
                  </p>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{def.renderer_kind}</span>
                </div>
                <p className="text-xs text-muted-foreground">{def.slug}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {locale === "fr" ? def.description_fr : def.description_en}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <ToolboxItemPreview
                    contentType={def.slug}
                    title={locale === "fr" ? def.default_title_fr : def.default_title_en}
                    description={locale === "fr" ? def.description_fr : def.description_en}
                    widgetConfig={def.sample_config}
                    definitionsBySlug={defBySlug}
                  />
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => createFromDefinition(def)}
                    className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded border border-primary/30 text-primary disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Add to queue
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Pending proposals ({queue.length})
        </p>
        {queue.length === 0 ? (
          <div className="ethereal-glass p-8 text-center text-sm text-muted-foreground">
            No pending proposal. Add one from the gallery.
          </div>
        ) : (
          queue.map((proposal) => {
            const def = defBySlug[proposal.content_type_slug];
            const selectedUserIds = selectedUsersByProposal[proposal.id] || [];
            const localizedTitle =
              pickCatalogTemplateDisplayTitle(locale as Locale, {
                title: proposal.title,
                title_i18n: proposal.title_i18n as Record<string, string> | undefined,
              }) || proposal.title;

            const meta = TOOLBOX_TYPE_META[proposal.content_type_slug] || TOOLBOX_TYPE_META.micro_practice;

            return (
              <div key={proposal.id} className="ethereal-glass p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/30 border border-border/20 flex items-center justify-center shrink-0">
                    <meta.icon size={16} strokeWidth={1.5} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{localizedTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">{proposal.content_type_slug}</p>
                    {proposal.reasoning ? (
                      <p className="text-xs text-muted-foreground mt-2">{proposal.reasoning}</p>
                    ) : null}
                  </div>
                  <ToolboxItemPreview
                    contentType={proposal.content_type_slug}
                    contentTypeSlug={proposal.content_type_slug}
                    title={localizedTitle}
                    description={proposal.reasoning ?? undefined}
                    widgetConfig={proposal.widget_config}
                    externalUrl={proposal.external_url}
                    definitionsBySlug={defBySlug}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Assign to users</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {profiles.map((profile) => (
                      <label key={profile.id} className="flex items-center gap-2 text-xs text-foreground">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(profile.id)}
                          onChange={() => toggleUserSelection(proposal.id, profile.id)}
                          className="h-4 w-4"
                        />
                        <span>{profile.display_name || t("users.noName")}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={publishingId === proposal.id}
                    onClick={() => handlePublish(proposal)}
                    className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded border border-primary/30 text-primary disabled:opacity-50"
                  >
                    {publishingId === proposal.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    Publish
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {def?.renderer_kind === "native"
                      ? "Native renderer"
                      : "Composed renderer (schema-driven)"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

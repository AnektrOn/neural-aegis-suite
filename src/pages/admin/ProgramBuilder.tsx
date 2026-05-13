import { useEffect, useMemo, useState } from "react";
import { BookOpen, Boxes, BrainCircuit, FileJson, Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseTagList, joinTagList } from "@/lib/program-domain";
import { isLikelyVideoUrl } from "@/lib/video-links";
import {
  TOOLBOX_CONTENT_TYPES,
  assignHabitTemplateToUser,
  assignJournalPromptTemplateToUser,
  assignToolboxTemplateToUser,
  createHabitTemplate,
  createJournalPromptTemplate,
  createToolboxTemplate,
  deleteCatalogItem,
  getArchetypeSuggestionsForUser,
  getProgramKpiSummary,
  getUserAssignmentStatus,
  listCatalogData,
  listObservabilityFeed,
  runToolboxCatalogImport,
  updateHabitTemplate,
  updateJournalPromptTemplate,
  updateToolboxTemplate,
  validateToolboxCatalogPayload,
} from "@/services/programBuilderService";
import { useLanguage } from "@/i18n/LanguageContext";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";
import type { Locale } from "@/i18n/translations";

type Profile = { id: string; display_name: string | null };

const inputClass =
  "w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors";

export default function ProgramBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useLanguage();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [catalog, setCatalog] = useState<{ habits: any[]; toolbox: any[]; journal: any[] }>({
    habits: [],
    toolbox: [],
    journal: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [habitForm, setHabitForm] = useState({
    external_key: "",
    name: "",
    category: "Mind",
    description: "",
    archetypes: "",
    shadows: "",
  });
  const [toolboxForm, setToolboxForm] = useState({
    external_key: "",
    content_type: "breathwork",
    title: "",
    duration: "",
    description: "",
    external_url: "",
    widget_config: "{}",
    archetypes: "",
    shadows: "",
  });
  const [journalForm, setJournalForm] = useState({
    external_key: "",
    title: "",
    prompt_text: "",
    duration: "10 min",
    archetypes: "",
    shadows: "",
  });
  const [assignSelection, setAssignSelection] = useState({
    habitTemplateId: "",
    toolboxTemplateId: "",
    journalTemplateId: "",
  });
  const [importJson, setImportJson] = useState(
    JSON.stringify(
      {
        version: "toolbox-catalog-v1",
        toolbox_items: [],
        habit_items: [],
        journal_items: [],
      },
      null,
      2
    )
  );
  const [importReport, setImportReport] = useState<any>(null);
  const [observability, setObservability] = useState<{ events: any[]; imports: any[] }>({ events: [], imports: [] });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any | null>(null);
  const [statusFeed, setStatusFeed] = useState<{ habits: any[]; toolbox: any[]; journals: any[] } | null>(null);
  const [catalogFilterType, setCatalogFilterType] = useState<"all" | "habit" | "toolbox" | "journal">("all");
  const [catalogFilterTag, setCatalogFilterTag] = useState("");
  const [editRow, setEditRow] = useState<{ kind: "habit" | "toolbox" | "journal"; id: string } | null>(null);
  const [editPayload, setEditPayload] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [{ habits, toolbox, journal }, profileRes, feed, kpi] = await Promise.all([
        listCatalogData(),
        supabase.from("profiles").select("id, display_name").order("display_name", { ascending: true }),
        listObservabilityFeed(),
        getProgramKpiSummary(),
      ]);
      if (profileRes.error) throw profileRes.error;
      setCatalog({ habits, toolbox, journal });
      setProfiles((profileRes.data || []) as Profile[]);
      setObservability(feed);
      setKpis(kpi);
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setStatusFeed(null);
      return;
    }
    getUserAssignmentStatus(selectedUserId)
      .then((data) => setStatusFeed(data as any))
      .catch(() => setStatusFeed(null));
  }, [selectedUserId]);

  const profileName = useMemo(
    () => profiles.find((p) => p.id === selectedUserId)?.display_name || "—",
    [profiles, selectedUserId]
  );

  const filteredCatalog = useMemo(() => {
    const tagFilter = catalogFilterTag.trim().toLowerCase();
    const tagMatch = (row: any) => {
      if (!tagFilter) return true;
      const tags = [...(row.archetype_targets || []), ...(row.shadow_targets || [])]
        .join(" ")
        .toLowerCase();
      return tags.includes(tagFilter);
    };
    return {
      habits:
        catalogFilterType === "all" || catalogFilterType === "habit"
          ? catalog.habits.filter(tagMatch)
          : [],
      toolbox:
        catalogFilterType === "all" || catalogFilterType === "toolbox"
          ? catalog.toolbox.filter((row) => tagMatch(row) && !(row.content_type === "external_link" && isLikelyVideoUrl(row.external_url)))
          : [],
      journal:
        catalogFilterType === "all" || catalogFilterType === "journal"
          ? catalog.journal.filter(tagMatch)
          : [],
    };
  }, [catalog, catalogFilterType, catalogFilterTag]);

  const createCatalogItems = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      if (habitForm.name.trim()) {
        await createHabitTemplate(
          {
            external_key: habitForm.external_key || null,
            name: habitForm.name,
            category: habitForm.category,
            description: habitForm.description || null,
            archetype_targets: parseTagList(habitForm.archetypes),
            shadow_targets: parseTagList(habitForm.shadows),
          },
          user.id
        );
      }
      if (toolboxForm.title.trim()) {
        let parsedWidget: Record<string, unknown> = {};
        try {
          parsedWidget = JSON.parse(toolboxForm.widget_config || "{}");
        } catch {
          throw new Error("Toolbox widget_config is not valid JSON.");
        }
        if (
          toolboxForm.content_type === "external_link" &&
          isLikelyVideoUrl(toolboxForm.external_url)
        ) {
          throw new Error("Video links must be managed in Bibliotheque admin, not Toolbox templates.");
        }
        await createToolboxTemplate(
          {
            external_key: toolboxForm.external_key || null,
            content_type: toolboxForm.content_type as any,
            title: toolboxForm.title,
            duration: toolboxForm.duration || null,
            description: toolboxForm.description || null,
            external_url: toolboxForm.external_url || null,
            widget_config: parsedWidget,
            archetype_targets: parseTagList(toolboxForm.archetypes),
            shadow_targets: parseTagList(toolboxForm.shadows),
          },
          user.id
        );
      }
      if (journalForm.title.trim() && journalForm.prompt_text.trim()) {
        await createJournalPromptTemplate(
          {
            external_key: journalForm.external_key || null,
            title: journalForm.title,
            prompt_text: journalForm.prompt_text,
            duration: journalForm.duration || null,
            archetype_targets: parseTagList(journalForm.archetypes),
            shadow_targets: parseTagList(journalForm.shadows),
          },
          user.id
        );
      }

      toast({ title: "Saved", description: "Catalog templates updated." });
      await loadAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const assignSelected = async (kind: "habit" | "toolbox" | "journal") => {
    if (!user || !selectedUserId) return;
    setSubmitting(true);
    try {
      if (kind === "habit" && assignSelection.habitTemplateId) {
        const result = await assignHabitTemplateToUser({
          actorId: user.id,
          userId: selectedUserId,
          habitTemplateId: assignSelection.habitTemplateId,
        });
        if (result.skipped) {
          toast({ title: "Already assigned", description: "This routine is already active for this user." });
        } else {
          toast({ title: "Assigned", description: "Routine assigned successfully." });
        }
      }
      if (kind === "toolbox" && assignSelection.toolboxTemplateId) {
        await assignToolboxTemplateToUser({
          actorId: user.id,
          userId: selectedUserId,
          templateId: assignSelection.toolboxTemplateId,
        });
        toast({ title: "Assigned", description: "Toolbox item assigned successfully." });
      }
      if (kind === "journal" && assignSelection.journalTemplateId) {
        await assignJournalPromptTemplateToUser({
          actorId: user.id,
          userId: selectedUserId,
          templateId: assignSelection.journalTemplateId,
        });
        toast({ title: "Assigned", description: "Journal prompt assigned successfully." });
      }
      await loadAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const beginEdit = (kind: "habit" | "toolbox" | "journal", row: any) => {
    setEditRow({ kind, id: row.id });
    if (kind === "habit") {
      setEditPayload({
        external_key: row.external_key || "",
        name: row.name || "",
        category: row.category || "",
        description: row.description || "",
        archetypes: joinTagList(row.archetype_targets),
        shadows: joinTagList(row.shadow_targets),
      });
      return;
    }
    if (kind === "toolbox") {
      setEditPayload({
        external_key: row.external_key || "",
        content_type: row.content_type || "",
        title: row.title || "",
        duration: row.duration || "",
        description: row.description || "",
        external_url: row.external_url || "",
        widget_config: JSON.stringify(row.widget_config || {}, null, 2),
        archetypes: joinTagList(row.archetype_targets),
        shadows: joinTagList(row.shadow_targets),
      });
      return;
    }
    setEditPayload({
      external_key: row.external_key || "",
      title: row.title || "",
      prompt_text: row.prompt_text || "",
      duration: row.duration || "",
      archetypes: joinTagList(row.archetype_targets),
      shadows: joinTagList(row.shadow_targets),
    });
  };

  const saveEdit = async () => {
    if (!user || !editRow) return;
    setSubmitting(true);
    try {
      if (editRow.kind === "habit") {
        await updateHabitTemplate(
          editRow.id,
          {
            external_key: editPayload.external_key || null,
            name: editPayload.name || "",
            category: editPayload.category || "",
            description: editPayload.description || null,
            archetype_targets: parseTagList(editPayload.archetypes || ""),
            shadow_targets: parseTagList(editPayload.shadows || ""),
          },
          user.id
        );
      } else if (editRow.kind === "toolbox") {
        await updateToolboxTemplate(
          editRow.id,
          {
            external_key: editPayload.external_key || null,
            content_type: (editPayload.content_type || "breathwork") as any,
            title: editPayload.title || "",
            duration: editPayload.duration || null,
            description: editPayload.description || null,
            external_url: editPayload.external_url || null,
            widget_config: JSON.parse(editPayload.widget_config || "{}"),
            archetype_targets: parseTagList(editPayload.archetypes || ""),
            shadow_targets: parseTagList(editPayload.shadows || ""),
          },
          user.id
        );
      } else {
        await updateJournalPromptTemplate(
          editRow.id,
          {
            external_key: editPayload.external_key || null,
            title: editPayload.title || "",
            prompt_text: editPayload.prompt_text || "",
            duration: editPayload.duration || null,
            archetype_targets: parseTagList(editPayload.archetypes || ""),
            shadow_targets: parseTagList(editPayload.shadows || ""),
          },
          user.id
        );
      }
      toast({ title: "Updated", description: "Template updated successfully." });
      setEditRow(null);
      await loadAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const removeTemplate = async (kind: "habit" | "toolbox" | "journal", id: string) => {
    if (!user) return;
    if (!window.confirm("Delete this template?")) return;
    setSubmitting(true);
    try {
      await deleteCatalogItem(kind, id, user.id);
      toast({ title: "Deleted", description: "Template removed." });
      await loadAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshSuggestions = async () => {
    if (!selectedUserId) return;
    try {
      const data = await getArchetypeSuggestionsForUser(selectedUserId);
      setSuggestions(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? String(e), variant: "destructive" });
    }
  };

  const validateImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      const issues = validateToolboxCatalogPayload(parsed);
      setImportReport({
        mode: "validate",
        ok: issues.length === 0,
        issues,
      });
    } catch (e: any) {
      setImportReport({
        mode: "validate",
        ok: false,
        issues: [{ path: "$", message: e.message ?? "JSON invalide." }],
      });
    }
  };

  const executeImport = async (dryRun: boolean) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const parsed = JSON.parse(importJson);
      const summary = await runToolboxCatalogImport({
        payload: parsed,
        actorId: user.id,
        dryRun,
      });
      setImportReport({
        mode: dryRun ? "dry-run" : "import",
        ok: summary.issues.length === 0,
        summary,
      });
      toast({
        title: dryRun ? "Dry-run terminé" : "Import terminé",
        description: `${summary.createdToolboxTemplates} outils, ${summary.createdHabitTemplates} routines, ${summary.createdJournalPromptTemplates} prompts créés. ${summary.skippedDuplicates} ignorés (doublons).`,
      });
      await loadAll();
    } catch (e: any) {
      toast({ title: "Erreur import", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="ethereal-glass p-16 flex justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="text-neural-label mb-2">Administration</p>
        <h1 className="text-neural-title text-3xl text-foreground">Program Builder</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Unified catalog and assignment flow for toolbox items, routines, and journal prompts.
        </p>
      </div>

      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Toolbox completion" value={`${kpis.toolboxCompletionRate}%`} />
          <KpiCard label="Routine adherence" value={`${kpis.routineAdherenceRate}%`} />
          <KpiCard label="Journal completion" value={`${kpis.journalCompletionRate}%`} />
          <KpiCard label="Import runs" value={String(kpis.importRuns)} />
        </div>
      )}

      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalog">
            <Boxes className="h-3.5 w-3.5 mr-1" /> Catalog
          </TabsTrigger>
          <TabsTrigger value="assign">
            <Plus className="h-3.5 w-3.5 mr-1" /> Assign
          </TabsTrigger>
          <TabsTrigger value="suggest">
            <BrainCircuit className="h-3.5 w-3.5 mr-1" /> Suggestions
          </TabsTrigger>
          <TabsTrigger value="import">
            <FileJson className="h-3.5 w-3.5 mr-1" /> Import
          </TabsTrigger>
          <TabsTrigger value="observe">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Observability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="ethereal-glass p-4 space-y-2">
              <p className="text-sm font-medium">Routine template</p>
              <input className={inputClass} placeholder="external key" value={habitForm.external_key} onChange={(e) => setHabitForm((f) => ({ ...f, external_key: e.target.value }))} />
              <input className={inputClass} placeholder="name" value={habitForm.name} onChange={(e) => setHabitForm((f) => ({ ...f, name: e.target.value }))} />
              <input className={inputClass} placeholder="category" value={habitForm.category} onChange={(e) => setHabitForm((f) => ({ ...f, category: e.target.value }))} />
              <textarea className={inputClass} rows={2} placeholder="description" value={habitForm.description} onChange={(e) => setHabitForm((f) => ({ ...f, description: e.target.value }))} />
              <input className={inputClass} placeholder="archetypes: sovereign, warrior" value={habitForm.archetypes} onChange={(e) => setHabitForm((f) => ({ ...f, archetypes: e.target.value }))} />
              <input className={inputClass} placeholder="shadows: child, victim" value={habitForm.shadows} onChange={(e) => setHabitForm((f) => ({ ...f, shadows: e.target.value }))} />
            </div>

            <div className="ethereal-glass p-4 space-y-2">
              <p className="text-sm font-medium">Toolbox template</p>
              <input className={inputClass} placeholder="external key" value={toolboxForm.external_key} onChange={(e) => setToolboxForm((f) => ({ ...f, external_key: e.target.value }))} />
              <select className={inputClass} value={toolboxForm.content_type} onChange={(e) => setToolboxForm((f) => ({ ...f, content_type: e.target.value }))}>
                {TOOLBOX_CONTENT_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input className={inputClass} placeholder="title" value={toolboxForm.title} onChange={(e) => setToolboxForm((f) => ({ ...f, title: e.target.value }))} />
              <input className={inputClass} placeholder="duration" value={toolboxForm.duration} onChange={(e) => setToolboxForm((f) => ({ ...f, duration: e.target.value }))} />
              <textarea className={inputClass} rows={2} placeholder="description" value={toolboxForm.description} onChange={(e) => setToolboxForm((f) => ({ ...f, description: e.target.value }))} />
              <input className={inputClass} placeholder="external url (optional)" value={toolboxForm.external_url} onChange={(e) => setToolboxForm((f) => ({ ...f, external_url: e.target.value }))} />
              <textarea className={inputClass} rows={3} placeholder='widget_config JSON (e.g. {"duration_min":10})' value={toolboxForm.widget_config} onChange={(e) => setToolboxForm((f) => ({ ...f, widget_config: e.target.value }))} />
              <input className={inputClass} placeholder="archetypes" value={toolboxForm.archetypes} onChange={(e) => setToolboxForm((f) => ({ ...f, archetypes: e.target.value }))} />
              <input className={inputClass} placeholder="shadows" value={toolboxForm.shadows} onChange={(e) => setToolboxForm((f) => ({ ...f, shadows: e.target.value }))} />
            </div>

            <div className="ethereal-glass p-4 space-y-2">
              <p className="text-sm font-medium">Journal template</p>
              <input className={inputClass} placeholder="external key" value={journalForm.external_key} onChange={(e) => setJournalForm((f) => ({ ...f, external_key: e.target.value }))} />
              <input className={inputClass} placeholder="title" value={journalForm.title} onChange={(e) => setJournalForm((f) => ({ ...f, title: e.target.value }))} />
              <textarea className={inputClass} rows={4} placeholder="prompt text" value={journalForm.prompt_text} onChange={(e) => setJournalForm((f) => ({ ...f, prompt_text: e.target.value }))} />
              <input className={inputClass} placeholder="duration" value={journalForm.duration} onChange={(e) => setJournalForm((f) => ({ ...f, duration: e.target.value }))} />
              <input className={inputClass} placeholder="archetypes" value={journalForm.archetypes} onChange={(e) => setJournalForm((f) => ({ ...f, archetypes: e.target.value }))} />
              <input className={inputClass} placeholder="shadows" value={journalForm.shadows} onChange={(e) => setJournalForm((f) => ({ ...f, shadows: e.target.value }))} />
            </div>
          </div>
          <button onClick={createCatalogItems} disabled={submitting} className="btn-neural disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save templates
          </button>

          <div className="ethereal-glass p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              className={inputClass}
              value={catalogFilterType}
              onChange={(e) => setCatalogFilterType(e.target.value as any)}
            >
              <option value="all">All types</option>
              <option value="habit">Routine templates</option>
              <option value="toolbox">Toolbox templates</option>
              <option value="journal">Journal templates</option>
            </select>
            <input
              className={inputClass}
              placeholder="Filter by archetype/shadow tag"
              value={catalogFilterTag}
              onChange={(e) => setCatalogFilterTag(e.target.value)}
            />
            <div className="text-xs text-muted-foreground self-center">
              {filteredCatalog.habits.length + filteredCatalog.toolbox.length + filteredCatalog.journal.length} template(s)
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CatalogList
              title="Routines catalog"
              rows={filteredCatalog.habits.map((h) => ({
                id: h.id,
                label: `${pickCatalogTemplateDisplayTitle(locale as Locale, { name: h.name, name_i18n: h.name_i18n }, "name")} · ${h.category} · ${joinTagList(h.archetype_targets)}`,
                onEdit: () => beginEdit("habit", h),
                onDelete: () => removeTemplate("habit", h.id),
              }))}
            />
            <CatalogList
              title="Toolbox catalog"
              rows={filteredCatalog.toolbox.map((t) => ({
                id: t.id,
                label: `${pickCatalogTemplateDisplayTitle(locale as Locale, { title: t.title, title_i18n: t.title_i18n })} · ${t.content_type} · ${joinTagList(t.archetype_targets)}`,
                onEdit: () => beginEdit("toolbox", t),
                onDelete: () => removeTemplate("toolbox", t.id),
              }))}
            />
            <CatalogList
              title="Journal catalog"
              rows={filteredCatalog.journal.map((j) => ({
                id: j.id,
                label: `${pickCatalogTemplateDisplayTitle(locale as Locale, { title: j.title, title_i18n: j.title_i18n })} · ${joinTagList(j.archetype_targets)}`,
                onEdit: () => beginEdit("journal", j),
                onDelete: () => removeTemplate("journal", j.id),
              }))}
            />
          </div>

          {editRow && (
            <div className="ethereal-glass p-4 space-y-2">
              <p className="text-sm font-medium">
                Edit {editRow.kind} template
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(editPayload).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{key}</label>
                    {key.includes("description") || key.includes("prompt") || key.includes("widget_config") ? (
                      <textarea
                        className={inputClass}
                        rows={key === "widget_config" ? 6 : 3}
                        value={value}
                        onChange={(e) => setEditPayload((p) => ({ ...p, [key]: e.target.value }))}
                      />
                    ) : key === "content_type" ? (
                      <select
                        className={inputClass}
                        value={value}
                        onChange={(e) => setEditPayload((p) => ({ ...p, [key]: e.target.value }))}
                      >
                        {TOOLBOX_CONTENT_TYPES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={inputClass}
                        value={value}
                        onChange={(e) => setEditPayload((p) => ({ ...p, [key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={submitting} className="btn-neural">
                  Save update
                </button>
                <button onClick={() => setEditRow(null)} className="btn-neural">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assign" className="space-y-4">
          <div className="ethereal-glass p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-neural-label block mb-1">User</label>
              <select className={inputClass} value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                <option value="">Select user</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name || p.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-muted-foreground self-end">
              Target user: <span className="text-foreground">{profileName}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <AssignmentCard
              title="Assign routine"
              value={assignSelection.habitTemplateId}
              onChange={(v) => setAssignSelection((s) => ({ ...s, habitTemplateId: v }))}
              options={catalog.habits.map((h) => ({
                id: h.id,
                label: `${pickCatalogTemplateDisplayTitle(locale as Locale, { name: h.name, name_i18n: h.name_i18n }, "name")} (${h.category})`,
              }))}
              buttonLabel="Assign routine"
              onAssign={() => assignSelected("habit")}
            />
            <AssignmentCard
              title="Assign toolbox"
              value={assignSelection.toolboxTemplateId}
              onChange={(v) => setAssignSelection((s) => ({ ...s, toolboxTemplateId: v }))}
              options={catalog.toolbox.map((t) => ({
                id: t.id,
                label: `${pickCatalogTemplateDisplayTitle(locale as Locale, { title: t.title, title_i18n: t.title_i18n })} (${t.content_type})`,
              }))}
              buttonLabel="Assign toolbox item"
              onAssign={() => assignSelected("toolbox")}
            />
            <AssignmentCard
              title="Assign journal prompt"
              value={assignSelection.journalTemplateId}
              onChange={(v) => setAssignSelection((s) => ({ ...s, journalTemplateId: v }))}
              options={catalog.journal.map((j) => ({
                id: j.id,
                label: pickCatalogTemplateDisplayTitle(locale as Locale, { title: j.title, title_i18n: j.title_i18n }),
              }))}
              buttonLabel="Assign prompt"
              onAssign={() => assignSelected("journal")}
            />
          </div>
          {statusFeed && (
            <div className="ethereal-glass p-4">
              <p className="text-sm font-medium mb-2">Unified assignment statuses</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <StatusBlock title="Routines" rows={statusFeed.habits} />
                <StatusBlock title="Toolbox" rows={statusFeed.toolbox} />
                <StatusBlock title="Journal" rows={statusFeed.journals} />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggest" className="space-y-4">
          <div className="ethereal-glass p-4 flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <label className="text-neural-label block mb-1">User for suggestions</label>
              <select className={inputClass} value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                <option value="">Select user</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name || p.id}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={refreshSuggestions} className="btn-neural">
              <BrainCircuit className="h-4 w-4" /> Load suggestions
            </button>
          </div>

          <div className="space-y-2">
            {suggestions.length === 0 && <p className="text-sm text-muted-foreground">No suggestions yet.</p>}
            {suggestions.map((s) => (
              <div key={`${s.type}-${s.id}`} className="ethereal-glass p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground">
                    {s.type === "habit_template"
                      ? pickCatalogTemplateDisplayTitle(locale as Locale, { name: s.title, name_i18n: s.title_i18n }, "name")
                      : pickCatalogTemplateDisplayTitle(locale as Locale, { title: s.title, title_i18n: s.title_i18n })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.type} · score {s.score} · {s.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <div className="ethereal-glass p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Program JSON import (catalog + optional assignments)</p>
            <textarea className={inputClass} rows={18} value={importJson} onChange={(e) => setImportJson(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <button onClick={validateImport} className="btn-neural">
                Validate
              </button>
              <button onClick={() => executeImport(true)} disabled={submitting} className="btn-neural">
                Dry-run
              </button>
              <button onClick={() => executeImport(false)} disabled={submitting} className="btn-neural">
                Import now
              </button>
            </div>
          </div>
          {importReport && (
            <pre className="ethereal-glass p-4 text-xs overflow-auto">{JSON.stringify(importReport, null, 2)}</pre>
          )}
        </TabsContent>

        <TabsContent value="observe" className="space-y-4">
          {kpis && (
            <div className="ethereal-glass p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <Metric label="Toolbox assigned" value={String(kpis.totalToolboxAssignments)} />
              <Metric label="Routines assigned" value={String(kpis.totalHabitAssignments)} />
              <Metric label="Journal prompts" value={String(kpis.totalJournalPrompts)} />
              <Metric label="Program events" value={String(kpis.programEvents)} />
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="ethereal-glass p-4">
              <p className="text-sm font-medium mb-3">Recent import runs</p>
              <div className="space-y-2 max-h-80 overflow-auto">
                {observability.imports.map((run) => (
                  <div key={run.id} className="border border-border/20 rounded-lg p-3 text-xs">
                    <p className="text-foreground">{new Date(run.created_at).toLocaleString()}</p>
                    <p className="text-muted-foreground">{run.status}</p>
                    <p className="text-muted-foreground">
                      dry_run: {String(run.dry_run)} · issues: {run.summary?.issues?.length || 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="ethereal-glass p-4">
              <p className="text-sm font-medium mb-3">Program events</p>
              <div className="space-y-2 max-h-80 overflow-auto">
                {observability.events.map((ev) => (
                  <div key={ev.id} className="border border-border/20 rounded-lg p-3 text-xs">
                    <p className="text-foreground">
                      {ev.event_type} · {ev.entity_type}
                    </p>
                    <p className="text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</p>
                    <p className="text-muted-foreground">user: {ev.user_id || "n/a"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="ethereal-glass p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-lg text-foreground font-medium">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/20 rounded-lg p-3">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-foreground font-medium">{value}</p>
    </div>
  );
}

function StatusBlock({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="border border-border/20 rounded-lg p-3">
      <p className="text-foreground mb-2">{title}</p>
      <div className="space-y-1 max-h-40 overflow-auto">
        {rows.length === 0 && <p className="text-muted-foreground">No assignments</p>}
        {rows.map((r) => (
          <p key={r.id} className="text-muted-foreground">
            {r.status} · {new Date(r.assigned_at).toLocaleDateString()}
          </p>
        ))}
      </div>
    </div>
  );
}

function CatalogList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ id: string; label: string; onEdit: () => void; onDelete: () => void }>;
}) {
  return (
    <div className="ethereal-glass p-4">
      <p className="text-sm font-medium text-foreground mb-3">{title}</p>
      <div className="space-y-2 max-h-60 overflow-auto">
        {rows.length === 0 && <p className="text-xs text-muted-foreground">No templates yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="text-xs border border-border/20 rounded-lg p-2 text-muted-foreground flex items-center justify-between gap-2">
            <span>{r.label}</span>
            <span className="flex gap-1">
              <button className="p-1 rounded border border-border/20 hover:border-primary/40" onClick={r.onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button className="p-1 rounded border border-border/20 hover:border-destructive/40" onClick={r.onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssignmentCard({
  title,
  value,
  onChange,
  options,
  buttonLabel,
  onAssign,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ id: string; label: string }>;
  buttonLabel: string;
  onAssign: () => void;
}) {
  return (
    <div className="ethereal-glass p-4 space-y-3">
      <p className="text-sm font-medium">{title}</p>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select template</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <button onClick={onAssign} className="btn-neural w-full">
        <BookOpen className="h-4 w-4" /> {buttonLabel}
      </button>
    </div>
  );
}

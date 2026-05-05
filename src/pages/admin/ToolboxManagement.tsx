import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Wind, Eye, Scan, Sparkles, Stars, Heart, BookOpen, Link as LinkIcon, Search, Trash2, Users, Package, ShieldAlert, Target, Library, Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import ToolboxAssignmentForm from "@/components/admin/ToolboxAssignmentForm";
import { isLikelyVideoUrl } from "@/lib/video-links";
import { assignToolboxTemplateToUser, assignJournalPromptTemplateToUser } from "@/services/programBuilderService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ToolboxAssignment {
  id: string;
  user_id: string;
  content_type: string;
  title: string;
  duration: string | null;
  assigned_at: string;
  external_url: string | null;
  widget_config: any;
  user_name?: string;
}

interface ToolboxTemplate {
  id: string;
  content_type: string;
  title: string;
  duration: string | null;
  description: string | null;
  widget_config: any;
  is_active: boolean;
  created_at: string;
}

interface JournalTemplate {
  id: string;
  title: string;
  prompt_text: string;
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

const inputClass = "w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors";

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

  // Catalogue → assignation
  const [catalogSelectedUser, setCatalogSelectedUser] = useState("");
  const [catalogAssigning, setCatalogAssigning] = useState<string | null>(null);
  const [journalAssigning, setJournalAssigning] = useState<string | null>(null);

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
    setTemplates((templatesRes.data || []) as ToolboxTemplate[]);
    setJournalTemplates((journalTemplatesRes.data || []) as JournalTemplate[]);
    setLoading(false);
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from("toolbox_assignments").delete().eq("id", id);
    if (error) toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
    else { toast({ title: t("admin.toolboxMgmt.toastRemoved") }); loadData(); }
  };

  const assignFromCatalog = async (templateId: string) => {
    if (!user || !catalogSelectedUser) {
      toast({ title: t("toast.error"), description: "Sélectionne un utilisateur d'abord.", variant: "destructive" });
      return;
    }
    setCatalogAssigning(templateId);
    try {
      await assignToolboxTemplateToUser({ actorId: user.id, userId: catalogSelectedUser, templateId });
      toast({ title: "Assigné", description: "L'outil a été assigné à l'utilisateur." });
      loadData();
    } catch (e: any) {
      toast({ title: t("toast.error"), description: e.message, variant: "destructive" });
    } finally {
      setCatalogAssigning(null);
    }
  };

  const assignJournalFromCatalog = async (templateId: string) => {
    if (!user || !catalogSelectedUser) {
      toast({ title: t("toast.error"), description: "Sélectionne un utilisateur d'abord.", variant: "destructive" });
      return;
    }
    setJournalAssigning(templateId);
    try {
      await assignJournalPromptTemplateToUser({ actorId: user.id, userId: catalogSelectedUser, templateId });
      toast({ title: "Prompt assigné", description: "Le prompt journal a été assigné. Il apparaît dans la Toolbox de l'utilisateur." });
      loadData();
    } catch (e: any) {
      toast({ title: t("toast.error"), description: e.message, variant: "destructive" });
    } finally {
      setJournalAssigning(null);
    }
  };

  const allTypes = ["all", ...new Set(assignments.map((a) => a.content_type))];
  const filtered = assignments
    .filter((a) => filterType === "all" || a.content_type === filterType)
    .filter((a) => !search || (a.user_name || "").toLowerCase().includes(search.toLowerCase()) || a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">{t("admin.toolboxMgmt.kicker")}</p>
        <h1 className="text-neural-title text-3xl text-foreground">{t("admin.toolboxMgmt.pageTitle")}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("admin.toolboxMgmt.statAssigned"), value: assignments.length, icon: Package },
          { label: t("admin.toolboxMgmt.statUsers"), value: new Set(assignments.map((a) => a.user_id)).size, icon: Users },
          { label: "Templates catalogue", value: templates.length, icon: Library },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="ethereal-glass p-6">
            <stat.icon size={16} strokeWidth={1.5} className="text-neural-accent mb-3" />
            <p className="text-2xl font-cinzel text-foreground">{stat.value}</p>
            <p className="text-neural-label mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="assign" className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalog">
            <Library className="h-3.5 w-3.5 mr-1" /> Catalogue
          </TabsTrigger>
          <TabsTrigger value="assign">
            <Package className="h-3.5 w-3.5 mr-1" /> {t("admin.toolboxMgmt.assignHeading")}
          </TabsTrigger>
          <TabsTrigger value="list">
            <Users className="h-3.5 w-3.5 mr-1" /> Assignations actives
          </TabsTrigger>
        </TabsList>

        {/* TAB: CATALOGUE */}
        <TabsContent value="catalog" className="space-y-4">
          <div className="ethereal-glass p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Assigner depuis le catalogue</p>
            <div>
              <label className="text-neural-label block mb-1.5">Utilisateur cible</label>
              <select
                value={catalogSelectedUser}
                onChange={(e) => setCatalogSelectedUser(e.target.value)}
                className={inputClass + " sm:w-80"}
              >
                <option value="">Sélectionner un utilisateur</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.display_name || t("users.noName")}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="ethereal-glass p-12 flex justify-center">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (templates.length === 0 && journalTemplates.length === 0) ? (
            <div className="ethereal-glass p-12 text-center">
              <Library size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Aucun template dans le catalogue.</p>
              <p className="text-xs text-muted-foreground mt-1">Importe un JSON depuis Program Builder pour en créer.</p>
            </div>
          ) : (
            <div className="space-y-6">
            {/* Toolbox templates */}
            {templates.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Outils ({templates.length})</p>
              {templates.map((tmpl, i) => {
                const meta = TYPE_META[tmpl.content_type] || TYPE_META.course;
                const isAssigning = catalogAssigning === tmpl.id;
                return (
                  <motion.div
                    key={tmpl.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="ethereal-glass p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary/30 border border-border/20 flex items-center justify-center shrink-0">
                      <meta.icon size={16} strokeWidth={1.5} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tmpl.title}</p>
                      <p className="text-neural-label mt-0.5">
                        {meta.label} · {tmpl.duration || "—"}
                        {tmpl.description && <span className="ml-2 text-muted-foreground/70 truncate">{tmpl.description}</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => assignFromCatalog(tmpl.id)}
                      disabled={isAssigning || !catalogSelectedUser}
                      className="text-[9px] uppercase tracking-[0.2em] px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 flex items-center gap-1"
                    >
                      {isAssigning ? <Loader2 size={11} className="animate-spin" /> : null}
                      Assigner
                    </button>
                  </motion.div>
                );
              })}
            </div>
            )}

            {/* Journal prompt templates */}
            {journalTemplates.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Prompts journal ({journalTemplates.length})</p>
                {journalTemplates.map((jt, i) => {
                  const isAssigning = journalAssigning === jt.id;
                  return (
                    <motion.div
                      key={jt.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="ethereal-glass p-4 flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-secondary/30 border border-border/20 flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen size={16} strokeWidth={1.5} className="text-neural-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{jt.title}</p>
                        <p className="text-neural-label mt-0.5 line-clamp-2">{jt.prompt_text}</p>
                        {jt.duration && <p className="text-xs text-muted-foreground mt-0.5">{jt.duration}</p>}
                      </div>
                      <button
                        onClick={() => assignJournalFromCatalog(jt.id)}
                        disabled={isAssigning || !catalogSelectedUser}
                        className="text-[9px] uppercase tracking-[0.2em] px-4 py-2 rounded-lg border border-neural-accent/30 text-neural-accent hover:bg-neural-accent/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 flex items-center gap-1 mt-1"
                      >
                        {isAssigning ? <Loader2 size={11} className="animate-spin" /> : null}
                        Assigner
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
            </div>
          )}
        </TabsContent>

        {/* TAB: ASSIGNER (formulaire manuel existant) */}
        <TabsContent value="assign" className="space-y-4">
          <div className="ethereal-glass p-6 space-y-4">
            <p className="text-sm font-medium text-foreground">{t("admin.toolboxMgmt.assignHeading")}</p>
            <div>
              <label className="text-neural-label block mb-1.5">{t("admin.toolboxMgmt.userLabel")}</label>
              <select
                value={selectedUser || ""}
                onChange={(e) => setSelectedUser(e.target.value || null)}
                className="w-full sm:w-auto bg-secondary/30 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
              >
                <option value="">{t("admin.toolboxMgmt.selectUserPlaceholder")}</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.display_name || t("users.noName")}</option>
                ))}
              </select>
            </div>
            {selectedUser && (
              <ToolboxAssignmentForm userId={selectedUser} onAssigned={loadData} />
            )}
          </div>
        </TabsContent>

        {/* TAB: LISTE ASSIGNATIONS ACTIVES */}
        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.searchByNameOrTool")}
                className="w-full bg-secondary/20 border border-border/20 rounded-xl pl-12 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30 transition-colors" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {allTypes.map((typeKey) => (
                <button key={typeKey} onClick={() => setFilterType(typeKey)}
                  className={`text-[9px] uppercase tracking-[0.2em] px-3 py-2 rounded-lg border transition-all ${
                    filterType === typeKey ? "border-primary/40 bg-primary/5 text-primary" : "border-border/30 text-muted-foreground hover:border-primary/30"
                  }`}>
                  {typeKey === "all" ? t("admin.toolboxMgmt.filterAll") : TYPE_META[typeKey]?.label || typeKey}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="ethereal-glass p-12 text-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="ethereal-glass p-12 text-center">
                <Package size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">{t("common.noToolsAssigned")}</p>
              </div>
            )}
            {filtered.map((item, i) => {
              const meta = TYPE_META[item.content_type] || TYPE_META.course;
              return (
                <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="ethereal-glass p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/30 border border-border/20 flex items-center justify-center shrink-0">
                    <meta.icon size={16} strokeWidth={1.5} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-neural-label mt-0.5">
                      {item.user_name} · {meta.label} · {item.duration || "—"} · {new Date(item.assigned_at).toLocaleDateString(dateLocaleTag)}
                    </p>
                  </div>
                  <button onClick={() => deleteAssignment(item.id)}
                    className="p-2 rounded-lg border border-border/30 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors shrink-0"
                    title={t("admin.toolboxMgmt.removeTitle")}>
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

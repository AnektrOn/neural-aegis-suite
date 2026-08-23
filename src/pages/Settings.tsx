import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings2,
  Mail,
  Download,
  FileText,
  Smartphone,
  LayoutGrid,
  Save,
  PanelLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { APP_NAV_SECTIONS } from "@/lib/appNavConfig";
import {
  cacheSidebarItems,
  DEFAULT_SIDEBAR_ITEMS,
  normalizeSidebarItems,
  readCachedSidebarItems,
  SIDEBAR_LOCKED_IDS,
  SIDEBAR_PREFS_EVENT,
} from "@/lib/sidebarPreferences";
import {
  DEFAULT_MOBILE_RADIAL_MENU_IDS,
  MOBILE_RADIAL_CATALOG_ORDER,
  orderSelectedRadialIds,
  RADIAL_CATALOG,
  type MobileRadialMenuId,
} from "@/lib/mobileRadialMenuCatalog";

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [exporting, setExporting] = useState(false);
  const [radialIds, setRadialIds] = useState<MobileRadialMenuId[]>(DEFAULT_MOBILE_RADIAL_MENU_IDS);
  const [savingRadial, setSavingRadial] = useState(false);
  const [sidebarItems, setSidebarItems] = useState<string[]>(() => readCachedSidebarItems());
  const [savingSidebar, setSavingSidebar] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      let res = await supabase
        .from("profiles")
        .select("mobile_radial_menu")
        .eq("id", user.id)
        .maybeSingle();
      if (res.error?.message?.includes("mobile_radial_menu")) return;
      const raw = (res.data as { mobile_radial_menu?: unknown } | null)?.mobile_radial_menu;
      if (raw !== undefined) setRadialIds(orderSelectedRadialIds(raw));
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("sidebar_items")
        .eq("id", user.id)
        .maybeSingle();
      if (error) return;
      const raw = (data as { sidebar_items?: unknown } | null)?.sidebar_items;
      if (raw != null) setSidebarItems(normalizeSidebarItems(raw));
    })();
  }, [user]);

  const toggleSidebarItem = (to: string) => {
    if (SIDEBAR_LOCKED_IDS.includes(to)) return;
    setSidebarItems((prev) =>
      normalizeSidebarItems(prev.includes(to) ? prev.filter((x) => x !== to) : [...prev, to]),
    );
  };

  const saveSidebarItems = async () => {
    if (!user) return;
    setSavingSidebar(true);
    const next = normalizeSidebarItems(sidebarItems);
    const { error } = await supabase
      .from("profiles")
      .update({ sidebar_items: next as unknown as Json })
      .eq("id", user.id);
    setSavingSidebar(false);
    if (error) {
      toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
      return;
    }
    cacheSidebarItems(next);
    window.dispatchEvent(new CustomEvent(SIDEBAR_PREFS_EVENT));
    toast({ title: t("settings.sidebarSavedTitle"), description: t("settings.sidebarSavedDesc") });
  };

  const exportData = async () => {
    if (!user) return;
    setExporting(true);
    const [moodRes, decRes, habRes, journalRes, contactsRes] = await Promise.all([
      supabase.from("mood_entries" as any).select("*").eq("user_id", user.id).order("logged_at", { ascending: false }),
      supabase.from("decisions" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("habit_completions" as any).select("*").eq("user_id", user.id).order("completed_date", { ascending: false }),
      supabase.from("journal_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("people_contacts" as any).select("*").eq("user_id", user.id),
    ]);

    const sections: string[] = [];
    const moods = (moodRes.data as any[]) || [];
    if (moods.length > 0) {
      sections.push("=== HUMEUR ===");
      sections.push("Date,Valeur,Sommeil,Stress,Repas");
      moods.forEach((m) => {
        sections.push(`${m.logged_at},${m.value},${m.sleep ?? ""},${m.stress ?? ""},${m.meals_count ?? ""}`);
      });
    }
    const decs = (decRes.data as any[]) || [];
    if (decs.length > 0) {
      sections.push("\n=== DECISIONS ===");
      sections.push("Date,Nom,Statut,Priorité,Responsabilité");
      decs.forEach((d) => {
        sections.push(`${d.created_at},"${d.name}",${d.status},${d.priority},${d.responsibility}`);
      });
    }
    const habits = (habRes.data as any[]) || [];
    if (habits.length > 0) {
      sections.push("\n=== HABITUDES COMPLÉTÉES ===");
      sections.push("Date,Habitude ID");
      habits.forEach((h) => {
        sections.push(`${h.completed_date},${h.assigned_habit_id}`);
      });
    }
    const journals = (journalRes.data as any[]) || [];
    if (journals.length > 0) {
      sections.push("\n=== JOURNAL ===");
      sections.push("Date,Titre,Contenu,Tags,Humeur");
      journals.forEach((j) => {
        sections.push(
          `${j.created_at},"${j.title || ""}","${j.content.replace(/"/g, '""')}","${(j.tags || []).join(";")}",${j.mood_score ?? ""}`,
        );
      });
    }
    const contacts = (contactsRes.data as any[]) || [];
    if (contacts.length > 0) {
      sections.push("\n=== CONTACTS ===");
      sections.push(t("profile.csvHeader"));
      contacts.forEach((c) => {
        sections.push(`"${c.name}","${c.role || ""}",${c.quality},"${c.insight || ""}"`);
      });
    }

    const blob = new Blob([sections.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aegis-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast({ title: t("profile.exportDone"), description: t("profile.exportDoneDesc") });
  };

  const toggleRadialId = (id: MobileRadialMenuId) => {
    setRadialIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) {
        if (set.size <= 1) return prev;
        set.delete(id);
      } else if (set.size < 14) {
        set.add(id);
      } else {
        return prev;
      }
      return MOBILE_RADIAL_CATALOG_ORDER.filter((x) => set.has(x));
    });
  };

  const saveRadialMenu = async () => {
    if (!user) return;
    setSavingRadial(true);
    const { error } = await supabase
      .from("profiles")
      .update({ mobile_radial_menu: radialIds as unknown as Json })
      .eq("id", user.id);
    setSavingRadial(false);
    if (error) {
      toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("profile.radialSavedTitle"), description: t("profile.radialSavedDesc") });
    window.dispatchEvent(new CustomEvent("aegis:radial-menu-updated"));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <p className="text-neural-label mb-3">{t("settings.sectionLabel")}</p>
        <h1 className="text-neural-title text-3xl text-foreground">{t("settings.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="ethereal-glass space-y-6 p-8"
      >
        <div className="flex items-center gap-3 border-b border-border/30 pb-4">
          <Settings2 size={20} strokeWidth={1.5} className="text-primary" />
          <p className="text-neural-label">{t("settings.appearance")}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">{t("settings.theme")}</span>
          <div className="rounded-xl border border-border/20 bg-secondary/10 p-1">
            <ThemeToggle collapsed={false} />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">{t("settings.language")}</span>
          <div className="rounded-xl border border-border/20 bg-secondary/10 p-1">
            <LanguageSwitcher collapsed={false} />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="ethereal-glass space-y-4 p-8"
      >
        <p className="text-neural-label">{t("settings.notifications")}</p>
        <PushNotificationToggle className="w-full justify-center sm:justify-start" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="ethereal-glass p-8 space-y-5"
      >
        <div className="flex items-center gap-3">
          <LayoutGrid size={18} strokeWidth={1.5} className="text-primary" />
          <div>
            <p className="text-neural-label">{t("profile.radialTitle")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("profile.radialHint")}</p>
          </div>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {MOBILE_RADIAL_CATALOG_ORDER.map((id) => {
            const def = RADIAL_CATALOG[id];
            const checked = radialIds.includes(id);
            const atMax = radialIds.length >= 14 && !checked;
            const onlyOne = radialIds.length <= 1 && checked;
            return (
              <li key={id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/25 bg-secondary/10 px-3 py-2.5 transition-colors hover:border-primary/25">
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 rounded border-border accent-primary"
                    checked={checked}
                    disabled={onlyOne || atMax}
                    onChange={() => toggleRadialId(id)}
                  />
                  <span className="text-sm text-foreground">{t(def.labelKey)}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setRadialIds([...DEFAULT_MOBILE_RADIAL_MENU_IDS])}
            className="btn-neural flex-1 border border-border/40 bg-transparent"
          >
            {t("profile.radialReset")}
          </button>
          <button type="button" onClick={saveRadialMenu} disabled={savingRadial} className="btn-neural flex-1">
            <Save size={14} />
            {savingRadial ? t("profile.radialSaving") : t("profile.radialSave")}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        className="ethereal-glass hidden space-y-5 p-8 md:block"
      >
        <div className="flex items-center gap-3">
          <PanelLeft size={18} strokeWidth={1.5} className="text-primary" />
          <div>
            <p className="text-neural-label">{t("settings.sidebarTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("settings.sidebarHint")}</p>
          </div>
        </div>
        <div className="space-y-5">
          {APP_NAV_SECTIONS.map((section) => (
            <div key={section.id} className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t(section.labelKey)}</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {section.items.map((item) => {
                  const checked = sidebarItems.includes(item.to);
                  const locked = SIDEBAR_LOCKED_IDS.includes(item.to);
                  return (
                    <li key={item.to}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/25 bg-secondary/10 px-3 py-2.5 transition-colors hover:border-primary/25">
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0 rounded border-border accent-primary"
                          checked={checked}
                          disabled={locked}
                          onChange={() => toggleSidebarItem(item.to)}
                        />
                        <item.icon size={14} strokeWidth={1.5} className="shrink-0 text-muted-foreground" aria-hidden />
                        <span className="text-sm text-foreground">{t(item.labelKey)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setSidebarItems([...DEFAULT_SIDEBAR_ITEMS])}
            className="btn-neural flex-1 border border-border/40 bg-transparent"
          >
            {t("settings.sidebarReset")}
          </button>
          <button type="button" onClick={() => void saveSidebarItems()} disabled={savingSidebar} className="btn-neural flex-1">
            <Save size={14} />
            {savingSidebar ? t("settings.sidebarSaving") : t("settings.sidebarSave")}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="ethereal-glass p-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <FileText size={18} strokeWidth={1.5} className="text-primary" />
          <p className="text-neural-label">{t("profile.dataExport")}</p>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t("profile.exportDescription")}</p>
        <button onClick={() => void exportData()} disabled={exporting} className="btn-neural w-full">
          <Download size={14} />
          {exporting ? t("profile.exporting") : t("profile.exportButton")}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="ethereal-glass flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <Mail size={20} strokeWidth={1.5} className="text-primary shrink-0" aria-hidden />
          <div>
            <p className="text-neural-label">{t("nav.newsletter")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("newsletter.subtitle")}</p>
          </div>
        </div>
        <Button asChild variant="outline" className="min-h-[44px] shrink-0">
          <Link to="/newsletter">{t("newsletter.submit")}</Link>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="ethereal-glass p-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <Smartphone size={18} strokeWidth={1.5} className="text-primary" />
          <p className="text-neural-label">{t("install.title")}</p>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t("install.onboardingDesc")}</p>
        <button onClick={() => navigate("/install-android")} className="btn-neural w-full">
          <Smartphone size={14} />
          {t("install.title")}
        </button>
      </motion.div>
    </div>
  );
}

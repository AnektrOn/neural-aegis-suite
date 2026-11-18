import { useState, useEffect } from "react";
import { MemberPageHeader } from "@/components/ui/MemberPageHeader";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Settings2,
  Mail,
  Download,
  FileText,
  LayoutGrid,
  Save,
  Smartphone,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import EmployerDataConsentCard from "@/components/EmployerDataConsentCard";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  defaultUserMenuPrefs,
  normalizeUserMenuPrefs,
  type UserMenuPrefsV2,
} from "@/lib/userMenuPreferences";
import {
  getAllMenuPanels,
  getMenuPanel,
  MENU_PANELS_LOCKED,
  type MenuPanelId,
} from "@/lib/userMenuCatalog";
import { useUserMenuPrefs } from "@/hooks/useUserMenuPrefs";
import AppSumoRedemption from '@/components/AppSumoRedemption';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const [exporting, setExporting] = useState(false);
  const { prefs, savePrefs } = useUserMenuPrefs();
  const [menuDraft, setMenuDraft] = useState<UserMenuPrefsV2>(() => defaultUserMenuPrefs());
  const [savingMenu, setSavingMenu] = useState(false);

  useEffect(() => {
    setMenuDraft(prefs);
  }, [prefs]);

  const exportData = async () => {
    if (!user) return;
    setExporting(true);
    const [
      moodRes,
      decRes,
      habRes,
      journalRes,
      contactsRes,
      profileRes,
      sessionsRes,
      hesitationsRes,
      subsRes,
    ] = await Promise.all([
      supabase.from("mood_entries" as any).select("*").eq("user_id", user.id).order("logged_at", { ascending: false }),
      supabase.from("decisions" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("habit_completions" as any).select("*").eq("user_id", user.id).order("completed_date", { ascending: false }),
      supabase.from("journal_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("people_contacts" as any).select("*").eq("user_id", user.id),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_sessions" as any).select("*").eq("user_id", user.id).limit(500),
      supabase.from("input_hesitations" as any).select("*").eq("user_id", user.id).limit(500),
      supabase.from("subscriptions").select("*").eq("user_id", user.id),
    ]);

    const sections: string[] = [];
    sections.push("=== PROFIL ===");
    sections.push(JSON.stringify(profileRes.data ?? {}, null, 0));
    sections.push(`email,${user.email ?? ""}`);

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
          `${j.created_at},"${j.title || ""}","${(j.content || "").replace(/"/g, '""')}","${(j.tags || []).join(";")}",${j.mood_score ?? ""}`,
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
    if (subsRes.data) {
      sections.push("\n=== ABONNEMENTS ===");
      sections.push(JSON.stringify(subsRes.data));
    }
    if (sessionsRes.data) {
      sections.push("\n=== SESSIONS (meta) ===");
      sections.push(`count,${(sessionsRes.data as any[]).length}`);
    }
    if (hesitationsRes.data) {
      sections.push("\n=== HESITATIONS (meta) ===");
      sections.push(`count,${(hesitationsRes.data as any[]).length}`);
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

  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const deleteMyAccount = async () => {
    if (!user || deleteConfirm !== "DELETE") return;
    setDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-update-user", {
        body: { action: "self_delete" },
      });
      if (error || data?.error) {
        throw new Error(error?.message || data?.error || "delete_failed");
      }
      await supabase.auth.signOut();
      navigate("/account-deleted");
    } catch (e) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  const setDockSlot = (index: number, id: MenuPanelId) => {
    setMenuDraft((prev) => {
      const dock = [...prev.dock];
      dock[index] = id;
      return normalizeUserMenuPrefs({ ...prev, dock });
    });
  };

  const toggleOverflow = (id: MenuPanelId) => {
    const def = getMenuPanel(id);
    if (!def.overflowEligible) return;
    setMenuDraft((prev) => {
      const set = new Set(prev.overflow);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return normalizeUserMenuPrefs({ ...prev, overflow: [...set] });
    });
  };

  const toggleHidden = (id: MenuPanelId) => {
    const def = getMenuPanel(id);
    if (!def.hideable) return;
    setMenuDraft((prev) => {
      const set = new Set(prev.hidden);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return normalizeUserMenuPrefs({ ...prev, hidden: [...set] });
    });
  };

  const saveMenu = async () => {
    if (!user) return;
    setSavingMenu(true);
    try {
      await savePrefs(menuDraft);
      toast({ title: t("settings.myMenuSavedTitle"), description: t("settings.myMenuSavedDesc") });
    } catch (e) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSavingMenu(false);
    }
  };

  const dockEligiblePanels = getAllMenuPanels().filter((p) => p.dockEligible && !p.navExcluded);
  const overflowEligiblePanels = getAllMenuPanels().filter((p) => p.overflowEligible && !p.navExcluded);
  const hideablePanels = getAllMenuPanels().filter((p) => p.hideable && !p.navExcluded);

  const leftPane = (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[color:var(--aegis-gold)]">
          {t("settings.sectionLabel")} · CONTRÔLE SYSTÈME
        </p>
        <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Apparence : Theme & Language */}
      <AppSumoRedemption />
      <div className="aegis-dock-tile space-y-4 rounded-2xl p-5 shadow-[0_8px_28px_rgba(20,20,18,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 border-b border-border pb-3 dark:border-white/[0.08]">
          <Settings2 size={16} strokeWidth={1.5} className="text-[color:var(--aegis-gold)]" />
          <h2 className="font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("settings.appearance")}
          </h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs text-muted-foreground">{t("settings.theme")}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground/80">{t("settings.themeHint")}</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("settings.language")}</span>
          <div className="rounded-xl border border-border bg-muted/40 p-1 dark:border-white/10 dark:bg-black/20">
            <LanguageSwitcher collapsed={false} />
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="aegis-dock-tile space-y-3 rounded-2xl p-5 shadow-[0_8px_28px_rgba(20,20,18,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <p className="font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("settings.notifications")}
        </p>
        <PushNotificationToggle className="w-full justify-center sm:justify-start" />
      </div>

      <EmployerDataConsentCard />

      {/* Data Export & RGPD */}
      <div className="aegis-dock-tile space-y-3 rounded-2xl p-5 shadow-[0_8px_28px_rgba(20,20,18,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2">
          <FileText size={16} strokeWidth={1.5} className="text-[color:var(--aegis-gold)]" />
          <p className="font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("profile.dataExport")}
          </p>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("profile.exportDescription")}</p>
        <button
          type="button"
          onClick={() => void exportData()}
          disabled={exporting}
          className="flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-3 font-cinzel text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-all hover:border-[color:var(--aegis-gold)]/40 hover:bg-[color:var(--aegis-gold)]/10 hover:text-foreground disabled:opacity-40 dark:border-white/10 dark:bg-black/30"
        >
          <Download size={13} />
          {exporting ? t("profile.exporting") : t("profile.exportButton")}
        </button>
      </div>

      {/* Account Deletion */}
      <div className="aegis-dock-tile space-y-3 rounded-2xl border border-destructive/20 p-5 shadow-sm">
        <p className="font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.18em] text-destructive/80">
          {locale === "fr" ? "Zone de Danger · Suppression" : "Danger Zone · Deletion"}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {locale === "fr"
            ? "Suppression définitive (RGPD). Tapez DELETE pour confirmer."
            : "Permanent deletion (GDPR). Type DELETE to confirm."}
        </p>
        <input
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder="DELETE"
          className="min-h-[40px] w-full rounded-xl border border-border bg-card px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-destructive/40 focus:outline-none dark:border-white/10 dark:bg-black/40"
        />
        <button
          type="button"
          disabled={deletingAccount || deleteConfirm !== "DELETE"}
          onClick={() => void deleteMyAccount()}
          className="w-full min-h-[40px] rounded-xl border border-destructive/40 bg-destructive/10 text-xs font-cinzel uppercase tracking-[0.16em] text-destructive hover:bg-destructive/20 transition-all disabled:opacity-40 cursor-pointer"
        >
          {deletingAccount
            ? locale === "fr" ? "Suppression…" : "Deleting…"
            : locale === "fr" ? "Supprimer définitivement" : "Delete permanently"}
        </button>
      </div>
    </div>
  );

  const rightPane = (
    <div className="space-y-4">
      {/* Menu Architecture Tile */}
      <div className="aegis-dock-tile space-y-5 rounded-2xl p-6 shadow-[0_8px_28px_rgba(20,20,18,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3 border-b border-border pb-3 dark:border-white/[0.08]">
          <LayoutGrid size={18} strokeWidth={1.5} className="text-[color:var(--aegis-gold)]" />
          <div>
            <h2 className="font-cinzel text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
              {t("settings.myMenuTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.myMenuHint")}</p>
          </div>
        </div>

        {/* Dock Slots Config */}
        <div className="space-y-3">
          <p className="font-cinzel text-[10px] uppercase tracking-[0.2em] text-[color:var(--aegis-gold)]">
            {t("settings.myMenuDock")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {menuDraft.dock.map((slotId, index) => (
              <label key={index} className="flex flex-col gap-1.5">
                <span className="font-cinzel text-[9.5px] uppercase tracking-wider text-muted-foreground">
                  {t("nav.dockSlot")} {index + 1}
                </span>
                <select
                  className="cursor-pointer rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground focus:border-[color:var(--aegis-gold)]/50 focus:outline-none dark:border-white/10 dark:bg-black/30"
                  value={slotId}
                  onChange={(e) => setDockSlot(index, e.target.value as MenuPanelId)}
                >
                  {dockEligiblePanels.map((p) => (
                    <option key={p.id} value={p.id} className="bg-card text-foreground">
                      {t(p.labelKey)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        {/* Overflow Menu Config */}
        <div className="space-y-3 border-t border-border pt-2 dark:border-white/[0.08]">
          <p className="font-cinzel text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("settings.myMenuOverflow")}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {overflowEligiblePanels.map((p) => {
              const checked = menuDraft.overflow.includes(p.id);
              return (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/35 px-3 py-2.5 transition-all hover:border-[color:var(--aegis-gold)]/35 dark:border-white/5 dark:bg-black/20 dark:hover:border-white/15">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded accent-[color:var(--aegis-gold)]"
                      checked={checked}
                      onChange={() => toggleOverflow(p.id)}
                    />
                    <span className="text-xs text-foreground">{t(p.labelKey)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Hidden Items Config */}
        <div className="space-y-3 border-t border-border pt-2 dark:border-white/[0.08]">
          <p className="font-cinzel text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("settings.myMenuHidden")}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {hideablePanels.map((p) => {
              const checked = menuDraft.hidden.includes(p.id);
              return (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/35 px-3 py-2.5 transition-all hover:border-[color:var(--aegis-gold)]/35 dark:border-white/5 dark:bg-black/20 dark:hover:border-white/15">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded accent-[color:var(--aegis-gold)]"
                      checked={checked}
                      onChange={() => toggleHidden(p.id)}
                    />
                    <span className="text-xs text-foreground">{t(p.labelKey)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Save & Reset Buttons */}
        <div className="flex flex-col gap-2.5 border-t border-border pt-2 sm:flex-row dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => setMenuDraft(defaultUserMenuPrefs())}
            className="flex-1 cursor-pointer rounded-xl border border-border bg-muted/40 py-2.5 font-cinzel text-xs uppercase tracking-[0.14em] text-muted-foreground transition-all hover:border-[color:var(--aegis-gold)]/30 hover:text-foreground dark:border-white/10 dark:bg-black/25"
          >
            {t("settings.myMenuReset")}
          </button>
          <button
            type="button"
            onClick={() => void saveMenu()}
            disabled={savingMenu}
            className="btn-solaire flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 font-cinzel text-xs font-semibold uppercase tracking-[0.16em] shadow-md disabled:opacity-50"
          >
            <Save size={13} />
            <span>{savingMenu ? t("settings.myMenuSaving") : t("settings.myMenuSave")}</span>
          </button>
        </div>
      </div>

      {/* Mobile PWA & Android Installation */}
      <div className="aegis-dock-tile flex items-center justify-between gap-4 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Smartphone size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[color:var(--aegis-gold)]" />
          <div>
            <h3 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-foreground">
              {t("install.title")}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("install.onboardingDesc")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/install-android")}
          className="shrink-0 cursor-pointer rounded-xl border border-border bg-muted/40 px-4 py-2 font-cinzel text-xs uppercase tracking-wider text-[color:var(--aegis-gold)] transition-all hover:border-[color:var(--aegis-gold)]/40 hover:bg-[color:var(--aegis-gold)]/10 dark:border-white/10 dark:bg-black/30"
        >
          Installer
        </button>
      </div>

      {/* Newsletter */}
      <div className="aegis-dock-tile flex items-center justify-between gap-4 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Mail size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-info" />
          <div>
            <h3 className="font-cinzel text-xs font-semibold uppercase tracking-wider text-foreground">
              {t("nav.newsletter")}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("newsletter.subtitle")}</p>
          </div>
        </div>
        <Link
          to="/newsletter"
          className="shrink-0 rounded-xl border border-border bg-muted/40 px-4 py-2 font-cinzel text-xs uppercase tracking-wider text-muted-foreground transition-all hover:border-[color:var(--aegis-gold)]/30 hover:text-foreground dark:border-white/10 dark:bg-black/30"
        >
          {t("newsletter.submit")}
        </Link>
      </div>
    </div>
  );

  return (
    <MemberPageScaffold width="wide" viewport className="min-w-0 overflow-x-hidden">
      <MemberSplitLayout
        left={leftPane}
        right={rightPane}
        leftColSpan={5}
        rightColSpan={7}
        scrollRight={true}
        scrollLeft={true}
      />
    </MemberPageScaffold>
  );
}

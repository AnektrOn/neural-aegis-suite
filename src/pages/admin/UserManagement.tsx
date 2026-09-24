import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search, Shield, ShieldCheck, Headphones, Eye, Ban, CheckCircle, AlertTriangle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { usePlatformRoles } from "@/hooks/use-admin";
import { getActiveAlertCountsByUser } from "@/services/alertService";
import { grantCompanyAdmin, revokeCompanyAdmin, leaveCompany } from "@/services/b2bTenancyService";
import CSVImport from "@/components/admin/CSVImport";
import CreateUserForm from "@/components/admin/CreateUserForm";
import ToolboxAssignmentForm from "@/components/admin/ToolboxAssignmentForm";
import AdminCredentialsForm from "@/components/admin/AdminCredentialsForm";
import AmbassadorForm from "@/components/admin/AmbassadorForm";
import AdminDangerZone from "@/components/admin/AdminDangerZone";

interface UserData {
  id: string;
  display_name: string | null;
  created_at: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  is_disabled: boolean;
  company_id: string | null;
  country: string | null;
  auditCount: number;
  habitCount: number;
  toolboxCount: number;
  moodCount: number;
  lastSeen: string | null;
  plan_override: string | null;
  affiliateCode: string | null;
  isAffiliate: boolean;
  alertCounts: { critical: number; high: number; medium: number; low: number; total: number };
}

interface Company {
  id: string;
  name: string;
  country: string | null;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { isSuperAdmin, isCompanyAdmin: viewerIsCompanyAdmin, companyId: viewerCompanyId } =
    usePlatformRoles();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerCompanyId, viewerIsCompanyAdmin, isSuperAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    let profilesQuery = supabase.from("profiles").select("*");
    if (viewerIsCompanyAdmin && !isSuperAdmin && viewerCompanyId) {
      profilesQuery = profilesQuery.eq("company_id", viewerCompanyId);
    }
    const [profilesRes, rolesRes, auditsRes, habitsRes, toolboxRes, companiesRes, moodsRes, sessionsRes, affiliatesRes] = await Promise.all([
      profilesQuery,
      supabase.from("user_roles" as any).select("*"),
      supabase.from("audit_calls" as any).select("user_id"),
      supabase.from("assigned_habits" as any).select("user_id"),
      supabase.from("toolbox_assignments" as any).select("user_id"),
      isSuperAdmin
        ? supabase.from("companies" as any).select("*")
        : viewerCompanyId
          ? supabase.from("companies" as any).select("*").eq("id", viewerCompanyId)
          : Promise.resolve({ data: [] as any[] }),
      supabase.from("mood_entries").select("user_id", { count: "exact" })
        .gte("logged_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase.from("user_sessions" as any).select("user_id, started_at")
        .order("started_at", { ascending: false }).limit(500),
      isSuperAdmin
        ? supabase.from("affiliates" as any).select("user_id, code, status")
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const roles = (rolesRes.data || []) as any[];
    const audits = (auditsRes.data || []) as any[];
    const habits = (habitsRes.data || []) as any[];
    const toolbox = (toolboxRes.data || []) as any[];
    const moods = (moodsRes.data || []) as any[];
    const recentSessions = (sessionsRes.data || []) as any[];
    const affiliates = (affiliatesRes.data || []) as any[];
    setCompanies((companiesRes.data || []) as any);

    const profileIds = (profilesRes.data || []).map((p: any) => p.id);
    const alertCountsMap = await getActiveAlertCountsByUser(profileIds).catch(
      () => new Map<string, { critical: number; high: number; medium: number; low: number; total: number }>(),
    );

    const userData: UserData[] = (profilesRes.data || []).map((p: any) => {
      const userRoles = roles.filter((r: any) => r.user_id === p.id).map((r: any) => r.role as string);
      const isSuper = userRoles.includes("superadmin") || userRoles.includes("admin");
      const isCoAdmin = userRoles.includes("company_admin");
      return {
        id: p.id, display_name: p.display_name, created_at: p.created_at,
        is_disabled: p.is_disabled || false, company_id: p.company_id || null, country: p.country || null,
        plan_override: p.plan_override ?? null,
        isAdmin: isSuper || isCoAdmin,
        isSuperAdmin: isSuper,
        isCompanyAdmin: isCoAdmin,
        auditCount: audits.filter((a: any) => a.user_id === p.id).length,
        habitCount: habits.filter((h: any) => h.user_id === p.id).length,
        toolboxCount: toolbox.filter((t: any) => t.user_id === p.id).length,
        moodCount: moods.filter((m: any) => m.user_id === p.id).length,
        lastSeen: recentSessions
          .filter((s: any) => s.user_id === p.id)[0]?.started_at ?? null,
        affiliateCode: affiliates.find((a: any) => a.user_id === p.id)?.code ?? null,
        isAffiliate: affiliates.some((a: any) => a.user_id === p.id && a.status === "active"),
        alertCounts: alertCountsMap.get(p.id) ?? { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
      };
    });

    setUsers(userData);
    setLoading(false);
  };

  const toggleSuperAdmin = async (userId: string, isCurrently: boolean) => {
    if (!isSuperAdmin) return;
    if (userId === currentUser?.id) {
      toast({ title: t("toast.impossible"), description: t("toast.cantModifyOwnRole"), variant: "destructive" });
      return;
    }
    if (isCurrently) {
      const { error } = await supabase.from("user_roles" as any).delete().eq("user_id", userId).eq("role", "superadmin");
      if (!error) { toast({ title: t("toast.roleUpdated"), description: t("toast.adminRemoved") }); loadUsers(); }
    } else {
      const { error } = await supabase.from("user_roles" as any).insert({ user_id: userId, role: "superadmin" } as any);
      if (!error) { toast({ title: t("toast.roleUpdated"), description: t("toast.adminGranted") }); loadUsers(); }
    }
  };

  const toggleCompanyAdminRole = async (userId: string, companyId: string | null, isCurrently: boolean) => {
    if (!isSuperAdmin || !companyId) {
      toast({
        title: t("toast.error"),
        description: t("users.companyAdminNeedsCompany"),
        variant: "destructive",
      });
      return;
    }
    try {
      if (isCurrently) await revokeCompanyAdmin(userId, companyId);
      else await grantCompanyAdmin(userId, companyId);
      toast({ title: t("toast.roleUpdated") });
      loadUsers();
    } catch (e) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  const toggleDisabled = async (userId: string, isCurrentlyDisabled: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_disabled: !isCurrentlyDisabled } as any).eq("id", userId);
    if (error) { toast({ title: t("toast.error"), description: error.message, variant: "destructive" }); }
    else { toast({ title: isCurrentlyDisabled ? t("toast.userActivated") : t("toast.userDisabled") }); loadUsers(); }
  };

  const assignCompany = async (userId: string, companyId: string | null) => {
    if (!isSuperAdmin) return;
    const { error } = await supabase.from("profiles").update({ company_id: companyId } as any).eq("id", userId);
    if (error) { toast({ title: t("toast.error"), description: error.message, variant: "destructive" }); }
    else { toast({ title: t("toast.companyUpdated") }); loadUsers(); }
  };

  const removeFromCompany = async (userId: string) => {
    try {
      await leaveCompany(userId);
      toast({ title: t("toast.companyUpdated") });
      loadUsers();
    } catch (e) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  const assignPlanOverride = async (userId: string, plan: string | null) => {
    if (!isSuperAdmin) return;
    const { data, error } = await supabase.rpc("admin_set_plan_override" as any, {
      p_user_id: userId,
      p_plan: plan,
    });
    if (error) {
      toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
      return;
    }
    if (data && typeof data === "object" && (data as { ok?: boolean }).ok === false) {
      toast({
        title: t("toast.error"),
        description: String((data as { error?: string }).error ?? "rpc_failed"),
        variant: "destructive",
      });
      return;
    }
    toast({ title: plan ? `Forfait ${plan} accordé` : "Accès manuel retiré" });
    loadUsers();
  };

  const filtered = users.filter((u) => (u.display_name || "").toLowerCase().includes(search.toLowerCase()));
  const getCompanyName = (cid: string | null) => !cid ? null : companies.find((c) => c.id === cid)?.name || null;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">{t("users.administration")}</p>
        <h1 className="text-neural-title text-3xl text-foreground">{t("users.title")}</h1>
      </div>

      {isSuperAdmin ? (
        <div className="flex flex-wrap gap-4 items-start">
          <CSVImport />
          <CreateUserForm companies={companies} onUserCreated={loadUsers} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("users.total"), value: users.length, icon: Users },
          {
            label: t("users.admins"),
            value: users.filter((u) => u.isSuperAdmin || u.isCompanyAdmin).length,
            icon: ShieldCheck,
          },
          { label: t("users.audited"), value: users.filter((u) => u.auditCount > 0).length, icon: Eye },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="ethereal-glass p-6">
            <stat.icon size={16} strokeWidth={1.5} className="text-neural-accent mb-3" />
            <p className="text-2xl font-cinzel text-foreground">{stat.value}</p>
            <p className="text-neural-label mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("users.search")}
          className="w-full bg-secondary/20 border border-border/20 rounded-xl pl-12 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30 transition-colors" />
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="ethereal-glass p-12 text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="ethereal-glass p-12 text-center">
            <Users size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">{t("users.none")}</p>
          </div>
        )}
        {filtered.map((userData, i) => (
          <motion.div key={userData.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="ethereal-glass p-6">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-cinzel text-sm shrink-0 ${
                userData.is_disabled ? "bg-destructive/10 border border-destructive/20 text-destructive" : "bg-neural-accent/10 border border-neural-accent/20 text-neural-accent"
              }`}>
                {(userData.display_name || "?")[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{userData.display_name || t("users.noName")}</p>
                  {userData.isSuperAdmin && (
                    <span className="text-[8px] uppercase tracking-[0.3em] px-2 py-0.5 rounded-full bg-neural-accent/10 text-neural-accent border border-neural-accent/20">Superadmin</span>
                  )}
                  {userData.isCompanyAdmin && (
                    <span className="text-[8px] uppercase tracking-[0.3em] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Company</span>
                  )}
                  {userData.is_disabled && (
                    <span className="text-[8px] uppercase tracking-[0.3em] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">{t("users.disabled")}</span>
                  )}
                </div>
                <p className="text-neural-label mt-0.5">
                  {getCompanyName(userData.company_id) || t("users.noCompany")} · {userData.country || "—"} · {t("users.registeredOn")} {new Date(userData.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>

              <div className="hidden sm:flex gap-4">
                <div className="text-center">
                  <p className="text-sm font-cinzel text-foreground">{userData.auditCount}</p>
                  <p className="text-neural-label">{t("users.audits")}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-cinzel text-foreground">{userData.habitCount}</p>
                  <p className="text-neural-label">{t("users.habits")}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-cinzel text-foreground">{userData.toolboxCount}</p>
                  <p className="text-neural-label">{t("users.tools")}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-cinzel text-foreground">{userData.moodCount}</p>
                  <p className="text-neural-label">Humeurs</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-cinzel text-foreground">
                    {userData.lastSeen
                      ? `${Math.floor((Date.now() - new Date(userData.lastSeen).getTime())
                        / 86400000)}j`
                      : "—"}
                  </p>
                  <p className="text-neural-label">Inactivité</p>
                </div>
              </div>

              <div className="flex gap-2 items-center">
                {userData.alertCounts.total > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate("/admin/alerts", { state: { userId: userData.id } })}
                    title={t("users.col.alerts")}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium tabular-nums ${
                      userData.alertCounts.critical > 0
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : userData.alertCounts.high > 0
                        ? "border-orange-500/30 bg-orange-500/10 text-orange-500"
                        : "border-yellow-500/30 bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    <AlertTriangle size={12} />
                    {userData.alertCounts.total}
                  </button>
                )}
                {isSuperAdmin ? (
                  <>
                    <button onClick={() => toggleSuperAdmin(userData.id, userData.isSuperAdmin)}
                      className={`p-2 rounded-lg border transition-all ${userData.isSuperAdmin ? "border-neural-accent/30 text-neural-accent" : "border-border/30 text-muted-foreground hover:border-neural-accent/30 hover:text-neural-accent"}`}
                      title={userData.isSuperAdmin ? t("users.removeAdmin") : t("users.makeAdmin")}>
                      {userData.isSuperAdmin ? <ShieldCheck size={14} /> : <Shield size={14} />}
                    </button>
                    <button
                      onClick={() =>
                        toggleCompanyAdminRole(userData.id, userData.company_id, userData.isCompanyAdmin)
                      }
                      className={`p-2 rounded-lg border transition-all ${userData.isCompanyAdmin ? "border-primary/30 text-primary" : "border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
                      title={t("users.toggleCompanyAdmin")}
                    >
                      <Building2 size={14} />
                    </button>
                  </>
                ) : null}
                <button onClick={() => toggleDisabled(userData.id, userData.is_disabled)}
                  className={`p-2 rounded-lg border transition-all ${userData.is_disabled ? "border-destructive/30 text-destructive" : "border-border/30 text-muted-foreground hover:border-destructive/30 hover:text-destructive"}`}
                  title={userData.is_disabled ? t("users.activate") : t("users.deactivate")}>
                  {userData.is_disabled ? <CheckCircle size={14} /> : <Ban size={14} />}
                </button>
                <button onClick={() => setExpandedUser(expandedUser === userData.id ? null : userData.id)}
                  className="p-2 rounded-lg border border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors" title={t("users.assignContent")}>
                  <Headphones size={14} />
                </button>
              </div>
            </div>

            {expandedUser === userData.id && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-border/10 space-y-4">
                {isSuperAdmin ? (
                  <div>
                    <p className="text-neural-label mb-2">{t("users.company")}</p>
                    <select value={userData.company_id || ""} onChange={(e) => assignCompany(userData.id, e.target.value || null)}
                      className="bg-secondary/20 border border-border/20 rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-neural-accent/30">
                      <option value="">{t("users.noCompany")}</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <p className="text-neural-label mb-2">{t("users.company")}</p>
                    <p className="text-sm text-foreground">{getCompanyName(userData.company_id) || t("users.noCompany")}</p>
                    <button
                      type="button"
                      onClick={() => removeFromCompany(userData.id)}
                      className="mt-2 text-xs text-destructive underline"
                    >
                      {t("users.removeFromCompany")}
                    </button>
                  </div>
                )}

                {isSuperAdmin ? (
                  <>
                    <div>
                      <p className="text-neural-label mb-2">Accès accordé manuellement</p>
                      <select value={userData.plan_override || ""} onChange={(e) => assignPlanOverride(userData.id, e.target.value || null)}
                        className="bg-secondary/20 border border-border/20 rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-neural-accent/30">
                        <option value="">Aucun (paiement requis)</option>
                        <option value="matrix">Matrice (offert)</option>
                        <option value="ultra">Ultra (offert)</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-2">
                        Débloque l&apos;application sans abonnement Paddle.
                      </p>
                    </div>

                    <AmbassadorForm
                      userId={userData.id}
                      displayName={userData.display_name}
                      isAffiliate={userData.isAffiliate}
                      affiliateCode={userData.affiliateCode}
                      onChanged={loadUsers}
                    />

                    <AdminCredentialsForm userId={userData.id} displayName={userData.display_name} />

                    <ToolboxAssignmentForm userId={userData.id} onAssigned={loadUsers} />

                    <AdminDangerZone
                      userId={userData.id}
                      displayName={userData.display_name}
                      isSelf={userData.id === currentUser?.id}
                      onDeleted={loadUsers}
                    />
                  </>
                ) : null}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

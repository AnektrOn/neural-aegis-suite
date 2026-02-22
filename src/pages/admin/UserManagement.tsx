import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search, Shield, ShieldCheck, Headphones, Eye, Ban, CheckCircle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface UserData {
  id: string;
  display_name: string | null;
  created_at: string;
  isAdmin: boolean;
  is_disabled: boolean;
  company_id: string | null;
  country: string | null;
  auditCount: number;
  habitCount: number;
  toolboxCount: number;
}

interface Company {
  id: string;
  name: string;
  country: string | null;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, auditsRes, habitsRes, toolboxRes, companiesRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles" as any).select("*"),
      supabase.from("audit_calls" as any).select("user_id"),
      supabase.from("assigned_habits" as any).select("user_id"),
      supabase.from("toolbox_assignments" as any).select("user_id"),
      supabase.from("companies" as any).select("*"),
    ]);

    const roles = (rolesRes.data || []) as any[];
    const audits = (auditsRes.data || []) as any[];
    const habits = (habitsRes.data || []) as any[];
    const toolbox = (toolboxRes.data || []) as any[];
    setCompanies((companiesRes.data || []) as any);

    const userData: UserData[] = (profilesRes.data || []).map((p: any) => ({
      id: p.id, display_name: p.display_name, created_at: p.created_at,
      is_disabled: p.is_disabled || false, company_id: p.company_id || null, country: p.country || null,
      isAdmin: roles.some((r: any) => r.user_id === p.id && r.role === "admin"),
      auditCount: audits.filter((a: any) => a.user_id === p.id).length,
      habitCount: habits.filter((h: any) => h.user_id === p.id).length,
      toolboxCount: toolbox.filter((t: any) => t.user_id === p.id).length,
    }));

    setUsers(userData);
    setLoading(false);
  };

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (userId === currentUser?.id) {
      toast({ title: "Impossible", description: "Vous ne pouvez pas modifier votre propre rôle.", variant: "destructive" });
      return;
    }
    if (isCurrentlyAdmin) {
      const { error } = await supabase.from("user_roles" as any).delete().eq("user_id", userId).eq("role", "admin");
      if (!error) { toast({ title: "Rôle mis à jour", description: "Rôle admin retiré." }); loadUsers(); }
    } else {
      const { error } = await supabase.from("user_roles" as any).insert({ user_id: userId, role: "admin" } as any);
      if (!error) { toast({ title: "Rôle mis à jour", description: "Rôle admin accordé." }); loadUsers(); }
    }
  };

  const assignToolbox = async (userId: string, contentType: string, title: string, duration: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from("toolbox_assignments" as any).insert({ user_id: userId, content_type: contentType, title, duration, assigned_by: currentUser.id } as any);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Contenu assigné", description: `"${title}" assigné à l'utilisateur.` }); loadUsers(); }
  };

  const toggleDisabled = async (userId: string, isCurrentlyDisabled: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_disabled: !isCurrentlyDisabled } as any).eq("id", userId);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { toast({ title: isCurrentlyDisabled ? "Utilisateur activé" : "Utilisateur désactivé" }); loadUsers(); }
  };

  const assignCompany = async (userId: string, companyId: string | null) => {
    const { error } = await supabase.from("profiles").update({ company_id: companyId } as any).eq("id", userId);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Entreprise mise à jour" }); loadUsers(); }
  };

  const filtered = users.filter((u) => (u.display_name || "").toLowerCase().includes(search.toLowerCase()));
  const getCompanyName = (cid: string | null) => !cid ? null : companies.find((c) => c.id === cid)?.name || null;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
        <h1 className="text-neural-title text-3xl text-foreground">Gestion des Utilisateurs</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Leaders", value: users.length, icon: Users },
          { label: "Admins", value: users.filter((u) => u.isAdmin).length, icon: ShieldCheck },
          { label: "Audités", value: users.filter((u) => u.auditCount > 0).length, icon: Eye },
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
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..."
          className="w-full bg-secondary/20 border border-border/20 rounded-xl pl-12 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30 transition-colors" />
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="ethereal-glass p-12 text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="ethereal-glass p-12 text-center">
            <Users size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Aucun utilisateur trouvé.</p>
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
                  <p className="text-sm font-medium text-foreground truncate">{userData.display_name || "Sans nom"}</p>
                  {userData.isAdmin && (
                    <span className="text-[8px] uppercase tracking-[0.3em] px-2 py-0.5 rounded-full bg-neural-accent/10 text-neural-accent border border-neural-accent/20">Admin</span>
                  )}
                  {userData.is_disabled && (
                    <span className="text-[8px] uppercase tracking-[0.3em] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">Désactivé</span>
                  )}
                </div>
                <p className="text-neural-label mt-0.5">
                  {getCompanyName(userData.company_id) || "Aucune entreprise"} · {userData.country || "—"} · Inscrit le {new Date(userData.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>

              <div className="hidden sm:flex gap-4">
                <div className="text-center">
                  <p className="text-sm font-cinzel text-foreground">{userData.auditCount}</p>
                  <p className="text-neural-label">Audits</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-cinzel text-foreground">{userData.habitCount}</p>
                  <p className="text-neural-label">Habitudes</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-cinzel text-foreground">{userData.toolboxCount}</p>
                  <p className="text-neural-label">Outils</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => toggleAdmin(userData.id, userData.isAdmin)}
                  className={`p-2 rounded-lg border transition-all ${userData.isAdmin ? "border-neural-accent/30 text-neural-accent" : "border-border/30 text-muted-foreground hover:border-neural-accent/30 hover:text-neural-accent"}`}
                  title={userData.isAdmin ? "Retirer admin" : "Rendre admin"}>
                  {userData.isAdmin ? <ShieldCheck size={14} /> : <Shield size={14} />}
                </button>
                <button onClick={() => toggleDisabled(userData.id, userData.is_disabled)}
                  className={`p-2 rounded-lg border transition-all ${userData.is_disabled ? "border-destructive/30 text-destructive" : "border-border/30 text-muted-foreground hover:border-destructive/30 hover:text-destructive"}`}
                  title={userData.is_disabled ? "Activer" : "Désactiver"}>
                  {userData.is_disabled ? <CheckCircle size={14} /> : <Ban size={14} />}
                </button>
                <button onClick={() => setExpandedUser(expandedUser === userData.id ? null : userData.id)}
                  className="p-2 rounded-lg border border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors" title="Assigner du contenu">
                  <Headphones size={14} />
                </button>
              </div>
            </div>

            {expandedUser === userData.id && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-border/10 space-y-4">
                <div>
                  <p className="text-neural-label mb-2">Entreprise</p>
                  <select value={userData.company_id || ""} onChange={(e) => assignCompany(userData.id, e.target.value || null)}
                    className="bg-secondary/20 border border-border/20 rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-neural-accent/30">
                    <option value="">Aucune entreprise</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <p className="text-neural-label mb-3">Assignation rapide de contenu</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { type: "meditation", title: "Présence Exécutive", duration: "12 min" },
                    { type: "meditation", title: "Amorçage Neural Matinal", duration: "15 min" },
                    { type: "visualization", title: "Protocole Clarté Décisionnelle", duration: "8 min" },
                    { type: "visualization", title: "Champ de Résonance d'Équipe", duration: "10 min" },
                    { type: "course", title: "Le Leader Souverain", duration: "45 min" },
                    { type: "course", title: "Communication à Haut Enjeu", duration: "30 min" },
                  ].map((item) => (
                    <button key={item.title} onClick={() => assignToolbox(userData.id, item.type, item.title, item.duration)}
                      className="text-[9px] uppercase tracking-[0.2em] px-3 py-2 rounded-lg border border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary transition-all">
                      {item.title}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

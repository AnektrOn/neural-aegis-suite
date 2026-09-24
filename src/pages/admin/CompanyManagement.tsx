import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Plus, Trash2, Globe, Mail, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePlatformRoles } from "@/hooks/use-admin";
import { createCompanyInvite } from "@/services/b2bTenancyService";

interface Company {
  id: string;
  name: string;
  country: string | null;
  created_at: string;
  seat_limit: number | null;
  stripe_customer_id: string | null;
}

export default function CompanyManagement() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isSuperAdmin } = usePlatformRoles();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [seatCounts, setSeatCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newSeats, setNewSeats] = useState("");
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({});
  const [inviteToken, setInviteToken] = useState<Record<string, string>>({});

  useEffect(() => {
    void loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    const { data } = await supabase.from("companies" as never).select("*").order("name");
    const list = (data || []) as Company[];
    setCompanies(list);

    const counts: Record<string, number> = {};
    await Promise.all(
      list.map(async (c) => {
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("company_id", c.id);
        counts[c.id] = count ?? 0;
      }),
    );
    setSeatCounts(counts);
    setLoading(false);
  };

  const addCompany = async () => {
    if (!isSuperAdmin || !newName.trim()) return;
    const seatLimit = newSeats.trim() ? Number(newSeats) : null;
    const { error } = await supabase.from("companies" as never).insert({
      name: newName.trim(),
      country: newCountry.trim() || null,
      seat_limit: Number.isFinite(seatLimit) ? seatLimit : null,
    } as never);
    if (error) {
      toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("toast.companyAdded") });
      setNewName("");
      setNewCountry("");
      setNewSeats("");
      loadCompanies();
    }
  };

  const updateSeatLimit = async (id: string, value: string) => {
    if (!isSuperAdmin) return;
    const seat_limit = value.trim() === "" ? null : Number(value);
    const { error } = await supabase
      .from("companies" as never)
      .update({ seat_limit: Number.isFinite(seat_limit as number) ? seat_limit : null } as never)
      .eq("id", id);
    if (error) {
      toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("toast.companyUpdated") });
      loadCompanies();
    }
  };

  const deleteCompany = async (id: string) => {
    if (!isSuperAdmin) return;
    const { error } = await supabase.from("companies" as never).delete().eq("id", id);
    if (error) {
      toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("toast.companyDeleted") });
      loadCompanies();
    }
  };

  const sendInvite = async (companyId: string) => {
    const email = (inviteEmail[companyId] || "").trim();
    if (!email) return;
    try {
      const row = await createCompanyInvite({ companyId, email, role: "employee" });
      const link = `${window.location.origin}/invite/${row.token}`;
      setInviteToken((prev) => ({ ...prev, [companyId]: link }));
      toast({ title: t("companies.inviteCreated") });
    } catch (e) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="ethereal-glass p-8 text-sm text-muted-foreground">
        {t("admin.overview.companyAdminHint")}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
        <h1 className="text-neural-title text-3xl text-foreground">Entreprises</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6">
        <p className="text-neural-label mb-4">{t("common.addCompany")}</p>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom de l'entreprise"
            className="flex-1 min-w-[200px] bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30"
          />
          <input
            type="text"
            value={newCountry}
            onChange={(e) => setNewCountry(e.target.value)}
            placeholder="Pays"
            className="w-40 bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30"
          />
          <input
            type="number"
            min={1}
            value={newSeats}
            onChange={(e) => setNewSeats(e.target.value)}
            placeholder={t("companies.seatLimit")}
            className="w-32 bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30"
          />
          <button
            onClick={addCompany}
            className="px-4 py-2.5 rounded-xl bg-neural-accent/10 border border-neural-accent/20 text-neural-accent text-sm hover:bg-neural-accent/20 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </motion.div>

      <div className="space-y-3">
        {loading && (
          <div className="ethereal-glass p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!loading && companies.length === 0 && (
          <div className="ethereal-glass p-12 text-center">
            <Building2 size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">{t("common.noCompanyYet")}</p>
          </div>
        )}
        {companies.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="ethereal-glass p-5 space-y-3"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-neural-accent/10 border border-neural-accent/20 flex items-center justify-center">
                <Building2 size={16} className="text-neural-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-neural-label flex items-center gap-1 mt-0.5">
                  <Globe size={10} /> {c.country || "—"} · {seatCounts[c.id] ?? 0}
                  {c.seat_limit != null ? ` / ${c.seat_limit}` : ""} {t("companies.seats")}
                </p>
              </div>
              <input
                type="number"
                min={1}
                defaultValue={c.seat_limit ?? ""}
                onBlur={(e) => updateSeatLimit(c.id, e.target.value)}
                placeholder="∞"
                className="w-20 bg-secondary/20 border border-border/20 rounded-lg px-2 py-1.5 text-xs text-foreground"
                title={t("companies.seatLimit")}
              />
              <button
                onClick={() => deleteCompany(c.id)}
                className="p-2 rounded-lg border border-border/30 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 items-center pl-14">
              <Mail size={12} className="text-muted-foreground" />
              <input
                type="email"
                value={inviteEmail[c.id] || ""}
                onChange={(e) => setInviteEmail((prev) => ({ ...prev, [c.id]: e.target.value }))}
                placeholder={t("companies.inviteEmail")}
                className="flex-1 min-w-[180px] bg-secondary/20 border border-border/20 rounded-lg px-3 py-1.5 text-xs text-foreground"
              />
              <button
                type="button"
                onClick={() => sendInvite(c.id)}
                className="px-3 py-1.5 rounded-lg border border-neural-accent/30 text-neural-accent text-xs"
              >
                {t("companies.createInvite")}
              </button>
              {inviteToken[c.id] ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                  onClick={() => {
                    void navigator.clipboard.writeText(inviteToken[c.id]);
                    toast({ title: t("companies.inviteCopied") });
                  }}
                >
                  <Copy size={10} /> {t("companies.copyInvite")}
                </button>
              ) : null}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

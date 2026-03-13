import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, Mail, Lock, User, Building2, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface Company {
  id: string;
  name: string;
}

interface CreateUserFormProps {
  companies: Company[];
  onUserCreated: () => void;
}

export default function CreateUserForm({ companies, onUserCreated }: CreateUserFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    display_name: "",
    company_id: "",
    country: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-user", {
        body: {
          email: form.email,
          password: form.password,
          display_name: form.display_name || form.email,
          company_id: form.company_id || null,
          country: form.country || null,
        },
      });

      if (res.error || res.data?.error) {
        toast({
          title: t("toast.error"),
          description: res.data?.error || res.error?.message || "Unknown error",
          variant: "destructive",
        });
      } else {
        toast({ title: t("users.userCreated"), description: form.email });
        setForm({ email: "", password: "", display_name: "", company_id: "", country: "" });
        setOpen(false);
        onUserCreated();
      }
    } catch (err: any) {
      toast({ title: t("toast.error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
      >
        {open ? <X size={16} /> : <UserPlus size={16} />}
        {open ? t("general.cancel") : t("users.addUser")}
      </button>

      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mt-4 ethereal-glass p-6 space-y-4"
          >
            <p className="text-sm font-medium text-foreground">{t("users.createNew")}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neural-label flex items-center gap-1.5">
                  <Mail size={12} /> {t("auth.email")} *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
                  placeholder="leader@company.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neural-label flex items-center gap-1.5">
                  <Lock size={12} /> {t("auth.password")} *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neural-label flex items-center gap-1.5">
                  <User size={12} /> {t("users.displayName")}
                </label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
                  placeholder="Jean Dupont"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neural-label flex items-center gap-1.5">
                  <Building2 size={12} /> {t("users.company")}
                </label>
                <select
                  value={form.company_id}
                  onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                  className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/30 transition-colors"
                >
                  <option value="">{t("users.noCompany")}</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-neural-label flex items-center gap-1.5">
                  <Globe size={12} /> {t("users.country")}
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
                  placeholder="France"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !form.email || !form.password}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <UserPlus size={14} />
                )}
                {loading ? t("general.loading") : t("users.createUser")}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

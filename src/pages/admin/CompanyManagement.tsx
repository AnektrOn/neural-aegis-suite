import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Plus, Trash2, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  country: string | null;
  created_at: string;
}

export default function CompanyManagement() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCountry, setNewCountry] = useState("");

  useEffect(() => { loadCompanies(); }, []);

  const loadCompanies = async () => {
    setLoading(true);
    const { data } = await supabase.from("companies" as any).select("*").order("name");
    setCompanies((data || []) as any);
    setLoading(false);
  };

  const addCompany = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("companies" as any).insert({
      name: newName.trim(),
      country: newCountry.trim() || null,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Company Added" });
      setNewName("");
      setNewCountry("");
      loadCompanies();
    }
  };

  const deleteCompany = async (id: string) => {
    const { error } = await supabase.from("companies" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Company Deleted" });
      loadCompanies();
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
        <h1 className="text-neural-title text-3xl text-foreground">Companies</h1>
      </div>

      {/* Add company */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6">
        <p className="text-neural-label mb-4">Add Company</p>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Company name"
            className="flex-1 min-w-[200px] bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30"
          />
          <input
            type="text"
            value={newCountry}
            onChange={(e) => setNewCountry(e.target.value)}
            placeholder="Country"
            className="w-40 bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30"
          />
          <button
            onClick={addCompany}
            className="px-4 py-2.5 rounded-xl bg-neural-accent/10 border border-neural-accent/20 text-neural-accent text-sm hover:bg-neural-accent/20 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </motion.div>

      {/* Company list */}
      <div className="space-y-3">
        {loading && (
          <div className="ethereal-glass p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!loading && companies.length === 0 && (
          <div className="ethereal-glass p-12 text-center">
            <Building2 size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No companies yet.</p>
          </div>
        )}
        {companies.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="ethereal-glass p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-neural-accent/10 border border-neural-accent/20 flex items-center justify-center">
              <Building2 size={16} className="text-neural-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{c.name}</p>
              <p className="text-neural-label flex items-center gap-1 mt-0.5">
                <Globe size={10} /> {c.country || "—"}
              </p>
            </div>
            <button
              onClick={() => deleteCompany(c.id)}
              className="p-2 rounded-lg border border-border/30 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

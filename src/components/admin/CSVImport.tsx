import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

type ImportMode = "users" | "data";

interface ParsedRow {
  [key: string]: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: ParsedRow = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  });
}

export default function CSVImport() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImportMode>("users");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRows(parseCSV(text));
    };
    reader.readAsText(file);
  };

  const importUsers = async () => {
    if (!user) return;
    setImporting(true);
    let success = 0, errors = 0;

    for (const row of rows) {
      try {
        // Find or skip company
        let companyId: string | null = null;
        if (row.company_name) {
          const { data: existing } = await supabase.from("companies" as any).select("id").eq("name", row.company_name).maybeSingle();
          if (existing) {
            companyId = (existing as any).id;
          } else {
            const { data: newCo } = await supabase.from("companies" as any).insert({ name: row.company_name, country: row.country || null } as any).select("id").single();
            companyId = newCo ? (newCo as any).id : null;
          }
        }

        // We can only create profiles for existing auth users, so we update profiles by display_name match
        if (row.display_name) {
          const { error } = await supabase.from("profiles").update({
            company_id: companyId,
            country: row.country || null,
          } as any).eq("display_name", row.display_name);
          if (error) { errors++; } else { success++; }
        } else { errors++; }
      } catch { errors++; }
    }

    setResult({ success, errors });
    setImporting(false);
    toast({ title: t("import.success"), description: `${success} ${t("import.rowsImported")}` });
  };

  const importData = async () => {
    if (!user) return;
    setImporting(true);
    let success = 0, errors = 0;

    for (const row of rows) {
      try {
        const type = row.type?.toLowerCase();
        let data: any = {};
        try { data = JSON.parse(row.data || "{}"); } catch { errors++; continue; }

        // Look up user by email in display_name (since we store email as display_name by default)
        const { data: profile } = await supabase.from("profiles").select("id").eq("display_name", row.user_email).maybeSingle();
        if (!profile) { errors++; continue; }

        if (type === "mood") {
          const { error } = await supabase.from("mood_entries").insert({ user_id: profile.id, value: data.value || 5, sleep: data.sleep, stress: data.stress } as any);
          if (error) errors++; else success++;
        } else if (type === "journal") {
          const { error } = await supabase.from("journal_entries").insert({ user_id: profile.id, content: data.content || "", title: data.title } as any);
          if (error) errors++; else success++;
        } else { errors++; }
      } catch { errors++; }
    }

    setResult({ success, errors });
    setImporting(false);
    toast({ title: t("import.success"), description: `${success} ${t("import.rowsImported")}` });
  };

  const handleImport = () => {
    if (mode === "users") importUsers();
    else importData();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6 space-y-5">
      <div className="flex items-center gap-3">
        <FileSpreadsheet size={18} className="text-primary" />
        <h3 className="text-neural-title text-lg text-foreground">{t("import.title")}</h3>
      </div>

      <div className="flex gap-2">
        {(["users", "data"] as ImportMode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); setRows([]); setResult(null); }}
            className={`text-[9px] uppercase tracking-[0.3em] px-4 py-2 rounded-lg border transition-all ${
              mode === m ? "border-primary/30 text-primary bg-primary/5" : "border-border/30 text-muted-foreground hover:border-primary/20"
            }`}>
            {m === "users" ? t("import.users") : t("import.data")}
          </button>
        ))}
      </div>

      <p className="text-neural-label">{mode === "users" ? t("import.formatUsers") : t("import.formatData")}</p>

      <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      <button onClick={() => fileRef.current?.click()}
        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border/40 text-muted-foreground hover:border-primary/30 hover:text-primary transition-all w-full justify-center">
        <Upload size={16} />
        <span className="text-xs uppercase tracking-widest">{t("import.selectFile")}</span>
      </button>

      {rows.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-foreground">{t("import.preview")} · {rows.length} {t("import.rows")}</p>
          <div className="max-h-48 overflow-auto rounded-lg border border-border/20">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/20">
                  {Object.keys(rows[0]).map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-neural-label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-border/10">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-2 text-foreground truncate max-w-[150px]">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={handleImport} disabled={importing}
            className="btn-neural w-full disabled:opacity-50">
            {importing ? t("import.importing") : t("import.import")}
          </button>
        </div>
      )}

      {result && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          {result.errors === 0 ? <CheckCircle size={16} className="text-primary" /> : <AlertCircle size={16} className="text-neural-warm" />}
          <span className="text-sm text-foreground">
            {result.success} ✓ · {result.errors} ✗
          </span>
        </div>
      )}
    </motion.div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/i18n/LanguageContext";

export default function AIInsights() {
  const { t } = useLanguage();
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights");
      if (error) throw error;
      if (data?.error) {
        toast({ title: t("toast.error"), description: data.error, variant: "destructive" });
      } else {
        setInsights(data.insights);
      }
    } catch (e: any) {
      toast({ title: t("toast.error"), description: e.message || t("aiInsights.errorGenerate"), variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-1.5 h-4 rounded-full bg-accent-secondary shrink-0" />
          <p className="font-display text-[11px] tracking-[0.15em] uppercase text-text-secondary truncate">{t("aiInsights.title")}</p>
        </div>
        <button
          type="button"
          onClick={fetchInsights}
          disabled={loading}
          className="text-[9px] uppercase tracking-[0.12em] px-3 py-2 rounded-lg border border-accent-secondary/30 text-accent-secondary hover:bg-accent-secondary/10 transition-all duration-200 disabled:opacity-50 shrink-0 font-display"
        >
          {loading ? <RefreshCw size={12} className="animate-spin" strokeWidth={1.5} /> : t("aiInsights.analyze")}
        </button>
      </div>

      {insights ? (
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-text-primary/90 leading-relaxed">
          <ReactMarkdown>{insights}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-center py-6">
          <Sparkles size={28} strokeWidth={1} className="mx-auto mb-3 text-accent-secondary/40" />
          <p className="text-sm text-text-secondary mb-1">{t("aiInsights.getInsights")}</p>
          <p className="text-xs text-text-tertiary">{t("aiInsights.clickAnalyze")}</p>
        </div>
      )}
    </motion.div>
  );
}

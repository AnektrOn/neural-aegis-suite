import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

export default function AIInsights() {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights");
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erreur", description: data.error, variant: "destructive" });
      } else {
        setInsights(data.insights);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Impossible de générer les insights.", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles size={16} strokeWidth={1.5} className="text-accent" />
          <p className="text-neural-label">Insights IA</p>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="text-[9px] uppercase tracking-[0.3em] px-4 py-2 rounded-full border border-accent/20 text-accent hover:bg-accent/5 transition-all disabled:opacity-50"
        >
          {loading ? <RefreshCw size={12} className="animate-spin" /> : "Analyser"}
        </button>
      </div>

      {insights ? (
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90 leading-relaxed">
          <ReactMarkdown>{insights}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-center py-8">
          <Sparkles size={32} strokeWidth={1} className="mx-auto mb-4 text-accent/30" />
          <p className="text-sm text-muted-foreground mb-2">Obtenez des insights personnalisés basés sur vos données</p>
          <p className="text-xs text-muted-foreground/60">Cliquez sur "Analyser" pour générer vos recommandations hebdomadaires</p>
        </div>
      )}
    </motion.div>
  );
}

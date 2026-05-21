import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Send, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { NeuralCard } from "@/components/ui/neural-card";
import { Badge } from "@/components/ui/badge";
import NewsletterMarkdownImport from "@/components/admin/newsletter/NewsletterMarkdownImport";
import {
  listAllNewsletterEditionsAdmin,
  publishNewsletterEditionAdmin,
  type NewsletterEdition,
} from "@/services/newsletterService";
import { newsletterEditionUrl, newsletterHubUrl } from "@/lib/appUrl";

export default function NewsletterManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [editions, setEditions] = useState<NewsletterEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [selected, setSelected] = useState<NewsletterEdition | null>(null);

  const load = async () => {
    setLoading(true);
    const list = await listAllNewsletterEditionsAdmin();
    setEditions(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handlePublish = async () => {
    if (!selected?.id) {
      toast({
        title: t("toast.error"),
        description: t("newsletter.admin.selectEdition"),
        variant: "destructive",
      });
      return;
    }

    setPublishing(true);
    const result = await publishNewsletterEditionAdmin(selected.id);
    setPublishing(false);

    if (!result.ok) {
      toast({
        title: t("toast.error"),
        description: result.error ?? t("newsletter.admin.publishFailed"),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t("newsletter.admin.published"),
      description: t("newsletter.admin.publishedDesc", { count: String(result.queued ?? 0) }),
    });
    await load();
    const refreshed = await listAllNewsletterEditionsAdmin();
    const updated = refreshed.find((e) => e.id === selected.id);
    if (updated) setSelected(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <p className="text-neural-label mb-2">{t("newsletter.admin.kicker")}</p>
        <h1 className="text-neural-title text-2xl text-foreground">{t("newsletter.admin.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("newsletter.admin.subtitle")}</p>
        <p className="mt-2 text-xs text-text-tertiary">
          {t("newsletter.admin.hubLink")}:{" "}
          <a
            href={newsletterHubUrl()}
            className="text-accent-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {newsletterHubUrl()}
          </a>
        </p>
      </div>

      <NewsletterMarkdownImport
        onImported={(edition) => {
          setSelected(edition);
          void load();
        }}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <p className="text-neural-label">{t("newsletter.admin.list")}</p>
          {editions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("newsletter.admin.empty")}</p>
          ) : (
            editions.map((ed) => (
              <motion.button
                key={ed.id}
                type="button"
                onClick={() => setSelected(ed)}
                className="w-full text-left"
                whileTap={{ scale: 0.99 }}
              >
                <NeuralCard
                  variant="elevated"
                  className={`p-4 flex items-start justify-between gap-3 transition-colors duration-200 ${
                    selected?.id === ed.id ? "ring-1 ring-accent-primary/40" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ed.titleFr}</p>
                    <p className="text-xs text-text-tertiary mt-1 font-mono">/{ed.slug}</p>
                  </div>
                  <Badge variant={ed.status === "published" ? "default" : "outline"}>
                    {ed.status}
                  </Badge>
                </NeuralCard>
              </motion.button>
            ))
          )}
        </div>

        <NeuralCard variant="premium" className="p-6 space-y-4">
          <p className="text-neural-label">{t("newsletter.admin.publishPanel")}</p>
          {selected ? (
            <>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">{selected.titleFr}</p>
                <p className="text-xs text-muted-foreground line-clamp-4">{selected.excerptFr}</p>
                <p className="text-[10px] font-mono text-text-tertiary">/{selected.slug}</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  type="button"
                  className="min-h-[44px] gap-2"
                  disabled={publishing || selected.status === "published"}
                  onClick={handlePublish}
                >
                  <Send size={16} aria-hidden />
                  {publishing
                    ? t("newsletter.admin.publishing")
                    : t("newsletter.admin.publishSend")}
                </Button>
                <Button type="button" variant="outline" className="min-h-[44px] gap-2" asChild>
                  <a href={newsletterEditionUrl(selected.slug)} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} aria-hidden />
                    {t("newsletter.admin.preview")}
                  </a>
                </Button>
              </div>
              {selected.status === "published" && (
                <p className="text-xs text-text-tertiary">{t("newsletter.admin.alreadyPublished")}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("newsletter.admin.selectEdition")}</p>
          )}
        </NeuralCard>
      </div>

      <NeuralCard variant="ghost" className="p-4 flex items-center gap-3">
        <Mail size={18} className="text-primary shrink-0" aria-hidden />
        <p className="text-xs text-muted-foreground leading-relaxed">{t("newsletter.admin.emailNote")}</p>
      </NeuralCard>

      <Button asChild variant="outline" className="min-h-[44px]">
        <Link to="/newsletter">{t("newsletter.backToHub")}</Link>
      </Button>
    </div>
  );
}

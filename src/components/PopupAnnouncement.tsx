import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";

type PopupNotification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
};

export const POPUP_NOTIFICATION_TYPE = "popup";

/** Affiche en modale les notifications admin de type "popup" non lues. */
export default function PopupAnnouncement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<PopupNotification[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, link")
      .eq("user_id", user.id)
      .eq("type", POPUP_NOTIFICATION_TYPE)
      .eq("is_read", false)
      .order("created_at", { ascending: true })
      .limit(5);
    if (error) return;
    setQueue((data || []) as PopupNotification[]);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`popup-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { id: string; title: string; message: string; link: string | null; type: string; is_read: boolean };
          if (row.type !== POPUP_NOTIFICATION_TYPE || row.is_read) return;
          setQueue((prev) => (prev.some((n) => n.id === row.id) ? prev : [...prev, { id: row.id, title: row.title, message: row.message, link: row.link }]));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const current = queue[0];

  const dismiss = async (openLink: boolean) => {
    if (!current) return;
    const target = current.link;
    setQueue((prev) => prev.slice(1));
    await supabase.from("notifications").update({ is_read: true }).eq("id", current.id);
    if (openLink && target) navigate(target);
  };

  if (!current) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key={current.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70"
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-announcement-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="ethereal-glass relative w-full max-w-md p-6"
        >
          <button
            type="button"
            onClick={() => void dismiss(false)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t("common.close")}
          >
            <X size={16} strokeWidth={1.5} />
          </button>

          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Sparkles size={16} strokeWidth={1.5} className="text-primary" />
          </div>

          <h2 id="popup-announcement-title" className="text-neural-title text-lg text-foreground mb-2">
            {current.title}
          </h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{current.message}</p>

          <div className="mt-6 flex items-center gap-3">
            {current.link && (
              <button type="button" onClick={() => void dismiss(true)} className="btn-neural">
                {t("popup.open")}
              </button>
            )}
            <button
              type="button"
              onClick={() => void dismiss(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("popup.dismiss")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

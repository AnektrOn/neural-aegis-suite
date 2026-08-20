import { Eye, EyeOff } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useFreePreview } from "@/hooks/useFreePreview";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Floating admin control: preview the application as a free member.
 * Only rendered for admins.
 */
export default function FreePreviewToggle() {
  const { isAdmin } = useAdmin();
  const { enabled, toggle } = useFreePreview();
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  if (!isAdmin) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      className={`fixed bottom-24 right-4 z-[80] inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.12em] shadow-lg backdrop-blur-xl transition-colors md:bottom-6 ${
        enabled
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-border/50 bg-background/70 text-muted-foreground hover:text-foreground"
      }`}
    >
      {enabled ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
      {enabled ? (isFR ? "Vue Free active" : "Free view on") : isFR ? "Voir en Free" : "View as free"}
    </button>
  );
}

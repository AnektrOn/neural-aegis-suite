import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";

const KEY_PREFIX = "aegis_pulse_feature_announced_";

export default function PulseFeatureAnnounceModal() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      if (localStorage.getItem(`${KEY_PREFIX}${user.id}`) === "1") return;
    } catch {
      /* ignore */
    }
    const timer = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(timer);
  }, [user]);

  const dismiss = () => {
    if (user) {
      try {
        localStorage.setItem(`${KEY_PREFIX}${user.id}`, "1");
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  };

  const discover = () => {
    dismiss();
    navigate("/pulse");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent className="max-w-md border-border/60 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.25} />
          </div>
          <DialogTitle className="text-xl">{t("pulseAnnounce.title")}</DialogTitle>
          <DialogDescription className="leading-relaxed text-muted-foreground">
            {t("pulseAnnounce.body")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" className="w-full" onClick={discover}>
            {t("pulseAnnounce.cta")}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={dismiss}>
            {t("pulseAnnounce.later")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

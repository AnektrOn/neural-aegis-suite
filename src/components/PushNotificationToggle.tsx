import { useEffect, useState } from "react";
import { BellRing, BellOff, Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import { isPushSupported, isCurrentlySubscribed, subscribeToPush, unsubscribeFromPush } from "@/lib/push";
import {
  isNativePushEnvironment,
  isNativePushSubscribed,
  subscribeNativePush,
  unsubscribeNativePush,
} from "@/lib/nativePush";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  className?: string;
  compact?: boolean;
}

export default function PushNotificationToggle({ className, compact = false }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const native = isNativePushEnvironment();
  const [supported, setSupported] = useState(true);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (native) {
      setSupported(true);
      if (!user?.id) {
        setActive(false);
        return;
      }
      void isNativePushSubscribed(user.id).then(setActive);
      return;
    }
    setSupported(isPushSupported());
    void isCurrentlySubscribed().then(setActive);
  }, [native, user?.id]);

  if (!native && !supported) {
    return compact ? null : (
      <p className="text-xs text-muted-foreground">{t("push.unsupported")}</p>
    );
  }

  const toggle = async () => {
    if (!user) return;
    setBusy(true);
    try {
      if (native) {
        if (active) {
          await unsubscribeNativePush(user.id);
          setActive(false);
          toast({ title: t("push.disabledToast") });
        } else {
          const res = await subscribeNativePush(user.id);
          if (res.ok) {
            setActive(true);
            toast({
              title: t("push.enabledToast"),
              description:
                Capacitor.getPlatform() === "ios"
                  ? t("push.enabledNativeIos")
                  : t("push.enabledNativeAndroid"),
            });
          } else if (res.reason === "denied") {
            toast({
              title: t("push.deniedTitle"),
              description: t("push.deniedNativeDesc"),
              variant: "destructive",
            });
          } else {
            toast({ title: t("push.errorTitle"), description: res.reason ?? "—", variant: "destructive" });
          }
        }
        return;
      }

      if (active) {
        await unsubscribeFromPush();
        setActive(false);
        toast({ title: t("push.disabledToast") });
      } else {
        const res = await subscribeToPush(user.id);
        if (res.ok) {
          setActive(true);
          toast({ title: t("push.enabledToast"), description: t("push.enabledWebDesc") });
        } else if (res.reason === "denied") {
          toast({
            title: t("push.deniedTitle"),
            description: t("push.deniedWebDesc"),
            variant: "destructive",
          });
        } else {
          toast({ title: t("push.errorTitle"), description: res.reason ?? "—", variant: "destructive" });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border/30 bg-secondary/20 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : active ? <BellRing size={14} /> : <BellOff size={14} />}
      {compact ? null : <span>{active ? t("push.active") : t("push.activate")}</span>}
    </button>
  );
}

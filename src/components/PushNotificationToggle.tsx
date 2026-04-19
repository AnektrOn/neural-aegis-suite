import { useEffect, useState } from "react";
import { BellRing, BellOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isPushSupported, isCurrentlySubscribed, subscribeToPush, unsubscribeFromPush } from "@/lib/push";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  compact?: boolean;
}

export default function PushNotificationToggle({ className, compact = false }: Props) {
  const { user } = useAuth();
  const [supported, setSupported] = useState(true);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    void isCurrentlySubscribed().then(setActive);
  }, []);

  if (!supported) {
    return compact ? null : (
      <p className="text-xs text-muted-foreground">Notifications push non supportées sur ce navigateur.</p>
    );
  }

  const toggle = async () => {
    if (!user) return;
    setBusy(true);
    try {
      if (active) {
        await unsubscribeFromPush();
        setActive(false);
        toast({ title: "Notifications désactivées" });
      } else {
        const res = await subscribeToPush(user.id);
        if (res.ok) {
          setActive(true);
          toast({ title: "Notifications activées", description: "Tu recevras les alertes même app fermée." });
        } else if (res.reason === "denied") {
          toast({
            title: "Permission refusée",
            description: "Active les notifications dans les réglages du navigateur.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Erreur", description: res.reason ?? "—", variant: "destructive" });
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
      {compact ? null : <span>{active ? "Push activées" : "Activer push"}</span>}
    </button>
  );
}

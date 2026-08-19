import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { NeuralCard } from "@/components/ui/neural-card";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccess() {
  const { locale } = useLanguage();
  const { refetch, isActive } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFR = locale === "fr";

  useEffect(() => {
    const id = setInterval(() => void refetch(), 3000);
    const stop = setTimeout(() => clearInterval(id), 30000);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [refetch]);

  // Onboarding automatique dès que l'accès est activé — sauf si le bilan est déjà fait.
  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      let done = false;
      if (user?.id) {
        const { data } = await supabase
          .from("assessment_sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "submitted")
          .limit(1);
        done = !!data?.length;
      }
      if (!cancelled) navigate(done ? "/dashboard" : "/onboarding/assessment", { replace: true });
    }, 2500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [isActive, navigate, user?.id]);



  return (
    <div className="min-h-screen bg-aegis-gradient flex items-center justify-center p-4">
      <NeuralCard variant="elevated" glow="warm" className="max-w-md w-full p-8 text-center space-y-4">
        <CheckCircle2 className="w-10 h-10 text-primary mx-auto" aria-hidden />
        <h1 className="font-display text-2xl tracking-wide">
          {isFR ? "Paiement confirmé" : "Payment confirmed"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isActive
            ? isFR
              ? "Votre accès est activé. Bienvenue dans l'écosystème AEGIS."
              : "Your access is active. Welcome to the AEGIS ecosystem."
            : isFR
              ? "Activation de votre accès en cours, cela prend quelques secondes…"
              : "Activating your access, this takes a few seconds…"}
        </p>
        <Button asChild className="w-full min-h-[44px]">
          <Link to="/">{isFR ? "Aller à l'accueil" : "Go to home"}</Link>
        </Button>
      </NeuralCard>
    </div>
  );
}

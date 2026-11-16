import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [verified, setVerified] = useState<{ paid: boolean; accountReady: boolean } | null>(null);
  const [verificationError, setVerificationError] = useState(false);

  useEffect(() => {
    if (user || !sessionId) return;
    let cancelled = false;
    const check = async () => {
      const { data, error } = await supabase.functions.invoke("checkout-status", { body: { sessionId } });
      if (cancelled) return;
      if (error || !data) setVerificationError(true);
      else {
        setVerificationError(false);
        setVerified({ paid: data.paid === true, accountReady: data.accountReady === true });
      }
    };
    void check();
    const interval = setInterval(() => void check(), 3000);
    const stop = setTimeout(() => clearInterval(interval), 60000);
    return () => { cancelled = true; clearInterval(interval); clearTimeout(stop); };
  }, [user, sessionId]);

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
          {isActive || verified?.paid
            ? isFR ? "Paiement confirmé" : "Payment confirmed"
            : isFR ? "Vérification du paiement" : "Verifying payment"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {!user
            ? verificationError || !sessionId
              ? isFR ? "Le paiement n’a pas pu être vérifié. Contactez-nous si vous avez été débité." : "Payment could not be verified. Contact us if you were charged."
              : verified?.accountReady
                ? isFR ? "Votre accès est prêt. Si vous êtes nouveau, consultez l’e-mail envoyé à l’adresse utilisée sur Stripe pour choisir votre mot de passe. Si vous avez déjà un compte, connectez-vous." : "Your access is ready. New customers: check the email sent to your Stripe email address to choose your password. Existing customers: sign in."
                : verified?.paid
                  ? isFR ? "Paiement confirmé. Préparation de votre accès et de votre invitation par e-mail…" : "Payment confirmed. Preparing your access and email invitation…"
                  : isFR ? "Nous attendons la confirmation de Stripe. Aucun compte n’est créé avant confirmation." : "Waiting for Stripe confirmation. No account is created before confirmation."
            : isActive
            ? isFR
              ? "Votre accès est activé. Bienvenue dans l'écosystème AEGIS."
              : "Your access is active. Welcome to the AEGIS ecosystem."
            : isFR
              ? "Activation de votre accès en cours, cela prend quelques secondes…"
              : "Activating your access, this takes a few seconds…"}
        </p>
        {!user && verified?.accountReady && (
          <Button asChild className="w-full min-h-[44px]">
            <Link to="/auth">{isFR ? "Se connecter" : "Sign in"}</Link>
          </Button>
        )}
        <Button asChild className="w-full min-h-[44px]">
          <Link to="/">{isFR ? "Aller à l'accueil" : "Go to home"}</Link>
        </Button>
      </NeuralCard>
    </div>
  );
}

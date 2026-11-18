import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { VoiceAgent } from "@/components/voice/VoiceAgent";
import { LogosVoiceShell } from "@/features/logos/LogosVoiceShell";
import { useLogosPathChooser } from "@/features/logos/useLogosPathChooser";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Lab mirror of Welcome → Agent path chooser.
 * Same DB-weighted paths + dynamic titles; local sculpture covers only.
 */
export default function LogosDevPage() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  const { liveOverlay } = useLogosPathChooser({
    enabled: Boolean(user?.id),
    isFR,
    firstName: "toi",
  });

  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-center justify-between gap-3 px-4 py-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="pointer-events-auto w-fit bg-background/70 text-muted-foreground backdrop-blur"
        >
          <Link to="/dev">
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
            Dev lab
          </Link>
        </Button>
        <Badge variant="outline" className="pointer-events-none bg-background/70 font-normal backdrop-blur">
          LAB · opening paths
        </Badge>
      </div>

      {!user ? (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isFR
              ? "Connecte-toi pour prévisualiser Welcome → Agent."
              : "Sign in to preview Welcome → Agent."}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Auth</Link>
          </Button>
        </div>
      ) : (
        <LogosVoiceShell>
          <VoiceAgent
            layout="welcome"
            backHref="/dev"
            enableCall={false}
            matchWelcomeVisual
            hideHeroTitle
            pathCardsMorph
            requirePathChoice
            liveOverlay={liveOverlay}
          />
        </LogosVoiceShell>
      )}
    </div>
  );
}

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GuardianCaptions } from "@/features/guardian/components/GuardianCaptions";
import { GuardianNebula } from "@/features/guardian/components/GuardianNebula";
import { getGuardianAudioSrc } from "@/features/guardian/guardianAudio";
import type { QuantumNebulaHandle } from "@/components/ui/quantum-nebula";
import { useLanguage } from "@/i18n/LanguageContext";
import { copy } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

export function GuardianVoiceScene() {
  const { t, locale } = useLanguage();
  const { isFR, next } = usePromotePlayer();
  const nebulaRef = useRef<QuantumNebulaHandle>(null);
  const [voiceStarted, setVoiceStarted] = useState(false);
  const [voiceEnded, setVoiceEnded] = useState(false);
  const [needsTap, setNeedsTap] = useState(true);
  const [audioPaused, setAudioPaused] = useState(false);

  const audioSrc = getGuardianAudioSrc("male", locale === "fr" ? "fr" : "en", 1);
  const nebulaState = voiceStarted && !voiceEnded ? ("mouvement" as const) : ("repos" as const);
  const showTap = needsTap && !voiceStarted && !voiceEnded;

  const startVoice = () => {
    setAudioPaused(false);
    void nebulaRef.current?.playAudio()?.then((ok) => {
      if (ok) {
        setVoiceStarted(true);
        setNeedsTap(false);
      } else {
        setNeedsTap(true);
      }
    });
  };

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-black">
      <GuardianNebula
        ref={nebulaRef}
        state={nebulaState}
        fullscreen
        className="pointer-events-none z-0"
        audioSrc={audioSrc}
        autoPlayAudio={false}
        audioPaused={audioPaused}
        onAudioPlay={() => {
          setVoiceStarted(true);
          setNeedsTap(false);
          setAudioPaused(false);
        }}
        onAudioEnded={() => setVoiceEnded(true)}
        onAudioBlocked={() => setNeedsTap(true)}
        onAudioError={() => setNeedsTap(true)}
      />
      <GuardianCaptions
        text={
          voiceStarted && !voiceEnded
            ? copy(
                isFR,
                "Bonjour. Je m’appelle Argos. Je suis là pour vous accueillir dans AEGIS.",
                "Hello. My name is Argos. I'm here to welcome you to AEGIS.",
              )
            : null
        }
      />
      {showTap ? (
        <div className="absolute inset-x-0 bottom-0 z-40 flex flex-col items-center gap-3 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10 bg-gradient-to-t from-background/90 via-background/55 to-transparent">
          <Button type="button" className="w-full max-w-xs rounded-full font-display tracking-wide" onClick={startVoice}>
            {t("guardian.audio.tapToStart")}
          </Button>
          <Button type="button" variant="ghost" className="w-full max-w-xs text-muted-foreground hover:text-foreground" onClick={next}>
            {t("guardian.skip")}
          </Button>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 z-40 flex justify-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Button type="button" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={next}>
            {t("guardian.skip")}
          </Button>
        </div>
      )}
    </div>
  );
}

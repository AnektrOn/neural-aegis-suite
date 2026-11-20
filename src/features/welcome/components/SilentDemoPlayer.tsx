import React, { useState, useEffect, useRef } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { getGuardianAudioSrc } from "@/features/guardian/guardianAudio";
import { SovereignWaveform } from "./SovereignWaveform";

interface StepData {
  timeMs: number;
  stage: "INPUT_FOUNDER" | "PROCESSING_AEGIS" | "DECISION_LOGOS";
  textFr: string;
  textEn: string;
}

const SCENARIO_TIMELINE: StepData[] = [
  {
    timeMs: 0,
    stage: "INPUT_FOUNDER",
    textFr:
      "Dirigeant : « Je passe mes nuits sur la tréso pour ne pas affronter mon associé. »",
    textEn:
      "Executive: “I spend my nights on cash flow so I don't have to face my partner.”",
  },
  {
    timeMs: 3800,
    stage: "PROCESSING_AEGIS",
    textFr: "[ANALYSE VOCALE EN COURS…]",
    textEn: "[VOICE ANALYSIS IN PROGRESS…]",
  },
  {
    timeMs: 5000,
    stage: "DECISION_LOGOS",
    textFr:
      "LOGOS : « Vous utilisez les chiffres comme un anesthésiant. Le litige n'est pas financier, il est humain. Signez l'avenant jeudi : son veto tombe à 7 %. »",
    textEn:
      "LOGOS: “You use numbers as an anesthetic. The dispute isn't financial — it's human. Sign the amendment Thursday: his veto drops to 7%.”",
  },
];

export interface SilentDemoPlayerProps {
  locale?: "fr" | "en";
}

export const SilentDemoPlayer: React.FC<SilentDemoPlayerProps> = ({
  locale = "fr",
}) => {
  const isFR = locale !== "en";
  const [currentStage, setCurrentStage] =
    useState<StepData["stage"]>("INPUT_FOUNDER");
  const [displayedText, setDisplayedText] = useState<string>(
    isFR ? SCENARIO_TIMELINE[0].textFr : SCENARIO_TIMELINE[0].textEn,
  );
  const [cycleCount, setCycleCount] = useState<number>(0);

  // Vrai lecteur audio LOGOS (timbre chirurgical Argos / Iris — Protocole Décisionnel)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [voicePersona, setVoicePersona] = useState<"male" | "female">("male");
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioCurrentSec, setAudioCurrentSec] = useState<number>(0);
  const [audioDurationSec, setAudioDurationSec] = useState<number>(18);

  const audioSrc = getGuardianAudioSrc(
    voicePersona,
    isFR ? "fr" : "en",
    4, // Step 4: Decision Log / Arbitrage vocal
  );

  useEffect(() => {
    // Si l'utilisateur écoute l'extrait audio réel, on verrouille l'affichage sur le verdict vocal LOGOS
    if (isAudioPlaying) {
      setCurrentStage("DECISION_LOGOS");
      setDisplayedText(
        isFR ? SCENARIO_TIMELINE[2].textFr : SCENARIO_TIMELINE[2].textEn,
      );
      return;
    }

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Phase 1 : Entrée vocale du dirigeant
    timeouts.push(
      setTimeout(() => {
        setCurrentStage("INPUT_FOUNDER");
        setDisplayedText(
          isFR ? SCENARIO_TIMELINE[0].textFr : SCENARIO_TIMELINE[0].textEn,
        );
      }, 100),
    );

    // Phase 2 : Isolation logique par l'exocortex
    timeouts.push(
      setTimeout(() => {
        setCurrentStage("PROCESSING_AEGIS");
        setDisplayedText(
          isFR ? SCENARIO_TIMELINE[1].textFr : SCENARIO_TIMELINE[1].textEn,
        );
      }, 3800),
    );

    // Phase 3 : Verdict souverain LOGOS
    timeouts.push(
      setTimeout(() => {
        setCurrentStage("DECISION_LOGOS");
        setDisplayedText(
          isFR ? SCENARIO_TIMELINE[2].textFr : SCENARIO_TIMELINE[2].textEn,
        );
      }, 5000),
    );

    // Redémarrage de la boucle — beat LOGOS plus long (scénario 10)
    timeouts.push(
      setTimeout(() => {
        setCycleCount((prev) => prev + 1);
      }, 13000),
    );

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [cycleCount, isFR, isAudioPlaying]);

  // Arrêt propre quand la langue ou la voix change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsAudioPlaying(false);
    setAudioCurrentSec(0);
  }, [audioSrc]);

  const toggleRealAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
    } else {
      void audio
        .play()
        .then(() => {
          setIsAudioPlaying(true);
        })
        .catch(() => {
          setIsAudioPlaying(false);
        });
    }
  };

  const switchPersona = (nextPersona: "male" | "female") => {
    if (nextPersona === voicePersona) return;
    setVoicePersona(nextPersona);
  };

  const formatSec = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="welcome-glass-tile mx-auto w-full max-w-xl p-5 text-left font-body">
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="none"
        crossOrigin="anonymous"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) {
            setAudioDurationSec(Math.round(d));
          }
        }}
        onTimeUpdate={(e) => {
          setAudioCurrentSec(e.currentTarget.currentTime);
        }}
        onEnded={() => {
          setIsAudioPlaying(false);
          setAudioCurrentSec(0);
        }}
        onPause={() => {
          setIsAudioPlaying(false);
        }}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/25 pb-3">
        <div className="flex items-center space-x-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse"
            aria-hidden
          />
          <span className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {isAudioPlaying
              ? isFR
                ? ` CANAL AUDIO RÉEL ACTIF // TIMBRE ${voicePersona === "male" ? "ARGOS" : "IRIS"}`
                : `LIVE AUDIO STREAM // ${voicePersona === "male" ? "ARGOS" : "IRIS"} VOICE`
              : currentStage === "INPUT_FOUNDER"
                ? isFR
                  ? "CANAL VOCAL DIRIGEANT EN COURS"
                  : "EXECUTIVE VOICE CHANNEL ACTIVE"
                : currentStage === "PROCESSING_AEGIS"
                  ? isFR
                    ? "NOYAU AEGIS // ANALYSE DE CRISE"
                    : "AEGIS CORE // CRISIS ANALYSIS"
                  : isFR
                    ? "VERDICT DÉCISIONNEL VERROUILLÉ"
                    : "DECISION VERDICT LOCKED"}
          </span>
        </div>
        <span className="font-display text-[10px] uppercase tracking-[0.22em] tabular-nums text-muted-foreground/70">
          {isAudioPlaying
            ? `${formatSec(audioCurrentSec)} / ${formatSec(audioDurationSec)}`
            : isFR
              ? "CANAL 01 // TEMPO RÉEL"
              : "CHANNEL 01 // REAL-TIME"}
        </span>
      </div>

      <div className="mb-4 flex min-h-[60px] items-center justify-center">
        <SovereignWaveform
          isActive={isAudioPlaying || currentStage !== "PROCESSING_AEGIS"}
        />
      </div>

      {/* Bouton d'écoute audio réelle en 1 clic (Correction Règle Chris Raroque & Jason Lee) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5">
        <button
          type="button"
          onClick={toggleRealAudio}
          className="group inline-flex cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-left font-display text-[10px] uppercase tracking-[0.2em] text-primary"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-primary transition-transform group-hover:scale-105">
            {isAudioPlaying ? (
              <Pause size={12} aria-hidden />
            ) : (
              <Play size={12} className="translate-x-[0.5px]" aria-hidden />
            )}
          </span>
          <span>
            {isAudioPlaying
              ? isFR
                ? "PAUSE // ÉCOUTE DU TIMBRE RÉEL EN COURS"
                : "PAUSE // LISTENING TO REAL VOICE TIMBRE"
              : isFR
                ? "▶ Écouter un arbitrage réel (18 sec)"
                : "▶ Listen to a real arbitration (18 sec)"}
          </span>
        </button>

        <div className="flex items-center gap-1">
          <Volume2 size={12} className="mr-1 text-primary/75" aria-hidden />
          <button
            type="button"
            onClick={() => switchPersona("male")}
            className={`cursor-pointer rounded-full px-2 py-0.5 font-display text-[9px] uppercase tracking-[0.18em] transition-colors ${
              voicePersona === "male"
                ? "bg-primary text-primary-foreground"
                : "bg-background/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            Argos
          </button>
          <button
            type="button"
            onClick={() => switchPersona("female")}
            className={`cursor-pointer rounded-full px-2 py-0.5 font-display text-[9px] uppercase tracking-[0.18em] transition-colors ${
              voicePersona === "female"
                ? "bg-primary text-primary-foreground"
                : "bg-background/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            Iris
          </button>
        </div>
      </div>

      <div className="flex min-h-[148px] flex-col justify-center">
        <p
          className={`text-sm leading-relaxed transition-colors duration-200 ${
            currentStage === "INPUT_FOUNDER"
              ? "italic text-muted-foreground"
              : currentStage === "PROCESSING_AEGIS"
                ? "font-display text-xs uppercase tracking-[0.14em] text-primary"
                : "font-medium text-foreground"
          }`}
        >
          {displayedText}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/25 pt-3 font-display text-[10px] uppercase tracking-[0.22em] tabular-nums text-muted-foreground/75">
        <span>
          {isFR ? "AUCUNE TRACE CONSERVÉE" : "ZERO TRACE RETAINED"}
        </span>
        <span>
          {isFR ? "LATENCE D'ARBITRAGE : 1.2S" : "ARBITRATION LATENCY: 1.2S"}
        </span>
      </div>
    </div>
  );
};

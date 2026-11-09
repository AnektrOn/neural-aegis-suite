import { useState } from "react";
import { Compass, Sparkles, AlertCircle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type FunctionKey = "pensee" | "sentiment" | "sensation" | "intuition";

interface FunctionDetail {
  key: FunctionKey;
  label: string;
  originalTerm: string;
  axis: "rational" | "irrational";
  nature: string;
  opposite: FunctionKey;
  description: string;
  inferiorManifestation: string;
}

const FUNCTIONS: Record<FunctionKey, FunctionDetail> = {
  pensee: {
    key: "pensee",
    label: "Pensée",
    originalTerm: "Denken",
    axis: "rational",
    nature: "Fonction Rationnelle de Jugement",
    opposite: "sentiment",
    description: "Relie les perceptions par la logique conceptuelle, le principe de non-contradiction et la recherche de la vérité objective.",
    inferiorManifestation: "Sentiments archaïques, susceptibilité extrême, bouffées d'amertume ou d'attachements infantiles incontrôlés.",
  },
  sentiment: {
    key: "sentiment",
    label: "Sentiment",
    originalTerm: "Fühlen",
    axis: "rational",
    nature: "Fonction Rationnelle de Jugement",
    opposite: "pensee",
    description: "Évalue la relation entre le sujet et le monde par une pesée affective de valeur (bien/mal, harmonieux/dissonant). C'est un discernement cognitif, pas une simple émotion.",
    inferiorManifestation: "Pensée dogmatique, froide, réductrice ou obsédée par des raisonnements théoriques stériles et cyniques.",
  },
  sensation: {
    key: "sensation",
    label: "Sensation",
    originalTerm: "Empfinden",
    axis: "irrational",
    nature: "Fonction Irrationnelle de Perception",
    opposite: "intuition",
    description: "Enregistre la réalité concrète et immédiate via les 5 organes des sens (« ce qui existe hic et nunc »).",
    inferiorManifestation: "Pressentiments morbides, paranoïa, angoisse superstitieuse de catastrophes futures imaginaires.",
  },
  intuition: {
    key: "intuition",
    label: "Intuition",
    originalTerm: "Intuition",
    axis: "irrational",
    nature: "Fonction Irrationnelle de Perception",
    opposite: "sensation",
    description: "Perçoit par voie inconsciente les significations cachées, les potentiels d'avenir et les correspondances invisibles (« ce qui pourrait être »).",
    inferiorManifestation: "Négligence crue du corps, maladresse physique, compulsions sensorielles brutales (nourriture, dépenses, épuisement physique).",
  },
};

export default function TypologyCompassWidget() {
  const [primaryKey, setPrimaryKey] = useState<FunctionKey>("pensee");
  const [attitude, setAttitude] = useState<"introversion" | "extraversion">("introversion");

  const primary = FUNCTIONS[primaryKey];
  const inferior = FUNCTIONS[primary.opposite];

  return (
    <div className="rounded-2xl border border-[var(--codex-cardline)] bg-[var(--codex-surface)] p-5 sm:p-7 my-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--codex-cardline)] pb-4">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-[var(--codex-gold)]" />
          <h4 className="text-base font-medium text-[var(--codex-ink)]">
            Boussole Typologique & Fonction Inférieure
          </h4>
        </div>

        {/* Attitude selector */}
        <div className="flex items-center rounded-lg border border-[var(--codex-cardline)] bg-[var(--codex-bg)] p-0.5">
          <button
            type="button"
            onClick={() => setAttitude("introversion")}
            className={`px-2.5 py-1 text-xs rounded-md font-mono-code transition-colors ${
              attitude === "introversion"
                ? "bg-[var(--codex-surface-elevated)] text-[var(--codex-gold)] font-medium"
                : "text-[var(--codex-ink-tertiary)] hover:text-[var(--codex-ink)]"
            }`}
          >
            Introversion (Libido vers l'Intérieur)
          </button>
          <button
            type="button"
            onClick={() => setAttitude("extraversion")}
            className={`px-2.5 py-1 text-xs rounded-md font-mono-code transition-colors ${
              attitude === "extraversion"
                ? "bg-[var(--codex-surface-elevated)] text-[var(--codex-gold)] font-medium"
                : "text-[var(--codex-ink-tertiary)] hover:text-[var(--codex-ink)]"
            }`}
          >
            Extraversion (Libido vers l'Objet)
          </button>
        </div>
      </div>

      {/* Main Grid: Compass interactive + Diagnostic Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-center">
        {/* Interactive Quadrant (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* Background crosshair axes */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-[var(--codex-cardline)]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-full w-[1px] bg-[var(--codex-cardline)]" />
            </div>
            <div className="absolute w-44 h-44 rounded-full border border-[var(--codex-cardline)]/70 pointer-events-none" />
            <div className="absolute w-60 h-60 rounded-full border border-[var(--codex-cardline)]/40 pointer-events-none stroke-dash" />

            {/* Center: Psyche Core */}
            <div className="relative z-10 flex flex-col items-center justify-center w-20 h-20 rounded-full bg-[var(--codex-surface-elevated)] border border-[var(--codex-cardline)] shadow-inner text-center p-2">
              <span className="font-mono-code text-[9px] uppercase tracking-wider text-[var(--codex-gold)]">
                Psyché
              </span>
              <span className="text-[11px] font-medium text-[var(--codex-ink)] capitalize">
                {attitude === "introversion" ? "Introvertie" : "Extravertie"}
              </span>
            </div>

            {/* North: PENSÉE */}
            <button
              type="button"
              onClick={() => setPrimaryKey("pensee")}
              className={`absolute top-0 z-20 flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border text-xs transition-all ${
                primaryKey === "pensee"
                  ? "border-[var(--codex-gold)] bg-[var(--codex-gold-muted)] text-[var(--codex-gold-light)] font-semibold scale-105 shadow-md"
                  : primary.opposite === "pensee"
                  ? "border-red-500/40 bg-red-500/10 text-red-300 font-medium scale-95"
                  : "border-[var(--codex-cardline)] bg-[var(--codex-surface-elevated)] text-[var(--codex-ink-secondary)] hover:border-[var(--codex-cardline-hover)]"
              }`}
            >
              <span>Pensée</span>
              <span className="font-garamond italic text-[10px] opacity-75">Denken</span>
            </button>

            {/* South: SENTIMENT */}
            <button
              type="button"
              onClick={() => setPrimaryKey("sentiment")}
              className={`absolute bottom-0 z-20 flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border text-xs transition-all ${
                primaryKey === "sentiment"
                  ? "border-[var(--codex-gold)] bg-[var(--codex-gold-muted)] text-[var(--codex-gold-light)] font-semibold scale-105 shadow-md"
                  : primary.opposite === "sentiment"
                  ? "border-red-500/40 bg-red-500/10 text-red-300 font-medium scale-95"
                  : "border-[var(--codex-cardline)] bg-[var(--codex-surface-elevated)] text-[var(--codex-ink-secondary)] hover:border-[var(--codex-cardline-hover)]"
              }`}
            >
              <span>Sentiment</span>
              <span className="font-garamond italic text-[10px] opacity-75">Fühlen</span>
            </button>

            {/* West: SENSATION */}
            <button
              type="button"
              onClick={() => setPrimaryKey("sensation")}
              className={`absolute left-0 z-20 flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                primaryKey === "sensation"
                  ? "border-[var(--codex-gold)] bg-[var(--codex-gold-muted)] text-[var(--codex-gold-light)] font-semibold scale-105 shadow-md"
                  : primary.opposite === "sensation"
                  ? "border-red-500/40 bg-red-500/10 text-red-300 font-medium scale-95"
                  : "border-[var(--codex-cardline)] bg-[var(--codex-surface-elevated)] text-[var(--codex-ink-secondary)] hover:border-[var(--codex-cardline-hover)]"
              }`}
            >
              <span>Sensation</span>
              <span className="font-garamond italic text-[10px] opacity-75">Empfinden</span>
            </button>

            {/* East: INTUITION */}
            <button
              type="button"
              onClick={() => setPrimaryKey("intuition")}
              className={`absolute right-0 z-20 flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                primaryKey === "intuition"
                  ? "border-[var(--codex-gold)] bg-[var(--codex-gold-muted)] text-[var(--codex-gold-light)] font-semibold scale-105 shadow-md"
                  : primary.opposite === "intuition"
                  ? "border-red-500/40 bg-red-500/10 text-red-300 font-medium scale-95"
                  : "border-[var(--codex-cardline)] bg-[var(--codex-surface-elevated)] text-[var(--codex-ink-secondary)] hover:border-[var(--codex-cardline-hover)]"
              }`}
            >
              <span>Intuition</span>
              <span className="font-garamond italic text-[10px] opacity-75">Intuition</span>
            </button>
          </div>

          <p className="mt-3 text-[11px] font-mono-code text-[var(--codex-ink-tertiary)] text-center">
            Cliquez sur une fonction pour la placer en fonction principale consciente.
          </p>
        </div>

        {/* Diagnostic Breakdown Cards (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Conscious Primary Card */}
          <div className="rounded-xl border border-[var(--codex-cardline)] bg-[var(--codex-surface-elevated)] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[var(--codex-gold)]" />
                <span className="font-mono-code text-[11px] uppercase tracking-wider text-[var(--codex-gold)]">
                  Fonction Principale (Conscience Vigile)
                </span>
              </div>
              <Badge variant="outline" className="font-mono-code text-[10px] border-[var(--codex-cardline)]">
                {primary.nature}
              </Badge>
            </div>

            <div className="flex items-baseline gap-2 mb-1.5">
              <h5 className="text-lg font-medium text-[var(--codex-ink)]">{primary.label}</h5>
              <span className="font-garamond italic text-sm text-[var(--codex-ink-secondary)]">
                (*{primary.originalTerm}*)
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[var(--codex-ink-secondary)] leading-relaxed">
              {primary.description}
            </p>
          </div>

          {/* Unconscious Inferior Card */}
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="font-mono-code text-[11px] uppercase tracking-wider text-red-400 font-medium">
                  Fonction Inférieure (*Die minderwertige Funktion*)
                </span>
              </div>
              <span className="text-[10px] font-mono-code text-red-400/80 uppercase">
                Immergée dans l'Inconscient
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1.5">
              <h5 className="text-lg font-medium text-[var(--codex-ink)]">{inferior.label}</h5>
              <span className="font-garamond italic text-sm text-[var(--codex-ink-secondary)]">
                (*{inferior.originalTerm}*)
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[var(--codex-ink-secondary)] leading-relaxed mb-3">
              <strong className="text-[var(--codex-ink)]">Manifestation clinique inconsciente :</strong> {inferior.inferiorManifestation}
            </p>

            <div className="rounded-lg border border-[var(--codex-cardline)] bg-[var(--codex-surface)] p-2.5 text-xs text-[var(--codex-ink-secondary)] flex items-start gap-2">
              <Shield className="h-4 w-4 text-[var(--codex-gold)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--codex-gold)]">Le Cheval de Troie des Complexes :</strong> C'est par la fonction inférieure {inferior.label.toLowerCase()} que les complexes affectifs font irruption pour renverser l'édifice arrogant du Moi.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

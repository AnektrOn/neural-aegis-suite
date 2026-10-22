import { useRef } from "react";
import {
  LANDING_FILTER_PRESETS,
  LANDING_RENDER_TUNING_DEFAULTS,
  applyLandingFilterPreset,
  type LandingFilterId,
  type LandingRenderTuning,
} from "../scene/landingRenderTuning";

type PerformanceDebugInfo = {
  profile: string;
  pixelRatio: number;
  pausedByVisibility: boolean;
  idleThrottleActive: boolean;
};

type Props = {
  tuning: LandingRenderTuning;
  onChange: (next: LandingRenderTuning) => void;
  onClose: () => void;
  performanceDebug?: PerformanceDebugInfo;
};

function Slider({
  label,
  min,
  max,
  step,
  value,
  digits = 2,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  digits?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="monolith-panel-field">
      <span>
        {label}
        <em>{value.toFixed(digits)}</em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export default function PrismLandingSettingsPanel({
  tuning,
  onChange,
  onClose,
  performanceDebug,
}: Props) {
  const latest = useRef(tuning);
  latest.current = tuning;

  const patch = (partial: Partial<LandingRenderTuning>) => {
    const next = {
      ...latest.current,
      ...partial,
      // Tout réglage manuel bascule le preset en « custom » sauf si on force filterId.
      filterId: partial.filterId ?? ("custom" as LandingFilterId),
    };
    latest.current = next;
    onChange(next);
  };

  const applyPreset = (id: LandingFilterId) => {
    const next = applyLandingFilterPreset(latest.current, id);
    latest.current = next;
    onChange(next);
  };

  return (
    <aside className="monolith-panel prism-landing-settings" aria-label="Réglages caméra et rendu">
      <div className="monolith-panel-head">
        Caméra & rendu
        <div className="monolith-panel-actions">
          <button
            type="button"
            className="monolith-panel-btn"
            onClick={() => onChange({ ...LANDING_RENDER_TUNING_DEFAULTS })}
          >
            Reset
          </button>
          <button type="button" className="monolith-panel-btn" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
      <div className="monolith-panel-body">
        <section className="monolith-panel-section">
          <h3>Filtres</h3>
          <p className="monolith-panel-hint">Presets façon Lightroom — ajustables ensuite.</p>
          <div className="prism-landing-filter-grid" role="list">
            {LANDING_FILTER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                role="listitem"
                className={`prism-landing-filter-chip${
                  tuning.filterId === preset.id ? " is-active" : ""
                }`}
                onClick={() => applyPreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        <section className="monolith-panel-section">
          <h3>Lumière & ton</h3>
          <Slider
            label="Exposition"
            min={0.4}
            max={1.8}
            step={0.01}
            value={tuning.exposure}
            onChange={(exposure) => patch({ exposure })}
          />
          <Slider
            label="Contraste"
            min={0.5}
            max={1.8}
            step={0.01}
            value={tuning.contrast}
            onChange={(contrast) => patch({ contrast })}
          />
          <Slider
            label="Hautes lumières"
            min={-1}
            max={1}
            step={0.01}
            value={tuning.highlights}
            onChange={(highlights) => patch({ highlights })}
          />
          <Slider
            label="Ombres"
            min={-1}
            max={1}
            step={0.01}
            value={tuning.shadows}
            onChange={(shadows) => patch({ shadows })}
          />
          <Slider
            label="Blancs"
            min={-1}
            max={1}
            step={0.01}
            value={tuning.whites}
            onChange={(whites) => patch({ whites })}
          />
          <Slider
            label="Noirs"
            min={-1}
            max={1}
            step={0.01}
            value={tuning.blacks}
            onChange={(blacks) => patch({ blacks })}
          />
          <Slider
            label="Fade (noirs relevés)"
            min={0}
            max={0.2}
            step={0.005}
            digits={3}
            value={tuning.fade}
            onChange={(fade) => patch({ fade })}
          />
        </section>

        <section className="monolith-panel-section">
          <h3>Couleur</h3>
          <Slider
            label="Température"
            min={-1}
            max={1}
            step={0.01}
            value={tuning.temperature}
            onChange={(temperature) => patch({ temperature })}
          />
          <Slider
            label="Teinte"
            min={-1}
            max={1}
            step={0.01}
            value={tuning.tint}
            onChange={(tint) => patch({ tint })}
          />
          <Slider
            label="Saturation"
            min={0}
            max={1.6}
            step={0.01}
            value={tuning.saturation}
            onChange={(saturation) => patch({ saturation })}
          />
          <Slider
            label="Vibrance"
            min={0}
            max={1}
            step={0.01}
            value={tuning.vibrance}
            onChange={(vibrance) => patch({ vibrance })}
          />
        </section>

        <section className="monolith-panel-section">
          <h3>Effets</h3>
          <Slider
            label="Grain"
            min={0}
            max={0.12}
            step={0.001}
            digits={3}
            value={tuning.grain}
            onChange={(grain) => patch({ grain })}
          />
          <Slider
            label="Taille du grain"
            min={0.5}
            max={3}
            step={0.05}
            value={tuning.grainSize}
            onChange={(grainSize) => patch({ grainSize })}
          />
          <Slider
            label="Vignette"
            min={0}
            max={1}
            step={0.01}
            value={tuning.vignette}
            onChange={(vignette) => patch({ vignette })}
          />
          <Slider
            label="Bloom"
            min={0}
            max={1.2}
            step={0.01}
            value={tuning.bloomStrength}
            onChange={(bloomStrength) => patch({ bloomStrength })}
          />
          <Slider
            label="Aberration chromatique"
            min={0}
            max={0.008}
            step={0.0001}
            digits={4}
            value={tuning.chromaticAberration}
            onChange={(chromaticAberration) => patch({ chromaticAberration })}
          />
          <Slider
            label="Densité brume"
            min={0.002}
            max={0.04}
            step={0.0005}
            digits={4}
            value={tuning.fogDensity}
            onChange={(fogDensity) => patch({ fogDensity })}
          />
        </section>

        <section className="monolith-panel-section">
          <h3>Caméra globale</h3>
          <Slider
            label="FOV"
            min={18}
            max={75}
            step={1}
            digits={0}
            value={tuning.fov}
            onChange={(fov) => patch({ fov })}
          />
        </section>

        <section className="monolith-panel-section">
          <h3>3e personne (exploration)</h3>
          <p className="monolith-panel-hint">Actifs en mode « Entrer dans la scène ».</p>
          <Slider
            label="Distance caméra"
            min={2}
            max={12}
            step={0.1}
            value={tuning.exploreCamDistance}
            onChange={(exploreCamDistance) => patch({ exploreCamDistance })}
          />
          <Slider
            label="Hauteur caméra"
            min={0.8}
            max={5}
            step={0.1}
            value={tuning.exploreCamHeight}
            onChange={(exploreCamHeight) => patch({ exploreCamHeight })}
          />
          <Slider
            label="Suivi caméra (lerp)"
            min={1}
            max={18}
            step={0.5}
            value={tuning.exploreCamLerp}
            onChange={(exploreCamLerp) => patch({ exploreCamLerp })}
          />
          <Slider
            label="Rotation corps"
            min={2}
            max={24}
            step={0.5}
            value={tuning.exploreBodyLerp}
            onChange={(exploreBodyLerp) => patch({ exploreBodyLerp })}
          />
          <Slider
            label="Vitesse max"
            min={2}
            max={12}
            step={0.25}
            value={tuning.exploreMaxSpeed}
            onChange={(exploreMaxSpeed) => patch({ exploreMaxSpeed })}
          />
        </section>

        <section className="monolith-panel-section">
          <h3>Fil conducteur</h3>
          <Slider
            label="Opacité ligne"
            min={0.15}
            max={1}
            step={0.01}
            value={tuning.guideLineOpacity}
            onChange={(guideLineOpacity) => patch({ guideLineOpacity })}
          />
        </section>

        {performanceDebug ? (
          <section className="monolith-panel-section" aria-label="Performance (debug)">
            <h3>Performance</h3>
            <p className="prism-landing-perf-debug">
              Profil <strong>{performanceDebug.profile}</strong>
              <br />
              DPR {performanceDebug.pixelRatio.toFixed(2)}
              <br />
              Onglet caché : {performanceDebug.pausedByVisibility ? "oui (pause)" : "non"}
              <br />
              Throttle idle : {performanceDebug.idleThrottleActive ? "actif" : "inactif"}
            </p>
          </section>
        ) : null}
      </div>
    </aside>
  );
}

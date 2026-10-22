import { useRef } from "react";
import {
  MONOLITH_PIPELINE_DEFAULTS,
  type MonolithDebugView,
  type MonolithPipelineTuning,
} from "../monolith/monolithPipelineDebug";

const VIEWS: { id: MonolithDebugView; label: string }[] = [
  { id: "final", label: "Final" },
  { id: "hdr", label: "HDR" },
  { id: "nobloom", label: "Sans bloom" },
  { id: "nogodrays", label: "Sans rays" },
  { id: "nopost", label: "Brut" },
];

type Props = {
  tuning: MonolithPipelineTuning;
  onChange: (next: MonolithPipelineTuning) => void;
  onCamera: (bookmark: "near" | "design" | "far") => void;
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

export function tuningToSearch(tuning: MonolithPipelineTuning) {
  const params = new URLSearchParams();
  if (tuning.debugView !== "final") params.set("monolithDebug", tuning.debugView);
  params.set("exposure", String(tuning.exposure));
  params.set("bloom", String(tuning.bloomIntensity));
  params.set("bloomThreshold", String(tuning.bloomThreshold));
  params.set("bloomSmooth", String(tuning.bloomSmoothing));
  if (tuning.adaptationEnabled) params.set("adapt", "1");
  params.set("glow", String(tuning.glowIntensity));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export default function MonolithSettingsPanel({
  tuning,
  onChange,
  onCamera,
}: Props) {
  const latest = useRef(tuning);
  latest.current = tuning;
  const patch = (partial: Partial<MonolithPipelineTuning>) => {
    const next = { ...latest.current, ...partial };
    latest.current = next;
    onChange(next);
  };

  return (
    <aside className="monolith-panel" aria-label="Réglages monolithe">
      <div className="monolith-panel-head">
        Réglages
        <div className="monolith-panel-actions">
          <button
            type="button"
            className="monolith-panel-btn"
            onClick={() => onChange({ ...MONOLITH_PIPELINE_DEFAULTS })}
          >
            Reset
          </button>
          <button
            type="button"
            className="monolith-panel-btn"
            onClick={() => {
              const next = `${window.location.pathname}${tuningToSearch(tuning)}`;
              window.history.replaceState(null, "", next);
              void navigator.clipboard?.writeText(window.location.href);
            }}
          >
            Lien
          </button>
        </div>
      </div>
      <div className="monolith-panel-body">
        <section className="monolith-panel-section">
          <h3>Vue</h3>
          <div className="monolith-stamp-slots">
            {VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                className={
                  tuning.debugView === view.id
                    ? "monolith-stamp-slot active"
                    : "monolith-stamp-slot"
                }
                onClick={() => patch({ debugView: view.id })}
              >
                {view.label}
              </button>
            ))}
          </div>
          <div className="monolith-stamp-slots">
            <button type="button" className="monolith-stamp-slot" onClick={() => onCamera("near")}>
              Near 6
            </button>
            <button type="button" className="monolith-stamp-slot" onClick={() => onCamera("design")}>
              Design 14
            </button>
            <button type="button" className="monolith-stamp-slot" onClick={() => onCamera("far")}>
              Far 55
            </button>
          </div>
        </section>

        <section className="monolith-panel-section">
          <h3>Exposition</h3>
          <Slider
            label="Exposure"
            min={0.2}
            max={1.8}
            step={0.01}
            value={tuning.exposure}
            onChange={(exposure) => patch({ exposure })}
          />
          <label className="monolith-toggle">
            <input
              type="checkbox"
              checked={tuning.adaptationEnabled}
              onChange={(event) => patch({ adaptationEnabled: event.target.checked })}
            />
            Auto-exposition (fragile)
          </label>
        </section>

        <section className="monolith-panel-section">
          <h3>Bloom</h3>
          <Slider
            label="Intensité"
            min={0}
            max={1.5}
            step={0.01}
            value={tuning.bloomIntensity}
            onChange={(bloomIntensity) => patch({ bloomIntensity })}
          />
          <Slider
            label="Seuil HDR"
            min={0}
            max={2}
            step={0.01}
            value={tuning.bloomThreshold}
            onChange={(bloomThreshold) => patch({ bloomThreshold })}
          />
          <Slider
            label="Lissage"
            min={0}
            max={0.5}
            step={0.01}
            value={tuning.bloomSmoothing}
            onChange={(bloomSmoothing) => patch({ bloomSmoothing })}
          />
        </section>

        <section className="monolith-panel-section">
          <h3>Halo</h3>
          <p className="monolith-panel-hint">
            Cœur du portail, sprite à la base, colonne et faisceau au-dessus. Même principe que le monolithe cosmique.
          </p>
          <Slider
            label="Intensité"
            min={0.4}
            max={2}
            step={0.05}
            value={tuning.glowIntensity}
            onChange={(glowIntensity) => patch({ glowIntensity })}
          />
        </section>
      </div>
    </aside>
  );
}

import { useR3fSceneConfig } from "../config/r3fSceneConfigContext";

function RangeControl({
  id,
  label,
  min,
  max,
  step,
  value,
  format,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label htmlFor={id}>
      <span>
        {label}
        <output htmlFor={id}>{format(value)}</output>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function GodraysHallControls() {
  const { config, setConfig, resetConfig } = useR3fSceneConfig();

  return (
    <div className="godrays-hall-controls">
      <label className="godrays-hall-check" htmlFor="edit-mode">
        <input
          id="edit-mode"
          type="checkbox"
          checked={config.sceneEditMode}
          onChange={(e) => setConfig({ sceneEditMode: e.target.checked })}
        />
        Éditer blocs (glisser sur le sol)
      </label>

      <RangeControl
        id="mono-x"
        label="Blocs position X"
        min={-40}
        max={40}
        step={0.5}
        value={config.monolithCenterX}
        format={(v) => v.toFixed(1)}
        onChange={(v) => setConfig({ monolithCenterX: v })}
      />
      <RangeControl
        id="mono-z"
        label="Blocs position Z"
        min={-50}
        max={30}
        step={0.5}
        value={config.monolithCenterZ}
        format={(v) => v.toFixed(1)}
        onChange={(v) => setConfig({ monolithCenterZ: v })}
      />
      <RangeControl
        id="gap"
        label="Largeur fente"
        min={0.3}
        max={3}
        step={0.05}
        value={config.gapWidth}
        format={(v) => v.toFixed(2)}
        onChange={(v) => setConfig({ gapWidth: v })}
      />
      <RangeControl
        id="emit-int"
        label="Émission fente"
        min={0}
        max={20}
        step={0.25}
        value={config.slitEmitterIntensity}
        format={(v) => v.toFixed(2)}
        onChange={(v) => setConfig({ slitEmitterIntensity: v })}
      />
      <RangeControl
        id="gutter-depth"
        label="Profondeur gouttière"
        min={1}
        max={4}
        step={0.05}
        value={config.gutterDepth}
        format={(v) => v.toFixed(2)}
        onChange={(v) => setConfig({ gutterDepth: v })}
      />
      <RangeControl
        id="pt-int"
        label="Point fente (godrays)"
        min={0}
        max={350}
        step={5}
        value={config.emitLightIntensity}
        format={(v) => String(v)}
        onChange={(v) => setConfig({ emitLightIntensity: v })}
      />
      <RangeControl
        id="pt-dist"
        label="Portée point (vers +Z)"
        min={8}
        max={90}
        step={2}
        value={config.emitLightDistance}
        format={(v) => String(v)}
        onChange={(v) => setConfig({ emitLightDistance: v })}
      />

      <RangeControl
        id="density"
        label="Densité godrays"
        min={0.002}
        max={0.03}
        step={0.001}
        value={config.godraysDensity}
        format={(v) => v.toFixed(3)}
        onChange={(v) => setConfig({ godraysDensity: v })}
      />
      <RangeControl
        id="maxd"
        label="Densité max"
        min={0.1}
        max={1}
        step={0.05}
        value={config.godraysMaxDensity}
        format={(v) => v.toFixed(2)}
        onChange={(v) => setConfig({ godraysMaxDensity: v })}
      />
      <RangeControl
        id="steps"
        label="Pas raymarch"
        min={20}
        max={120}
        step={10}
        value={config.godraysRaymarchSteps}
        format={(v) => String(v)}
        onChange={(v) => setConfig({ godraysRaymarchSteps: v })}
      />

      <p className="godrays-hall-section">Post (slice C)</p>
      <RangeControl
        id="bloom-str"
        label="Bloom force"
        min={0}
        max={1.2}
        step={0.02}
        value={config.bloomStrength}
        format={(v) => v.toFixed(2)}
        onChange={(v) => setConfig({ bloomStrength: v })}
      />
      <RangeControl
        id="bloom-rad"
        label="Bloom rayon"
        min={0.2}
        max={1.5}
        step={0.05}
        value={config.bloomRadius}
        format={(v) => v.toFixed(2)}
        onChange={(v) => setConfig({ bloomRadius: v })}
      />
      <RangeControl
        id="bloom-thr"
        label="Bloom seuil"
        min={0.5}
        max={1}
        step={0.01}
        value={config.bloomThreshold}
        format={(v) => v.toFixed(2)}
        onChange={(v) => setConfig({ bloomThreshold: v })}
      />
      <RangeControl
        id="n8ao-int"
        label="N8AO intensité"
        min={0}
        max={8}
        step={0.2}
        value={config.n8aoIntensity}
        format={(v) => v.toFixed(1)}
        onChange={(v) => setConfig({ n8aoIntensity: v })}
      />
      <RangeControl
        id="n8ao-rad"
        label="N8AO rayon"
        min={1}
        max={12}
        step={0.25}
        value={config.n8aoRadius}
        format={(v) => v.toFixed(2)}
        onChange={(v) => setConfig({ n8aoRadius: v })}
      />
      <RangeControl
        id="env-int"
        label="IBL Environment"
        min={0}
        max={1}
        step={0.02}
        value={config.environmentIntensity}
        format={(v) => v.toFixed(2)}
        onChange={(v) => setConfig({ environmentIntensity: v })}
      />

      <button type="button" className="godrays-hall-reset" onClick={resetConfig}>
        Reset scène
      </button>
    </div>
  );
}

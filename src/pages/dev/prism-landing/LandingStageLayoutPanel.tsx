import { useCallback, useState } from "react";
import {
  LANDING_STAGE_ITEM_LABELS,
  LANDING_STAGE_LINK_LABELS,
  serializeLandingStageLayout,
  type LandingStageItemId,
  type LandingStageLayout,
} from "./landingStageLayout";

type LandingStageLayoutPanelProps = {
  layout: LandingStageLayout;
  worldPositions: Record<LandingStageItemId, [number, number, number]>;
  scrollProgress?: number;
  onRegenerateScroll?: () => void;
  onLinkChange: (link: LandingStageLayout["link"]) => void;
  onItemPatch: (
    id: LandingStageItemId,
    patch: Partial<LandingStageLayout["items"]["shield"]>,
  ) => void;
  onClusterPatch: (
    patch: Partial<LandingStageLayout["cluster"]>,
  ) => void;
  onReset: () => void;
};

const ITEM_IDS: LandingStageItemId[] = ["shield", "ring", "aegis"];
const AXES = ["x", "y", "z"] as const;

const SCALE_SLIDER_MIN = 0.05;
const SCALE_SLIDER_MAX = 12;
const SCALE_INPUT_MIN = 0.05;
const SCALE_INPUT_MAX = 30;

function clampScale(value: number) {
  if (!Number.isFinite(value)) return SCALE_SLIDER_MIN;
  return Math.min(SCALE_INPUT_MAX, Math.max(SCALE_INPUT_MIN, value));
}

function ScaleControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (scale: number) => void;
}) {
  const sliderValue = Math.min(SCALE_SLIDER_MAX, Math.max(SCALE_SLIDER_MIN, value));

  return (
    <div className="prism-stage-scale">
      <label className="prism-stage-field">
        <span>
          Échelle
          <em>{value.toFixed(3)}</em>
        </span>
        <input
          type="range"
          min={SCALE_SLIDER_MIN}
          max={SCALE_SLIDER_MAX}
          step={0.01}
          value={sliderValue}
          onChange={(e) => onChange(clampScale(Number.parseFloat(e.target.value)))}
        />
      </label>
      <label className="prism-stage-field prism-stage-scale-num">
        <span>Valeur</span>
        <input
          type="number"
          min={SCALE_INPUT_MIN}
          max={SCALE_INPUT_MAX}
          step={0.01}
          value={value}
          onChange={(e) => onChange(clampScale(Number.parseFloat(e.target.value)))}
        />
      </label>
    </div>
  );
}

function format3([x, y, z]: [number, number, number]) {
  return `${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}`;
}

function AxisSliders({
  label,
  values,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  values: [number, number, number];
  min: number;
  max: number;
  step: number;
  onChange: (axis: 0 | 1 | 2, value: number) => void;
}) {
  return (
    <div className="prism-stage-fieldset">
      <div className="prism-stage-fieldset-title">{label}</div>
      {AXES.map((axis, i) => (
        <label key={axis} className="prism-stage-field">
          <span>
            {axis.toUpperCase()}
            <em>{values[i].toFixed(3)}</em>
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={values[i]}
            onChange={(e) => onChange(i as 0 | 1 | 2, Number.parseFloat(e.target.value))}
          />
        </label>
      ))}
    </div>
  );
}

export function LandingStageLayoutPanel({
  layout,
  worldPositions,
  onLinkChange,
  onItemPatch,
  onClusterPatch,
  onReset,
  scrollProgress = 0,
  onRegenerateScroll,
}: LandingStageLayoutPanelProps) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyJson = useCallback(async () => {
    const text = serializeLandingStageLayout(layout);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  }, [layout]);

  return (
    <aside className="prism-stage-panel" aria-label="Mise en scène 3D landing">
      <header className="prism-stage-panel-head">
        <span>Stage 3D — scroll</span>
        <div className="prism-stage-panel-actions">
          <button type="button" onClick={onReset}>Reset</button>
          <button type="button" onClick={() => setOpen((v) => !v)}>
            {open ? "Réduire" : "Ouvrir"}
          </button>
        </div>
      </header>
      {open ? (
        <div className="prism-stage-panel-body">
          <p className="prism-stage-scroll-hint">
            Scroll page :{" "}
            <em>{(scrollProgress * 100).toFixed(0)}%</em>
            {scrollProgress > 0.001
              ? " — interpolation poses aléatoires"
              : " — pose du panneau (état 0)"}
          </p>
          {onRegenerateScroll ? (
            <button
              type="button"
              className="prism-stage-copy prism-stage-regen"
              onClick={onRegenerateScroll}
            >
              Nouvelles poses scroll
            </button>
          ) : null}
          <label className="prism-stage-field prism-stage-select">
            <span>Liaison</span>
            <select
              value={layout.link}
              onChange={(e) =>
                onLinkChange(e.target.value as LandingStageLayout["link"])
              }
            >
              {(Object.keys(LANDING_STAGE_LINK_LABELS) as LandingStageLayout["link"][]).map(
                (key) => (
                  <option key={key} value={key}>
                    {LANDING_STAGE_LINK_LABELS[key]}
                  </option>
                ),
              )}
            </select>
          </label>

          {layout.link === "all" ? (
            <>
              <AxisSliders
                label="Cluster (position)"
                values={layout.cluster.position}
                min={-8}
                max={8}
                step={0.01}
                onChange={(i, v) => {
                  const position = [...layout.cluster.position] as [
                    number,
                    number,
                    number,
                  ];
                  position[i] = v;
                  onClusterPatch({ position });
                }}
              />
              <ScaleControl
                value={layout.cluster.scale}
                onChange={(scale) => onClusterPatch({ scale })}
              />
            </>
          ) : null}

          {ITEM_IDS.map((id) => {
            const item = layout.items[id];
            return (
              <section key={id} className="prism-stage-item">
                <div className="prism-stage-item-head">
                  <strong>{LANDING_STAGE_ITEM_LABELS[id]}</strong>
                  <label className="prism-stage-toggle">
                    <input
                      type="checkbox"
                      checked={item.visible}
                      onChange={(e) =>
                        onItemPatch(id, { visible: e.target.checked })
                      }
                    />
                    Visible
                  </label>
                </div>
                <p className="prism-stage-world">
                  Monde : {format3(worldPositions[id])}
                </p>
                <AxisSliders
                  label="Position (locale)"
                  values={item.position}
                  min={-4}
                  max={4}
                  step={0.01}
                  onChange={(i, v) => {
                    const position = [...item.position] as [number, number, number];
                    position[i] = v;
                    onItemPatch(id, { position });
                  }}
                />
                <AxisSliders
                  label="Rotation (rad)"
                  values={item.rotation}
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.01}
                  onChange={(i, v) => {
                    const rotation = [...item.rotation] as [number, number, number];
                    rotation[i] = v;
                    onItemPatch(id, { rotation });
                  }}
                />
                <ScaleControl
                  value={item.scale}
                  onChange={(scale) => onItemPatch(id, { scale })}
                />
              </section>
            );
          })}

          <div className="prism-stage-export">
            <button type="button" className="prism-stage-copy" onClick={copyJson}>
              {copied ? "Copié" : "Copier JSON layout"}
            </button>
            <textarea
              readOnly
              rows={8}
              value={serializeLandingStageLayout(layout)}
              aria-label="Layout JSON"
            />
          </div>
        </div>
      ) : null}
    </aside>
  );
}

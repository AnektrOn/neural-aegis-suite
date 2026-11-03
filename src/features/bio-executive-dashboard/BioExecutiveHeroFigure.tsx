import { useLayoutEffect, useRef, useState } from "react";
import { Brain, Heart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import neuralSilhouette from "@/assets/aegis-neural-silhouette.png";
import type { ExocortexHeroUi } from "./bioExecutiveHeroPresentation";
import { BioExecutiveHeroColumnOverlay } from "./BioExecutiveHeroColumnOverlay";
import { BioExecutiveHeroGradualBlur } from "./BioExecutiveHeroGradualBlur";
import type { DragTarget } from "./bioExecutiveHeroLabDrag";
import {
  heroElementBoxStyle,
  heroHotspotBoxStyle,
  heroSideRailBoxStyle,
  heroRailIconSizePx,
  heroElementVisible,
  silhouetteToStyle,
  type HeroBreakpointSlice,
  type HeroElementId,
} from "./bioExecutiveHeroLabConfig";
import { heroElementPositionProps, heroTypographyProps } from "./heroLabTypography";
import type { BioExecutiveViewModel, BioNodeId } from "./types";

type BioExecutiveHeroFigureProps = {
  figureRef: React.RefObject<HTMLDivElement | null>;
  slice: HeroBreakpointSlice;
  heroLab: boolean;
  labTarget: DragTarget;
  onLabTargetSelect: (target: DragTarget) => void;
  onPointerDown: (target: DragTarget) => (event: React.PointerEvent<HTMLElement>) => void;
  calmMode: boolean;
  bioGlowVar: string;
  viewModel: BioExecutiveViewModel;
  selectedBioNode: BioNodeId;
  setSelectedBioNode: (id: BioNodeId) => void;
  selectedNode: BioExecutiveViewModel["bioNodes"][BioNodeId];
  exocortexUi?: ExocortexHeroUi | null;
};

type HeroNodeId = "nodeBrain" | "nodeHeart" | "nodeSolar";

const NODE_TO_HERO: Record<BioNodeId, HeroNodeId> = {
  brain: "nodeBrain",
  heart: "nodeHeart",
  solar: "nodeSolar",
};

function labRing(active: boolean, heroLab: boolean) {
  return heroLab && active ? "ring-1 ring-[hsl(var(--aegis-warm))] ring-offset-2 ring-offset-transparent" : "";
}

export function BioExecutiveHeroFigure({
  figureRef,
  slice,
  heroLab,
  labTarget,
  onLabTargetSelect,
  onPointerDown,
  calmMode,
  viewModel,
  selectedBioNode,
  setSelectedBioNode,
  selectedNode,
  exocortexUi = null,
}: BioExecutiveHeroFigureProps) {
  const { locale } = useLanguage();
  const isFr = locale === "fr";
  const matrixLockLabel = isFr ? "Disponible avec Matrice" : "Available with Matrix";
  const el = slice.elements;
  const metricRef = useRef<HTMLButtonElement>(null);
  const [connector, setConnector] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  const boxClass = (id: HeroElementId, extra?: string) =>
    cn(
      extra,
      !heroElementVisible(el[id], heroLab, labTarget === id) && "hidden",
      labRing(labTarget === id, heroLab),
      heroLab && "cursor-grab active:cursor-grabbing touch-none",
    );

  const boxProps = (id: HeroElementId) => heroElementPositionProps(el[id]);

  useLayoutEffect(() => {
    const figure = figureRef.current;
    if (!figure) return;

    const measure = () => {
      const node = figure.querySelector<HTMLElement>(`[data-bio-node="${selectedBioNode}"]`);
      const metric = metricRef.current;
      if (!node || !metric) {
        setConnector(null);
        return;
      }
      const f = figure.getBoundingClientRect();
      const n = node.getBoundingClientRect();
      const m = metric.getBoundingClientRect();
      setConnector({
        x1: n.left + n.width / 2 - f.left,
        y1: n.top + n.height / 2 - f.top,
        x2: m.left + m.width / 2 - f.left,
        y2: m.top - f.top,
      });
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(figure);
    return () => ro.disconnect();
  }, [figureRef, selectedBioNode, slice]);

  const activeExocortexNode = exocortexUi?.nodes[selectedBioNode];
  const displayNode = activeExocortexNode ?? {
    label: selectedNode.title,
    metric: selectedNode.metric,
    unit: selectedNode.unit,
    statusChip: selectedNode.status,
    detailLines: [selectedNode.desc],
    desc: selectedNode.desc,
    locked: false,
  };

  const nodeBtn = (id: HeroNodeId, nodeId: BioNodeId, fallbackTitle: string) => {
    const node = viewModel.bioNodes[nodeId];
    const exo = exocortexUi?.nodes[nodeId];
    const title = exo?.label ?? fallbackTitle;
    const active = selectedBioNode === nodeId;
    const value =
      exo && exo.metric ? `${exo.metric}${exo.unit}` : exo ? "" : `${node.metric}${node.unit}`;
    const tip = value ? `${title} · ${value}` : title;
    const statusForAria = exo?.statusChip ?? exo?.desc ?? node.status;
    return (
      <button
        type="button"
        data-bio-node={nodeId}
        onClick={() => {
          onLabTargetSelect(id);
          setSelectedBioNode(nodeId);
        }}
        style={{ ...heroElementBoxStyle(el[id]), ...heroHotspotBoxStyle(el[id]) }}
        onPointerDown={onPointerDown(id)}
        className={cn(
          "aegis-bio-exec-lab__hotspot touch-none",
          labRing(labTarget === id, heroLab),
          heroLab && "cursor-grab active:cursor-grabbing",
          active && "aegis-bio-exec-lab__hotspot--active",
          exo?.locked && "aegis-bio-exec-lab__hotspot--locked",
        )}
        aria-label={`${title}${value ? `, ${value}` : ""}${statusForAria ? `, ${statusForAria}` : ""}`}
        aria-pressed={active}
      >
        <span className="aegis-bio-exec-lab__hotspot-tip">{tip}</span>
        <span
          className={cn(
            "aegis-bio-exec-lab__hotspot-core mx-auto block rounded-full",
            !calmMode && active && "aegis-bio-exec-lab__hotspot-core--ping animate-ping",
          )}
        />
        <span className="aegis-bio-exec-lab__hotspot-dot absolute rounded-full" />
      </button>
    );
  };

  return (
    <div ref={figureRef} className="aegis-bio-exec-lab__hero-figure relative select-none">
      {!calmMode ? (
        <div
          className="aegis-bio-exec-lab__hero-glow"
          style={{
            ["--bio-hero-glow-color" as string]:
              selectedBioNode === "brain"
                ? "var(--bio-node-brain)"
                : selectedBioNode === "heart"
                  ? "var(--bio-node-heart)"
                  : "var(--bio-node-solar)",
          }}
        />
      ) : null}

      <img
        src={neuralSilhouette}
        alt=""
        style={silhouetteToStyle(slice.silhouette)}
        onClick={() => onLabTargetSelect("silhouette")}
        onPointerDown={onPointerDown("silhouette")}
        className={cn(
          "aegis-bio-exec-lab__hero-silhouette z-[1]",
          heroLab && "aegis-bio-exec-lab__hero-silhouette--lab touch-none cursor-grab active:cursor-grabbing",
          labRing(labTarget === "silhouette", heroLab),
        )}
        loading="lazy"
        decoding="async"
      />

      <BioExecutiveHeroColumnOverlay
        visible={
          slice.overlay.columnFullWidth &&
          (slice.overlay.enabled || (heroLab && labTarget === "overlay"))
        }
        overlay={slice.overlay}
        heroLab={heroLab}
        labTarget={labTarget}
        onLabTargetSelect={onLabTargetSelect}
        onPointerDown={onPointerDown}
      />
      {!slice.overlay.columnFullWidth &&
      (slice.overlay.enabled || (heroLab && labTarget === "overlay")) ? (
        <BioExecutiveHeroGradualBlur
          overlay={slice.overlay}
          overlayHost="figure"
          heroLab={heroLab}
          selected={labTarget === "overlay"}
          onSelect={() => onLabTargetSelect("overlay")}
          onPointerDown={onPointerDown("overlay")}
        />
      ) : null}

      {connector ? (
        <svg className="aegis-bio-exec-lab__hotspot-connector" aria-hidden>
          <line x1={connector.x1} y1={connector.y1} x2={connector.x2} y2={connector.y2} />
        </svg>
      ) : null}

      {nodeBtn("nodeBrain", "brain", "Cognition")}
      {nodeBtn("nodeHeart", "heart", "Cohérence")}
      {nodeBtn("nodeSolar", "solar", "Énergie")}

      <div
        style={{ ...heroElementBoxStyle(el.sideRail), ...heroSideRailBoxStyle(el.sideRail) }}
        onPointerDown={onPointerDown("sideRail")}
        onClick={() => onLabTargetSelect("sideRail")}
        role="toolbar"
        aria-label="Sélection de métrique"
        className={cn(
          "aegis-bio-exec-lab__side-rail flex flex-col gap-1 p-1 rounded-xl border border-[color:var(--bio-frame-border)] bg-[color:var(--bio-frame)]/80 backdrop-blur-md shadow-sm",
          boxClass("sideRail"),
        )}
      >
        {(
          [
            ["brain", "Cognition", Brain],
            ["heart", "Cohérence", Heart],
            ["solar", "Énergie", UserRound],
          ] as const
        ).map(([id, label, Icon]) => {
          const railLabel = exocortexUi?.nodes[id]?.label ?? label;
          const iconSize = heroRailIconSizePx(el.sideRail);
          return (
          <button
            key={id}
            type="button"
            data-label={railLabel}
            aria-label={railLabel}
            aria-pressed={selectedBioNode === id}
            onClick={() => setSelectedBioNode(id)}
            className={cn(
              "aegis-bio-exec-lab__rail-btn",
              selectedBioNode === id ? "aegis-bio-exec-lab__chip-active" : "hover:opacity-100",
            )}
          >
            <Icon size={iconSize} aria-hidden />
          </button>
          );
        })}
      </div>

      {!exocortexUi ? (
      <button
        type="button"
        onClick={() => onLabTargetSelect("sleepStats")}
        onPointerDown={onPointerDown("sleepStats")}
        {...boxProps("sleepStats")}
        className={cn("aegis-bio-exec-lab__sleep-stats aegis-bio-exec-lab__hero-metric cursor-pointer group z-20 text-left", boxClass("sleepStats"))}
      >
        <div className="flex items-baseline gap-1">
          {el.sleepStats.typography.fontSizePx >= 8 ? (
            <span className="aegis-bio-exec-lab__hero-metric-value" {...heroTypographyProps(el.sleepStats.typography)}>
              {viewModel.sleepHoursLabel}
            </span>
          ) : (
            <span className="aegis-bio-exec-lab__hero-metric-value">{viewModel.sleepHoursLabel}</span>
          )}
        </div>
        <p className="aegis-bio-exec-lab__hero-metric-label">{viewModel.sleepStatusLabel}</p>
        <span className="aegis-bio-exec-lab__hero-metric-chip aegis-bio-exec-lab__accent-text font-medium">Réparateur</span>
      </button>
      ) : null}

      <div
        onClick={() => onLabTargetSelect("metricCallout")}
        onPointerDown={onPointerDown("metricCallout")}
        {...boxProps("metricCallout")}
        className={cn("relative z-20 aegis-bio-exec-lab__hero-metric flex flex-col items-end", boxClass("metricCallout"))}
      >
        <button
          ref={metricRef}
          type="button"
          data-bio-metric={NODE_TO_HERO[selectedBioNode]}
          className={cn(
            "cursor-pointer w-full text-right items-end",
            displayNode.locked && "blur-[6px] saturate-50 pointer-events-none select-none",
          )}
        >
          {displayNode.metric ? (
            el.metricCallout.typography.fontSizePx >= 8 ? (
              <div className="aegis-bio-exec-lab__hero-metric-value" {...heroTypographyProps(el.metricCallout.typography)}>
                {displayNode.metric}
                {displayNode.unit ? (
                  <span className="aegis-bio-exec-lab__type-label ml-0.5 opacity-50">{displayNode.unit}</span>
                ) : null}
              </div>
            ) : (
              <div className="aegis-bio-exec-lab__hero-metric-value">
                {displayNode.metric}
                {displayNode.unit ? (
                  <span className="aegis-bio-exec-lab__type-label ml-0.5 opacity-50">{displayNode.unit}</span>
                ) : null}
              </div>
            )
          ) : null}
          <p className="aegis-bio-exec-lab__hero-metric-label">{displayNode.label}</p>
          {displayNode.statusChip ? (
            <span className="aegis-bio-exec-lab__hero-metric-chip">{displayNode.statusChip}</span>
          ) : null}
          {displayNode.detailLines.length > 0 ? (
            <span className="aegis-bio-exec-lab__type-label block mt-1 opacity-70 max-w-[14rem] ml-auto">
              {displayNode.detailLines.join(" · ")}
            </span>
          ) : null}
        </button>
        {displayNode.locked ? (
          <p className="absolute inset-0 flex items-center justify-center text-center px-2 text-[11px] font-medium aegis-bio-exec-lab__accent-text pointer-events-none">
            {matrixLockLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}

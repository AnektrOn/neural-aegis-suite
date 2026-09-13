import {
  accentForSceneIndex,
  toolboxNebulaScenePillClass,
  toolboxNebulaScenePillStyle,
} from "./toolboxNebulaOverlayClasses";

export interface ToolboxNebulaScenePillItem {
  id: string;
  label: string;
}

export function ToolboxNebulaScenePills({
  scenes,
  activeIndex,
}: {
  scenes: ToolboxNebulaScenePillItem[];
  activeIndex: number;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {scenes.map((scene, index) => {
        const accent = accentForSceneIndex(index);
        const active = index === activeIndex;
        const done = index < activeIndex;
        return (
          <span
            key={scene.id}
            className={toolboxNebulaScenePillClass(active, done, accent)}
            style={toolboxNebulaScenePillStyle(active, accent)}
          >
            {scene.label}
          </span>
        );
      })}
    </div>
  );
}

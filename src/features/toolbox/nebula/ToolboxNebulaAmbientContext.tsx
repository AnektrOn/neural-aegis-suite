import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { QuantumNebulaFigure, QuantumNebulaState } from "@/components/ui/quantum-nebula";
import type { ToolboxRenderableItem } from "@/lib/toolbox-renderer-registry";
import type { ToolboxNebulaPreset } from "./toolboxNebulaPresets";
import {
  resolveToolboxNebulaPresetForItem,
  shouldEnableToolboxNebula,
} from "./resolveToolboxNebulaPreset";

export interface ToolboxNebulaAmbientApi {
  enabled: boolean;
  preset: ToolboxNebulaPreset;
  state: QuantumNebulaState;
  figure?: QuantumNebulaFigure;
  setState: (state: QuantumNebulaState) => void;
  setFigure: (figure: QuantumNebulaFigure | undefined) => void;
}

const ToolboxNebulaAmbientContext = createContext<ToolboxNebulaAmbientApi | null>(null);

export function useToolboxNebulaAmbientOptional(): ToolboxNebulaAmbientApi | null {
  return useContext(ToolboxNebulaAmbientContext);
}

export function ToolboxNebulaAmbientProvider({
  item,
  enabled,
  children,
}: {
  item: ToolboxRenderableItem;
  enabled: boolean;
  children: ReactNode;
}) {
  const preset = useMemo(() => resolveToolboxNebulaPresetForItem(item), [item]);
  const [state, setState] = useState<QuantumNebulaState>(preset.state);
  const [figure, setFigure] = useState<QuantumNebulaFigure | undefined>(preset.figure);

  useEffect(() => {
    setState(preset.state);
    setFigure(preset.figure);
  }, [item.id, item.content_type, preset.state, preset.figure]);

  const value = useMemo<ToolboxNebulaAmbientApi>(
    () => ({
      enabled,
      preset,
      state,
      figure,
      setState,
      setFigure,
    }),
    [enabled, preset, state, figure],
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <ToolboxNebulaAmbientContext.Provider value={value}>
      {children}
    </ToolboxNebulaAmbientContext.Provider>
  );
}

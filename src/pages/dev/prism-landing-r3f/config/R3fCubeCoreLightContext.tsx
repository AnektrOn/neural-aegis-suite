import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type * as THREE from "three";

type CubeCoreLightStore = {
  getGodrayLights: () => readonly THREE.PointLight[];
  registerCubeCoreGodrayLights: (lights: readonly THREE.PointLight[]) => void;
  subscribe: (listener: () => void) => () => void;
};

const CubeCoreLightContext = createContext<CubeCoreLightStore | null>(null);

export function R3fCubeCoreLightProvider({ children }: { children: ReactNode }) {
  const lightsRef = useRef<readonly THREE.PointLight[]>([]);
  const listenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getGodrayLights = useCallback(() => lightsRef.current, []);

  const registerCubeCoreGodrayLights = useCallback((lights: readonly THREE.PointLight[]) => {
    lightsRef.current = lights;
    listenersRef.current.forEach((listener) => listener());
  }, []);

  const value: CubeCoreLightStore = { getGodrayLights, registerCubeCoreGodrayLights, subscribe };

  return <CubeCoreLightContext.Provider value={value}>{children}</CubeCoreLightContext.Provider>;
}

function useCubeCoreLightStore(): CubeCoreLightStore {
  const ctx = useContext(CubeCoreLightContext);
  if (!ctx) {
    throw new Error("useCubeCoreGodrayLights requires R3fCubeCoreLightProvider");
  }
  return ctx;
}

export function useCubeCoreGodrayLights(): readonly THREE.PointLight[] {
  const { getGodrayLights, subscribe } = useCubeCoreLightStore();
  return useSyncExternalStore(subscribe, getGodrayLights, () => []);
}

/** Premier faisceau d’interstice (compat) — préférer `useCubeCoreGodrayLights`. */
export function useCubeCorePointLight(): THREE.PointLight | null {
  const lights = useCubeCoreGodrayLights();
  return lights.find((l) => l.intensity > 0.001) ?? lights[0] ?? null;
}

export function useRegisterCubeCoreGodrayLights() {
  return useCubeCoreLightStore().registerCubeCoreGodrayLights;
}

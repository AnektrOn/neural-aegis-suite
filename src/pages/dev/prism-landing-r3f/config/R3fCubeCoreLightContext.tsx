import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type * as THREE from "three";
import type { ShatteredCubePhase } from "../scene/shatteredCube/r3fCubeCoreLighting";

export type CubeCoreLightingRuntime = {
  phase: ShatteredCubePhase;
  escapeGain: number;
  godrayReveal: number;
};

const DEFAULT_RUNTIME: CubeCoreLightingRuntime = {
  phase: "hold",
  escapeGain: 0,
  godrayReveal: 0,
};

type CubeCoreLightStore = {
  getGodrayLights: () => readonly THREE.PointLight[];
  registerCubeCoreGodrayLights: (lights: readonly THREE.PointLight[]) => void;
  getRuntime: () => CubeCoreLightingRuntime;
  setRuntime: (patch: Partial<CubeCoreLightingRuntime>) => void;
  subscribe: (listener: () => void) => () => void;
};

const CubeCoreLightContext = createContext<CubeCoreLightStore | null>(null);

export function R3fCubeCoreLightProvider({ children }: { children: ReactNode }) {
  const lightsRef = useRef<readonly THREE.PointLight[]>([]);
  const runtimeRef = useRef<CubeCoreLightingRuntime>({ ...DEFAULT_RUNTIME });
  const listenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const notify = useCallback(() => {
    listenersRef.current.forEach((listener) => listener());
  }, []);

  const getGodrayLights = useCallback(() => lightsRef.current, []);

  const registerCubeCoreGodrayLights = useCallback(
    (lights: readonly THREE.PointLight[]) => {
      lightsRef.current = lights;
      notify();
    },
    [notify],
  );

  const getRuntime = useCallback(() => runtimeRef.current, []);

  const setRuntime = useCallback(
    (patch: Partial<CubeCoreLightingRuntime>) => {
      const prev = runtimeRef.current;
      const next = { ...prev, ...patch };
      if (
        next.phase === prev.phase &&
        next.escapeGain === prev.escapeGain &&
        next.godrayReveal === prev.godrayReveal
      ) {
        return;
      }
      runtimeRef.current = next;
      notify();
    },
    [notify],
  );

  const value: CubeCoreLightStore = {
    getGodrayLights,
    registerCubeCoreGodrayLights,
    getRuntime,
    setRuntime,
    subscribe,
  };

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

export function useCubeCoreLightingRuntime(): CubeCoreLightingRuntime {
  const { getRuntime, subscribe } = useCubeCoreLightStore();
  return useSyncExternalStore(subscribe, getRuntime, () => DEFAULT_RUNTIME);
}

export function useRegisterCubeCoreGodrayLights() {
  return useCubeCoreLightStore().registerCubeCoreGodrayLights;
}

export function useSetCubeCoreLightingRuntime() {
  return useCubeCoreLightStore().setRuntime;
}

/** Lecture synchrone dans `useFrame` (post) sans re-render React. */
export function useGetCubeCoreLightingRuntime() {
  return useCubeCoreLightStore().getRuntime;
}

/** @deprecated Utiliser `useCubeCoreGodrayLights`. */
export function useCubeCorePointLight(): THREE.PointLight | null {
  const lights = useCubeCoreGodrayLights();
  return lights[0] ?? null;
}

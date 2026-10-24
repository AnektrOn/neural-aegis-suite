import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type * as THREE from "three";

type GutterLightStore = {
  getLight: () => THREE.PointLight | null;
  registerGutterLight: (light: THREE.PointLight | null) => void;
  subscribe: (listener: () => void) => () => void;
};

const GutterLightContext = createContext<GutterLightStore | null>(null);

export function R3fGutterLightProvider({ children }: { children: ReactNode }) {
  const lightRef = useRef<THREE.PointLight | null>(null);
  const listenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getLight = useCallback(() => lightRef.current, []);

  const registerGutterLight = useCallback((light: THREE.PointLight | null) => {
    lightRef.current = light;
    listenersRef.current.forEach((listener) => listener());
  }, []);

  const value: GutterLightStore = { getLight, registerGutterLight, subscribe };

  return <GutterLightContext.Provider value={value}>{children}</GutterLightContext.Provider>;
}

function useGutterLightStore(): GutterLightStore {
  const ctx = useContext(GutterLightContext);
  if (!ctx) {
    throw new Error("useGutterPointLight requires R3fGutterLightProvider");
  }
  return ctx;
}

/** PointLight fente — lit la ref courante (re-render quand la lumière s’enregistre). */
export function useGutterPointLight(): THREE.PointLight | null {
  const { getLight, subscribe } = useGutterLightStore();
  return useSyncExternalStore(subscribe, getLight, () => null);
}

export function useRegisterGutterLight() {
  return useGutterLightStore().registerGutterLight;
}

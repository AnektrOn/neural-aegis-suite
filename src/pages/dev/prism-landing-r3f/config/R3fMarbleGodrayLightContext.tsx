import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type * as THREE from "three";

type MarbleLightStore = {
  getLight: () => THREE.PointLight | null;
  registerMarbleGodrayLight: (light: THREE.PointLight | null) => void;
  subscribe: (listener: () => void) => () => void;
};

const MarbleGodrayLightContext = createContext<MarbleLightStore | null>(null);

export function R3fMarbleGodrayLightProvider({ children }: { children: ReactNode }) {
  const lightRef = useRef<THREE.PointLight | null>(null);
  const listenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getLight = useCallback(() => lightRef.current, []);

  const registerMarbleGodrayLight = useCallback((light: THREE.PointLight | null) => {
    lightRef.current = light;
    listenersRef.current.forEach((listener) => listener());
  }, []);

  const value: MarbleLightStore = { getLight, registerMarbleGodrayLight, subscribe };

  return (
    <MarbleGodrayLightContext.Provider value={value}>{children}</MarbleGodrayLightContext.Provider>
  );
}

function useMarbleLightStore(): MarbleLightStore {
  const ctx = useContext(MarbleGodrayLightContext);
  if (!ctx) {
    throw new Error("useMarbleGodrayLight requires R3fMarbleGodrayLightProvider");
  }
  return ctx;
}

export function useMarbleGodrayLight(): THREE.PointLight | null {
  const { getLight, subscribe } = useMarbleLightStore();
  return useSyncExternalStore(subscribe, getLight, () => null);
}

export function useRegisterMarbleGodrayLight() {
  return useMarbleLightStore().registerMarbleGodrayLight;
}

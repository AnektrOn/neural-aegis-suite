import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { R3F_SCENE_CONFIG_DEFAULTS, type R3fSceneConfig } from "./r3fSceneConfig";

type R3fSceneConfigContextValue = {
  config: R3fSceneConfig;
  configRef: MutableRefObject<R3fSceneConfig>;
  setConfig: (patch: Partial<R3fSceneConfig>) => void;
  resetConfig: () => void;
};

const R3fSceneConfigContext = createContext<R3fSceneConfigContextValue | null>(null);

function mergeSceneConfig(overrides?: Partial<R3fSceneConfig>): R3fSceneConfig {
  return { ...R3F_SCENE_CONFIG_DEFAULTS, ...overrides };
}

export function R3fSceneConfigProvider({
  children,
  initialOverrides,
}: {
  children: React.ReactNode;
  initialOverrides?: Partial<R3fSceneConfig>;
}) {
  const baselineRef = useRef(mergeSceneConfig(initialOverrides));
  const [config, setConfigState] = useState<R3fSceneConfig>(baselineRef.current);
  const configRef = useRef(config);
  configRef.current = config;

  const setConfig = useCallback((patch: Partial<R3fSceneConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...patch };
      configRef.current = next;
      return next;
    });
  }, []);

  const resetConfig = useCallback(() => {
    const next = { ...baselineRef.current };
    configRef.current = next;
    setConfigState(next);
  }, []);

  const value = useMemo(
    () => ({ config, configRef, setConfig, resetConfig }),
    [config, setConfig, resetConfig],
  );

  return (
    <R3fSceneConfigContext.Provider value={value}>{children}</R3fSceneConfigContext.Provider>
  );
}

export function useR3fSceneConfig() {
  const ctx = useContext(R3fSceneConfigContext);
  if (!ctx) throw new Error("useR3fSceneConfig outside R3fSceneConfigProvider");
  return ctx;
}

/** Dérive une valeur du contexte ; stabilise la référence via deps explicites côté appelant. */
export function useR3fSceneConfigSelector<T>(
  selector: (ctx: R3fSceneConfigContextValue) => T,
  deps: readonly unknown[] = [],
): T {
  const ctx = useR3fSceneConfig();
  return useMemo(() => selector(ctx), [ctx, selector, ...deps]);
}

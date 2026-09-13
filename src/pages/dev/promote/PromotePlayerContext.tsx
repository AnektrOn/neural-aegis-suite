import { createContext, useContext, type ReactNode } from "react";

export type PromotePlayerApi = {
  goTo: (slug: string) => void;
  next: () => void;
  prev: () => void;
  filmMode: boolean;
  isFR: boolean;
  sceneSlug: string;
};

const PromotePlayerContext = createContext<PromotePlayerApi | null>(null);

export function PromotePlayerProvider({
  value,
  children,
}: {
  value: PromotePlayerApi;
  children: ReactNode;
}) {
  return <PromotePlayerContext.Provider value={value}>{children}</PromotePlayerContext.Provider>;
}

export function usePromotePlayer(): PromotePlayerApi {
  const ctx = useContext(PromotePlayerContext);
  if (!ctx) throw new Error("usePromotePlayer must be used inside PromotePage");
  return ctx;
}

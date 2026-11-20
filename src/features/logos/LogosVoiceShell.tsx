import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ToolboxExerciseSessionProvider } from "@/features/toolbox/ToolboxExerciseSessionContext";
import { LogosToolHostProvider } from "./LogosToolHostContext";

/** Wraps LOGOS voice: toolbox modal + quick log + pulse/people overlays for client tools. */
export function LogosVoiceShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <ToolboxExerciseSessionProvider
      userId={user?.id}
      resumeStoredOpen={false}
      persistOpenInSession={false}
    >
      <LogosToolHostProvider>{children}</LogosToolHostProvider>
    </ToolboxExerciseSessionProvider>
  );
}

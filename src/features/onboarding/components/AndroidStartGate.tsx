import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasFinishedStartOnboardingLocal,
  markExecutiveOnboardingDone,
} from "@/store/useOnboardingStore";
import { fetchExecutiveOnboardingRemote } from "@/services/onboardingService";

interface AndroidStartGateProps {
  children: ReactNode;
}

/**
 * On native Android builds, prevents post-login Guardian onboarding (/onboarding)
 * from launching unless the pre-login executive flow (/start) has been completed.
 */
export default function AndroidStartGate({ children }: AndroidStartGateProps) {
  const isNativeAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [status, setStatus] = useState<"checking" | "allowed" | "needs_start">(
    () => {
      if (!isNativeAndroid) return "allowed";
      if (hasFinishedStartOnboardingLocal(userId)) return "allowed";
      return "checking";
    },
  );

  useEffect(() => {
    if (!isNativeAndroid) {
      setStatus("allowed");
      return;
    }
    if (authLoading) return;

    if (hasFinishedStartOnboardingLocal(userId)) {
      setStatus("allowed");
      return;
    }

    if (!userId) {
      setStatus("needs_start");
      return;
    }

    let cancelled = false;
    setStatus("checking");

    fetchExecutiveOnboardingRemote(userId)
      .then((remote) => {
        if (cancelled) return;
        if (remote.onboardingCompleted) {
          markExecutiveOnboardingDone(userId);
          setStatus("allowed");
          return;
        }
        setStatus("needs_start");
      })
      .catch(() => {
        if (!cancelled) setStatus("needs_start");
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isNativeAndroid, userId]);

  if (!isNativeAndroid || status === "allowed") {
    return <>{children}</>;
  }

  if (status === "checking") {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center bg-[#0b0b0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a24b]/30 border-t-[#c9a24b]" />
      </div>
    );
  }

  return <Navigate to="/start" replace />;
}

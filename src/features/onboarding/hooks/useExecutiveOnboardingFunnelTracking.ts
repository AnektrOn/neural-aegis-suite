import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  markExecutiveOnboardingCompleteTracked,
  recordExecutiveOnboardingFunnel,
  shouldSkipAbandonTracking,
} from "@/lib/executiveOnboardingFunnel";
import { TOTAL_ONBOARDING_MICRO_STEPS } from "../onboardingPrimitives";

type FunnelSnapshot = {
  microStep: number;
  locale: string;
  contactEmail: string;
  fullName: string;
  occupation: string;
  isSynthesizing: boolean;
  previewScore: number | null;
  finalized: boolean;
};

function buildMetadata(snapshot: FunnelSnapshot) {
  return {
    full_name: snapshot.fullName || null,
    occupation: snapshot.occupation || null,
    synthesizing: snapshot.isSynthesizing,
    has_preview: snapshot.previewScore !== null,
  };
}

export function useExecutiveOnboardingFunnelTracking(snapshot: FunnelSnapshot) {
  const location = useLocation();
  const snapshotRef = useRef(snapshot);
  const lastStepRef = useRef(snapshot.microStep);
  const abandonSentRef = useRef(false);
  const completeSentRef = useRef(false);

  snapshotRef.current = snapshot;

  const sendAbandon = (reason: string, microStep?: number) => {
    if (abandonSentRef.current || shouldSkipAbandonTracking()) return;
    if (snapshotRef.current.finalized) return;
    const step = microStep ?? snapshotRef.current.microStep;
    if (step >= TOTAL_ONBOARDING_MICRO_STEPS && snapshotRef.current.previewScore !== null) return;

    abandonSentRef.current = true;
    void recordExecutiveOnboardingFunnel({
      eventType: "abandon",
      microStep: step,
      locale: snapshotRef.current.locale,
      contactEmail: snapshotRef.current.contactEmail,
      metadata: { ...buildMetadata(snapshotRef.current), reason },
    });
  };

  useEffect(() => {
    if (snapshot.microStep === lastStepRef.current) return;
    lastStepRef.current = snapshot.microStep;
    void recordExecutiveOnboardingFunnel({
      eventType: "step_view",
      microStep: snapshot.microStep,
      locale: snapshot.locale,
      contactEmail: snapshot.contactEmail,
      metadata: buildMetadata(snapshot),
    });
  }, [snapshot.microStep, snapshot.locale, snapshot.contactEmail, snapshot.fullName, snapshot.occupation, snapshot.isSynthesizing, snapshot.previewScore]);

  useEffect(() => {
    if (snapshot.previewScore === null || completeSentRef.current) return;
    completeSentRef.current = true;
    markExecutiveOnboardingCompleteTracked();
    void recordExecutiveOnboardingFunnel({
      eventType: "complete",
      microStep: TOTAL_ONBOARDING_MICRO_STEPS,
      locale: snapshot.locale,
      contactEmail: snapshot.contactEmail,
      metadata: buildMetadata(snapshot),
    });
  }, [snapshot.previewScore, snapshot.locale, snapshot.contactEmail, snapshot.fullName, snapshot.occupation, snapshot.isSynthesizing]);

  useEffect(() => {
    const onPageHide = () => sendAbandon("page_hide");
    const onVisibility = () => {
      if (document.visibilityState === "hidden") sendAbandon("visibility_hidden");
    };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
      if (location.pathname !== "/start") {
        sendAbandon("route_leave");
      }
    };
  }, [location.pathname]);
}
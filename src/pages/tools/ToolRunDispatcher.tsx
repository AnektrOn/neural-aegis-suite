import { lazy, Suspense } from "react";
import { Navigate, useParams } from "react-router-dom";
import { isToolId } from "@/components/tools/toolsRegistry";

const RUN_PAGES = {
  "executive-coaching-cost-calculator": lazy(
    () => import("./ExecutiveCoachingCostCalculatorPage"),
  ),
  "peer-network-roi-calculator": lazy(() => import("./PeerNetworkRoiCalculatorPage")),
  "second-brain-waste-audit": lazy(() => import("./SecondBrainWasteAuditPage")),
  "cloud-ai-privacy-risk-checker": lazy(() => import("./CloudAiPrivacyRiskCheckerPage")),
  "executive-saas-runrate-calculator": lazy(() => import("./ExecutiveSaasRunrateCalculatorPage")),
  "ceo-decision-fatigue-index": lazy(() => import("./CeoDecisionFatigueIndexPage")),
  "decision-bias-reframe-tool": lazy(() => import("./DecisionBiasReframeToolPage")),
  "cost-of-delayed-decision-calculator": lazy(() => import("./CostOfDelayedDecisionCalculatorPage")),
  "founder-prioritization-matrix": lazy(() => import("./FounderPrioritizationMatrixPage")),
  "executive-context-switching-calculator": lazy(
    () => import("./ExecutiveContextSwitchingCalculatorPage"),
  ),
} as const;

export default function ToolRunDispatcher() {
  const { toolId } = useParams<{ toolId: string }>();

  if (!toolId || !isToolId(toolId)) {
    return <Navigate to="/tools" replace />;
  }

  const Page = RUN_PAGES[toolId];

  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-aegis-gradient" aria-busy />}>
      <Page />
    </Suspense>
  );
}
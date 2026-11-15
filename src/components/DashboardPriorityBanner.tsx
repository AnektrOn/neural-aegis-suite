import type { UserMaturityProfile } from "@/lib/userMaturity";
import { PostAssessmentBanner } from "@/components/PostAssessmentBanner";
import { WelcomeExperience, SetupProgressBanner } from "@/components/WelcomeExperience";
import { DecisionAgingAlert } from "@/components/DecisionAgingAlert";

export type DashboardPriorityBannerProps = {
  maturity: UserMaturityProfile | null;
  showPostAssessment: boolean;
  showWelcome: boolean;
  showSetupBanner: boolean;
  oldestDecisionDays: number;
  onPostAssessmentClose: () => void;
  onWelcomeDismiss: () => void;
};

export function DashboardPriorityBanner({
  maturity,
  showPostAssessment,
  showWelcome,
  showSetupBanner,
  oldestDecisionDays,
  onPostAssessmentClose,
  onWelcomeDismiss,
}: DashboardPriorityBannerProps) {
  if (showPostAssessment) {
    return <PostAssessmentBanner onClose={onPostAssessmentClose} />;
  }
  if (showWelcome && maturity) {
    return <WelcomeExperience maturityProfile={maturity} onDismiss={onWelcomeDismiss} />;
  }
  if (showSetupBanner && maturity) {
    return <SetupProgressBanner maturityProfile={maturity} />;
  }
  if (oldestDecisionDays > 7) {
    return <DecisionAgingAlert days={oldestDecisionDays} />;
  }
  return null;
}
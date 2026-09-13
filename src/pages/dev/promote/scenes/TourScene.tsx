import OnboardingFlow from "@/components/OnboardingFlow";
import { usePromotePlayer } from "../PromotePlayerContext";

export function TourScene() {
  const { next } = usePromotePlayer();
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-background">
      <OnboardingFlow onComplete={next} />
    </div>
  );
}

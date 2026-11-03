import { useCallback, useMemo } from "react";
import { usePracticesHubData } from "@/features/practices-hub/hooks/usePracticesHubData";
import { PracticesHubLabPresence } from "./PracticesHubLabPresence";
import { PracticesHubLabRail } from "./PracticesHubLabRail";
import { resolvePracticesHubLabStats } from "./practicesHubLabDemoStats";
import "./practicesHubLab.css";

export default function PracticesHubLabPage() {
  const { stats, loading } = usePracticesHubData();
  const { stats: displayStats, loading: displayLoading } = useMemo(
    () => resolvePracticesHubLabStats(stats, loading),
    [stats, loading],
  );

  const onOpenPractices = useCallback(() => {
    document.getElementById("practices-lab-rail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <div className="practices-hub-lab">
        <PracticesHubLabPresence
          dailyScore={displayStats?.dailyScore ?? null}
          loading={displayLoading}
          onOpenPractices={onOpenPractices}
        />
        <PracticesHubLabRail stats={displayStats} loading={displayLoading} />
      </div>
    </div>
  );
}

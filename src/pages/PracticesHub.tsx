import { PracticesHubPresence } from "@/features/practices-hub/components/PracticesHubPresence";
import { PracticesHubTileRail } from "@/features/practices-hub/components/PracticesHubTileRail";
import { usePracticesHubData } from "@/features/practices-hub/hooks/usePracticesHubData";

export default function PracticesHub() {
  const { stats, loading, dailyScore } = usePracticesHubData();

  return (
    <div className="-mx-3 flex min-h-[calc(100dvh-var(--mobile-main-padding-top)-var(--mobile-dock-padding))] w-[calc(100%+1.5rem)] flex-col overflow-x-hidden bg-black sm:-mx-5 sm:w-[calc(100%+2.5rem)] md:mx-0 md:w-full md:min-h-[calc(100dvh-8rem)]">
      <PracticesHubPresence dailyScore={dailyScore} loading={loading} />
      <PracticesHubTileRail stats={stats} loading={loading} />
    </div>
  );
}

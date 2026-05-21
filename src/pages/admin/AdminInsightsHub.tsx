import { lazy, Suspense } from "react";
import AdminHubShell from "@/components/admin/AdminHubShell";

const AdminAnalytics = lazy(() => import("./AdminAnalytics"));
const ExecutiveDashboard = lazy(() => import("./ExecutiveDashboard"));

function HubPanelLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-warning/30 border-t-accent-warning" />
    </div>
  );
}

export default function AdminInsightsHub() {
  return (
    <AdminHubShell
      pathname="/admin/insights"
      panels={{
        analytics: (
          <Suspense fallback={<HubPanelLoader />}>
            <AdminAnalytics />
          </Suspense>
        ),
        executive: (
          <Suspense fallback={<HubPanelLoader />}>
            <ExecutiveDashboard />
          </Suspense>
        ),
      }}
    />
  );
}

import { lazy, Suspense } from "react";
import AdminHubShell from "@/components/admin/AdminHubShell";
import { AppRouteErrorBoundary } from "@/components/AppRouteErrorBoundary";

const DeepDiveSampleReport = lazy(
  () => import("@/features/archetype-deepdive-v2/pages/DeepDiveSampleReport"),
);
const AdminDeepDive = lazy(() => import("./AdminDeepDive"));
const AdminDeepDiveV2 = lazy(() => import("./AdminDeepDiveV2"));
const AdminUserReports = lazy(() => import("./AdminUserReports"));

function HubPanelLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-warning/30 border-t-accent-warning" />
    </div>
  );
}

export default function AdminDeepDiveHub() {
  return (
    <AdminHubShell
      pathname="/admin/deep-dive"
      panels={{
        report: (
          <AppRouteErrorBoundary label="admin-deep-dive-report">
            <Suspense fallback={<HubPanelLoader />}>
              <DeepDiveSampleReport />
            </Suspense>
          </AppRouteErrorBoundary>
        ),
        scores: (
          <AppRouteErrorBoundary label="admin-deep-dive-scores">
            <Suspense fallback={<HubPanelLoader />}>
              <AdminDeepDive />
            </Suspense>
          </AppRouteErrorBoundary>
        ),
        reportV2: (
          <AppRouteErrorBoundary label="admin-deep-dive-report-v2">
            <Suspense fallback={<HubPanelLoader />}>
              <AdminDeepDiveV2 />
            </Suspense>
          </AppRouteErrorBoundary>
        ),
        userReports: (
          <AppRouteErrorBoundary label="admin-deep-dive-user-reports">
            <Suspense fallback={<HubPanelLoader />}>
              <AdminUserReports />
            </Suspense>
          </AppRouteErrorBoundary>
        ),
      }}
    />
  );
}

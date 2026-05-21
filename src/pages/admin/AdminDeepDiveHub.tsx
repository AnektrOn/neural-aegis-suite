import { lazy, Suspense } from "react";
import AdminHubShell from "@/components/admin/AdminHubShell";

const DeepDiveSampleReport = lazy(
  () => import("@/features/archetype-deepdive-v2/pages/DeepDiveSampleReport"),
);
const AdminDeepDive = lazy(() => import("./AdminDeepDive"));
const AdminDeepDiveV2 = lazy(() => import("./AdminDeepDiveV2"));

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
          <Suspense fallback={<HubPanelLoader />}>
            <DeepDiveSampleReport />
          </Suspense>
        ),
        scores: (
          <Suspense fallback={<HubPanelLoader />}>
            <AdminDeepDive />
          </Suspense>
        ),
        reportV2: (
          <Suspense fallback={<HubPanelLoader />}>
            <AdminDeepDiveV2 />
          </Suspense>
        ),
      }}
    />
  );
}

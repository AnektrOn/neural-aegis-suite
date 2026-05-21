import { lazy, Suspense } from "react";
import AdminHubShell from "@/components/admin/AdminHubShell";

const AdminPlaceTags = lazy(() => import("./AdminPlaceTags"));
const AdminUserPlaces = lazy(() => import("./AdminUserPlaces"));

function HubPanelLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-warning/30 border-t-accent-warning" />
    </div>
  );
}

export default function AdminPlacesHub() {
  return (
    <AdminHubShell
      pathname="/admin/places"
      panels={{
        tags: (
          <Suspense fallback={<HubPanelLoader />}>
            <AdminPlaceTags />
          </Suspense>
        ),
        userPlaces: (
          <Suspense fallback={<HubPanelLoader />}>
            <AdminUserPlaces />
          </Suspense>
        ),
      }}
    />
  );
}

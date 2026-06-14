import { lazy, Suspense } from "react";
import AdminHubShell from "@/components/admin/AdminHubShell";

const ToolboxManagement = lazy(() => import("./ToolboxManagement"));
const ToolboxImportPanel = lazy(() => import("./ToolboxImportPanel"));
const ToolboxWaitingConfirmation = lazy(() => import("./ToolboxWaitingConfirmation"));
const ToolboxTracking = lazy(() => import("./ToolboxTracking"));
const ToolboxUserPreview = lazy(() => import("./ToolboxUserPreview"));

function HubPanelLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-warning/30 border-t-accent-warning" />
    </div>
  );
}

export default function AdminToolboxHub() {
  return (
    <AdminHubShell
      pathname="/admin/toolbox"
      panels={{
        users: (
          <Suspense fallback={<HubPanelLoader />}>
            <ToolboxManagement />
          </Suspense>
        ),
        import: (
          <Suspense fallback={<HubPanelLoader />}>
            <ToolboxImportPanel />
          </Suspense>
        ),
        review: (
          <Suspense fallback={<HubPanelLoader />}>
            <ToolboxWaitingConfirmation />
          </Suspense>
        ),
        tracking: (
          <Suspense fallback={<HubPanelLoader />}>
            <ToolboxTracking />
          </Suspense>
        ),
        userView: (
          <Suspense fallback={<HubPanelLoader />}>
            <ToolboxUserPreview />
          </Suspense>
        ),
      }}
    />
  );
}

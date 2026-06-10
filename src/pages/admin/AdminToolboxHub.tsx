import { lazy, Suspense } from "react";
import AdminHubShell from "@/components/admin/AdminHubShell";

const ToolboxStudio = lazy(() => import("./ToolboxStudio"));
const ToolboxAssignments = lazy(() => import("./ToolboxAssignments"));

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
        studio: (
          <Suspense fallback={<HubPanelLoader />}>
            <ToolboxStudio />
          </Suspense>
        ),
        assignments: (
          <Suspense fallback={<HubPanelLoader />}>
            <ToolboxAssignments />
          </Suspense>
        ),
        manage: (
          <Suspense fallback={<HubPanelLoader />}>
            <ToolboxStudio />
          </Suspense>
        ),
        waiting: (
          <Suspense fallback={<HubPanelLoader />}>
            <ToolboxStudio />
          </Suspense>
        ),
        program: (
          <Suspense fallback={<HubPanelLoader />}>
            <ToolboxStudio />
          </Suspense>
        ),
      }}
    />
  );
}

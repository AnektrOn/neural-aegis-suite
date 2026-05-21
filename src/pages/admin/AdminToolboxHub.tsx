import { lazy, Suspense } from "react";
import AdminHubShell from "@/components/admin/AdminHubShell";

const ToolboxManagement = lazy(() => import("./ToolboxManagement"));
const ToolboxWaitingConfirmation = lazy(() => import("./ToolboxWaitingConfirmation"));
const ProgramBuilder = lazy(() => import("./ProgramBuilder"));

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
        manage: (
          <Suspense fallback={<HubPanelLoader />}>
            <ToolboxManagement />
          </Suspense>
        ),
        waiting: (
          <Suspense fallback={<HubPanelLoader />}>
            <ToolboxWaitingConfirmation />
          </Suspense>
        ),
        program: (
          <Suspense fallback={<HubPanelLoader />}>
            <ProgramBuilder />
          </Suspense>
        ),
      }}
    />
  );
}

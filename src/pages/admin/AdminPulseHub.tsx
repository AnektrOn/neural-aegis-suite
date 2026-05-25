import { lazy, Suspense, useCallback, useReducer } from "react";
import AdminHubShell from "@/components/admin/AdminHubShell";

const PulseManagement = lazy(() =>
  import("./pulse/PulseManagement").then((m) => ({ default: m.PulseManagement })),
);
const PulseUserStats = lazy(() =>
  import("./pulse/PulseUserStats").then((m) => ({ default: m.PulseUserStats })),
);
const PulseJsonImport = lazy(() =>
  import("./pulse/PulseJsonImport").then((m) => ({ default: m.PulseJsonImport })),
);

function HubPanelLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-warning/30 border-t-accent-warning" />
    </div>
  );
}

export default function AdminPulseHub() {
  const [refreshKey, bump] = useReducer((n: number) => n + 1, 0);
  const onImported = useCallback(() => bump(), []);

  return (
    <AdminHubShell
      pathname="/admin/pulse"
      panels={{
        manage: (
          <Suspense fallback={<HubPanelLoader />}>
            <PulseManagement key={refreshKey} />
          </Suspense>
        ),
        stats: (
          <Suspense fallback={<HubPanelLoader />}>
            <PulseUserStats />
          </Suspense>
        ),
        import: (
          <Suspense fallback={<HubPanelLoader />}>
            <PulseJsonImport onImported={onImported} />
          </Suspense>
        ),
      }}
    />
  );
}

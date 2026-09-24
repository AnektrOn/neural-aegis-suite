import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePlatformRoles } from "@/hooks/use-admin";

export default function DevGate({ children }: { children: ReactNode }) {
  const { isPlatformOperator, loading } = usePlatformRoles();

  if (loading) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!isPlatformOperator) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

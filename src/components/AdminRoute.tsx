import { usePlatformRoles } from "@/hooks/use-admin";
import { Navigate } from "react-router-dom";

type AdminRouteProps = {
  children: React.ReactNode;
  /** When true, only superadmin may enter (content writes, danger zone, etc.). */
  requireSuperAdmin?: boolean;
};

export default function AdminRoute({ children, requireSuperAdmin = false }: AdminRouteProps) {
  const { isSuperAdmin, isPlatformOperator, loading } = usePlatformRoles();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (requireSuperAdmin) {
    if (!isSuperAdmin) {
      return <Navigate to={isPlatformOperator ? "/admin" : "/"} replace />;
    }
    return <>{children}</>;
  }

  if (!isPlatformOperator) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

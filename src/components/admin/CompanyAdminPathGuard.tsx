import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePlatformRoles } from "@/hooks/use-admin";
import { isCompanyAdminPathAllowed } from "@/lib/adminNavConfig";

/** Redirect company_admin away from superadmin-only admin paths. */
export default function CompanyAdminPathGuard({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, isCompanyAdmin, loading } = usePlatformRoles();
  const location = useLocation();

  if (loading) return <>{children}</>;
  if (isSuperAdmin || !isCompanyAdmin) return <>{children}</>;

  if (!isCompanyAdminPathAllowed(location.pathname)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

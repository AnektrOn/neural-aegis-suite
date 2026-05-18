import { useAuth } from "@/contexts/AuthContext";
import { BootLoadingScreen } from "@/components/BootLoadingScreen";
import { Navigate, useLocation } from "react-router-dom";

export default function VisitorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, bootScreenActive } = useAuth();
  const location = useLocation();

  if (loading || bootScreenActive) {
    return (
      <div className="relative z-10 min-h-screen">
        <BootLoadingScreen />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?guest=1&redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}

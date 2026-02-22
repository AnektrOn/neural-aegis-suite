import { useAdmin } from "@/hooks/use-admin";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

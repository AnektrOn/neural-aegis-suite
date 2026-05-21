import { Navigate, useLocation } from "react-router-dom";
import { ADMIN_LEGACY_REDIRECTS } from "@/lib/adminNavConfig";

/** Redirects legacy admin paths to hub URLs (preserves query string if present). */
export default function AdminLegacyRedirect({ from }: { from: string }) {
  const location = useLocation();
  const target = ADMIN_LEGACY_REDIRECTS[from];
  if (!target) return <Navigate to="/admin" replace />;

  const [path, query] = target.split("?");
  const merged = new URLSearchParams(query ?? "");
  const existing = new URLSearchParams(location.search);
  existing.forEach((v, k) => {
    if (!merged.has(k)) merged.set(k, v);
  });
  const search = merged.toString();
  return <Navigate to={{ pathname: path, search: search ? `?${search}` : undefined }} replace />;
}

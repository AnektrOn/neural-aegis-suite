import { useLocation } from "react-router-dom";
import { isMemberAppPath } from "@/seo/memberAppPathPrefixes";
import PublicNotFoundPage from "@/pages/PublicNotFoundPage";

/**
 * Before the member shell: reject unknown public URLs so they 404 instead of redirecting to /auth.
 */
export default function PublicUnknownPathGuard({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  if (!isMemberAppPath(pathname)) {
    return <PublicNotFoundPage />;
  }
  return <>{children}</>;
}
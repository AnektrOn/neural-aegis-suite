import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isVisitorOnlyUser } from "@/lib/authVisitor";
import { useQuizCompletion } from "@/hooks/useQuizCompletion";
import { GUARDIAN_ONBOARDING_PATH } from "@/lib/welcomeHud";

/** Chemins toujours accessibles même si le questionnaire n'est pas terminé. */
const EXEMPT_PREFIXES = [
  "/onboarding",
  "/assessment",
  "/quiz",
  "/profile",
  "/settings",
  "/pricing",
  "/checkout",
  "/install",
  "/legal",
  "/auth",
];

function isExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Redirige automatiquement vers l'onboarding Guardian tout utilisateur
 * (y compris les comptes déjà existants) qui n'a pas terminé le questionnaire.
 */
export default function RequireQuizOnboarding({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { loading, completed } = useQuizCompletion();

  const skip = !user || isVisitorOnlyUser(user) || isExempt(pathname);

  if (!skip && !loading && !completed) {
    return <Navigate to={GUARDIAN_ONBOARDING_PATH} replace />;
  }

  return <>{children}</>;
}

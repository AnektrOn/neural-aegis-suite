import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isVisitorOnlyUser } from "@/lib/authVisitor";
import { useQuizCompletion } from "@/hooks/useQuizCompletion";
import { GUARDIAN_ONBOARDING_PATH } from "@/lib/welcomeHud";
import { useGuardianOptional, needsGuardianOnboarding } from "@/features/guardian";

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
  const guardian = useGuardianOptional();

  const skip = !user || isVisitorOnlyUser(user) || isExempt(pathname);

  if (!skip && !loading && !completed) {
    // Guardian déjà terminé/refusé → on envoie directement au questionnaire
    // pour éviter une boucle de redirection avec la page d'onboarding.
    const guardianDone =
      guardian?.hydrated && !needsGuardianOnboarding(guardian.state);
    return (
      <Navigate
        to={guardianDone ? "/onboarding/assessment" : GUARDIAN_ONBOARDING_PATH}
        replace
      />
    );
  }

  return <>{children}</>;
}

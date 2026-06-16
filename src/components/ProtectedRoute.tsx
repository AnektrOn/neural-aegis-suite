import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isAnonymousUser, isGuestUser } from "@/lib/authVisitor";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import OnboardingFlow from "@/components/OnboardingFlow";

function RouteSpinner() {
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, session, loading } = useAuth();
  const resolvedUser = user ?? session?.user ?? null;
  const location = useLocation();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (resolvedUser && !isAnonymousUser(resolvedUser) && !isGuestUser(resolvedUser)) {
      // Onboarding désactivé : on auto-marque comme fait pour ne plus jamais
      // l'afficher (évite l'écran « overlay noir » au reload / nouveau navigateur).
      const key = `aegis_onboarded_${resolvedUser.id}`;
      if (!localStorage.getItem(key)) {
        try { localStorage.setItem(key, "true"); } catch { /* ignore */ }
      }
      setShowOnboarding(false);
      setOnboardingChecked(true);
    } else if (resolvedUser) {
      setShowOnboarding(false);
      setOnboardingChecked(true);
    }
  }, [resolvedUser]);

  if (loading) {
    return <RouteSpinner />;
  }

  if (resolvedUser && !onboardingChecked) {
    return <RouteSpinner />;
  }

  if (!resolvedUser) {
    return <Navigate to="/auth" replace />;
  }

  if (isAnonymousUser(resolvedUser) || isGuestUser(resolvedUser)) {
    return <Navigate to="/visitor" replace state={{ from: location.pathname }} />;
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          localStorage.setItem(`aegis_onboarded_${resolvedUser.id}`, "true");
          setShowOnboarding(false);
          navigate("/welcome", { replace: true });
        }}
      />
    );
  }

  return <>{children}</>;
}

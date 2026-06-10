import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isAnonymousUser, isGuestUser } from "@/lib/authVisitor";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import OnboardingFlow from "@/components/OnboardingFlow";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (user && !isAnonymousUser(user) && !isGuestUser(user)) {
      const key = `aegis_onboarded_${user.id}`;
      const done = localStorage.getItem(key);
      setShowOnboarding(!done);
      setOnboardingChecked(true);
    } else if (user) {
      setShowOnboarding(false);
      setOnboardingChecked(true);
    }
  }, [user]);

  if (user && !onboardingChecked) {
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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isAnonymousUser(user) || isGuestUser(user)) {
    return <Navigate to="/visitor" replace state={{ from: location.pathname }} />;
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          localStorage.setItem(`aegis_onboarded_${user.id}`, "true");
          setShowOnboarding(false);
          navigate("/welcome", { replace: true });
        }}
      />
    );
  }

  return <>{children}</>;
}

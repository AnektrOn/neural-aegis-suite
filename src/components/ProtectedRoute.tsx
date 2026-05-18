import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isAnonymousUser, isGuestUser } from "@/lib/authVisitor";
import { Navigate, useLocation } from "react-router-dom";
import OnboardingFlow from "@/components/OnboardingFlow";
import { BootLoadingScreen } from "@/components/BootLoadingScreen";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
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
      <div className="relative z-10 min-h-screen">
        <BootLoadingScreen />
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
        }}
      />
    );
  }

  return <>{children}</>;
}

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import OnboardingFlow from "@/components/OnboardingFlow";
import { BootLoadingScreen } from "@/components/BootLoadingScreen";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (user) {
      const key = `aegis_onboarded_${user.id}`;
      const done = localStorage.getItem(key);
      setShowOnboarding(!done);
      setOnboardingChecked(true);
    }
  }, [user]);

  if (loading || (user && !onboardingChecked)) {
    return (
      <div className="relative z-10 min-h-screen">
        <BootLoadingScreen />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
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

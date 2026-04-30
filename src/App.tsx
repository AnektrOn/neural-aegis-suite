import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BootLoadingScreen } from "@/components/BootLoadingScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { BrowserRouter, MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AppLayout from "./components/AppLayout";
import AdminLayout from "./components/AdminLayout";

// Lazy-loaded user pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MoodTracker = lazy(() => import("./pages/MoodTracker"));
const DecisionLog = lazy(() => import("./pages/DecisionLog"));
const HabitTracker = lazy(() => import("./pages/HabitTracker"));
const Toolbox = lazy(() => import("./pages/Toolbox"));
const PeopleBoard = lazy(() => import("./pages/PeopleBoard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Journal = lazy(() => import("./pages/Journal"));
const Profile = lazy(() => import("./pages/Profile"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const CalendarView = lazy(() => import("./pages/CalendarView"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthPage = lazy(() => import("./pages/AuthPage"));

// Admin pages
const CallAuditDashboard = lazy(() => import("./pages/admin/CallAuditDashboard"));
const HabitFactory = lazy(() => import("./pages/admin/HabitFactory"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const ExecutiveDashboard = lazy(() => import("./pages/admin/ExecutiveDashboard"));
const CompanyManagement = lazy(() => import("./pages/admin/CompanyManagement"));
const ToolboxManagement = lazy(() => import("./pages/admin/ToolboxManagement"));
const AdminDecisions = lazy(() => import("./pages/admin/AdminDecisions"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const ScoreboardConfig = lazy(() => import("./pages/admin/ScoreboardConfig"));
const AdminNotificationRegistry = lazy(() => import("./pages/admin/AdminNotificationRegistry"));
const AdminPlaceTags = lazy(() => import("./pages/admin/AdminPlaceTags"));
const AdminUserPlaces = lazy(() => import("./pages/admin/AdminUserPlaces"));
const AdminAssessments = lazy(() => import("./pages/admin/AdminAssessments"));
const AdminAlertsPanel = lazy(() => import("./pages/admin/AdminAlertsPanel"));
const AdminExport = lazy(() => import("./pages/admin/AdminExport"));
const AssessmentFlow = lazy(() => import("./features/archetype-assessment/pages/AssessmentFlow"));
const AssessmentResults = lazy(() => import("./features/archetype-assessment/pages/AssessmentResults"));
const DeepDiveSampleReport = lazy(() => import("./features/archetype-deepdive-v2/pages/DeepDiveSampleReport"));
const DeepDiveUserReport = lazy(() => import("./features/archetype-deepdive-v2/pages/DeepDiveUserReport"));

const Router = Capacitor.isNativePlatform() ? MemoryRouter : BrowserRouter;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

/** Global boot overlay (auth + native cold/resume): also covers `/auth` before session is known. */
function AuthBootGate({ children }: { children: React.ReactNode }) {
  const { bootScreenActive } = useAuth();
  if (bootScreenActive) {
    return (
      <div className="relative z-[100] min-h-screen">
        <BootLoadingScreen />
      </div>
    );
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <LanguageProvider>
          <AuthProvider>
            <AuthBootGate>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {import.meta.env.DEV ? (
                  <Route path="/__loader" element={<BootLoadingScreen />} />
                ) : null}
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AdminLayout>
                          <Suspense fallback={<PageLoader />}>
                            <Routes>
                              <Route path="/" element={<CallAuditDashboard />} />
                              <Route path="/habits" element={<HabitFactory />} />
                              <Route path="/users" element={<UserManagement />} />
                              <Route path="/analytics" element={<AdminAnalytics />} />
                              <Route path="/executive" element={<ExecutiveDashboard />} />
                              <Route path="/companies" element={<CompanyManagement />} />
                              <Route path="/toolbox" element={<ToolboxManagement />} />
                              <Route path="/decisions" element={<AdminDecisions />} />
                              <Route path="/messages" element={<AdminMessages />} />
                              <Route path="/scoreboard" element={<ScoreboardConfig />} />
                              <Route path="/notification-registry" element={<AdminNotificationRegistry />} />
                              <Route path="/place-tags" element={<AdminPlaceTags />} />
                              <Route path="/user-places" element={<AdminUserPlaces />} />
                              <Route path="/assessments" element={<AdminAssessments />} />
                              <Route path="/alerts" element={<AdminAlertsPanel />} />
                              <Route path="/export" element={<AdminExport />} />
                              <Route path="/deep-dive-sample" element={<DeepDiveSampleReport />} />
                            </Routes>
                          </Suspense>
                        </AdminLayout>
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/mood" element={<MoodTracker />} />
                            <Route path="/decisions" element={<DecisionLog />} />
                            <Route path="/habits" element={<HabitTracker />} />
                            <Route path="/journal" element={<Journal />} />
                            <Route path="/toolbox" element={<Toolbox />} />
                            <Route path="/people" element={<PeopleBoard />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/install" element={<InstallApp />} />
                            <Route path="/calendar" element={<CalendarView />} />
                            <Route path="/onboarding/assessment" element={<AssessmentFlow />} />
                            <Route path="/onboarding/results" element={<AssessmentResults />} />
                            <Route path="/deep-dive" element={<DeepDiveUserReport />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
            </AuthBootGate>
          </AuthProvider>
        </LanguageProvider>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

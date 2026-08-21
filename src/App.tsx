import { Suspense, useEffect, useState } from "react";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BootLoadingScreen } from "@/components/BootLoadingScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { BrowserRouter, MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import AppUpdatePrompt from "@/components/AppUpdatePrompt";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RequireSubscription from "@/components/RequireSubscription";
import VisitorRoute from "@/components/VisitorRoute";
import AdminRoute from "@/components/AdminRoute";
import AdminLegacyRedirect from "@/components/admin/AdminLegacyRedirect";
import AppLayout from "./components/AppLayout";
import AdminLayout from "./components/AdminLayout";
import VisitorLayout from "./layouts/VisitorLayout";
import { useAndroidVersionReporter } from "@/hooks/useAndroidVersionReporter";

// Lazy-loaded user pages
const Dashboard = lazy(() => import("./pages/Dashboard"));

const Welcome = lazy(() => import("./pages/Welcome"));
const Persona = lazy(() => import("./pages/Persona"));
const MoodTracker = lazy(() => import("./pages/MoodTracker"));
const DecisionLog = lazy(() => import("./pages/DecisionLog"));
const HabitTracker = lazy(() => import("./pages/HabitTracker"));
const Toolbox = lazy(() => import("./pages/Toolbox"));
const Bibliotheque = lazy(() => import("./pages/Bibliotheque"));
const PeopleBoard = lazy(() => import("./pages/PeopleBoard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Journal = lazy(() => import("./pages/Journal"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const CalendarView = lazy(() => import("./pages/CalendarView"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const PublicAssessmentFlow = lazy(
  () => import("./features/archetype-assessment/pages/PublicAssessmentFlow")
);
const VisitorDashboard = lazy(() => import("./pages/VisitorDashboard"));
const VisitorDeepDiveReport = lazy(
  () => import("./features/archetype-deepdive-v2/pages/VisitorDeepDiveReport")
);
// Admin pages
const CallAuditDashboard = lazy(() => import("./pages/admin/CallAuditDashboard"));
const HabitFactory = lazy(() => import("./pages/admin/HabitFactory"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const CompanyManagement = lazy(() => import("./pages/admin/CompanyManagement"));
const VideoLibraryAdmin = lazy(() => import("./pages/admin/VideoLibraryAdmin"));
const AdminDecisions = lazy(() => import("./pages/admin/AdminDecisions"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const ScoreboardConfig = lazy(() => import("./pages/admin/ScoreboardConfig"));
const AdminNotificationRegistry = lazy(() => import("./pages/admin/AdminNotificationRegistry"));
const AdminAssessments = lazy(() => import("./pages/admin/AdminAssessments"));
const AdminAlertsPanel = lazy(() => import("./pages/admin/AdminAlertsPanel"));
const AdminExport = lazy(() => import("./pages/admin/AdminExport"));
const AssessmentFlow = lazy(() => import("./features/archetype-assessment/pages/AssessmentFlow"));
const AssessmentResults = lazy(() => import("./features/archetype-assessment/pages/AssessmentResults"));
const Houses72Flow = lazy(() => import("./features/houses72/pages/Houses72Flow"));
const DeepDiveUserReport = lazy(() => import("./features/archetype-deepdive-v2/pages/DeepDiveUserReport"));
const DeepDiveScores = lazy(() => import("./pages/DeepDiveScores"));
const PulsePage = lazy(() => import("./features/aegis-pulse/pages/PulsePage"));
const ArchetypeCartographyReport = lazy(() => import("./pages/ArchetypeCartographyReport"));
const CartographyManagement = lazy(() => import("./pages/admin/CartographyManagement"));
const Newsletter = lazy(() => import("./pages/Newsletter"));
const NewsletterEditionPage = lazy(() => import("./pages/NewsletterEdition"));
const NewsletterLayout = lazy(() => import("./layouts/NewsletterLayout"));
const NewsletterManagement = lazy(() => import("./pages/admin/NewsletterManagement"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminToolboxHub = lazy(() => import("./pages/admin/AdminToolboxHub"));
const AdminPlacesHub = lazy(() => import("./pages/admin/AdminPlacesHub"));
const AdminDeepDiveHub = lazy(() => import("./pages/admin/AdminDeepDiveHub"));
const AdminTaoPortraitHub = lazy(() => import("./pages/admin/AdminTaoPortraitHub"));
const AdminInsightsHub = lazy(() => import("./pages/admin/AdminInsightsHub"));
const AdminPulseHub = lazy(() => import("./pages/admin/AdminPulseHub"));
const AdminGuestPreview = lazy(() => import("./pages/admin/AdminGuestPreview"));
const MobileReleases = lazy(() => import("./pages/admin/MobileReleases"));
const InstallAndroid = lazy(() => import("./pages/InstallAndroid"));
const Ambassador = lazy(() => import("./pages/Ambassador"));
const AffiliateManagement = lazy(() => import("./pages/admin/AffiliateManagement"));

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

/** Global boot overlay (auth): blocks UI until the first session bootstrap completes. */
const BOOT_GATE_MAX_MS = 6000;

function isBootGateSkippedPath(pathname: string): boolean {
  return (
    pathname === "/auth" ||
    pathname === "/install-android" ||
    pathname.startsWith("/newsletter")
  );
}

function AuthBootGate({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const skipBoot = isBootGateSkippedPath(pathname);
  const { bootScreenActive } = useAuth();
  const [appReady, setAppReady] = useState(skipBoot);
  useAndroidVersionReporter();

  useEffect(() => {
    if (skipBoot) {
      setAppReady(true);
      return;
    }
    if (!bootScreenActive) setAppReady(true);
  }, [bootScreenActive, skipBoot]);

  useEffect(() => {
    if (skipBoot) return;
    const timeout = window.setTimeout(() => setAppReady(true), BOOT_GATE_MAX_MS);
    return () => window.clearTimeout(timeout);
  }, [skipBoot]);

  // Failsafe: si l'auth bootstrap reste bloqué (ex: NetworkError sur refresh_token),
  // on libère l'UI au bout de 6s pour éviter l'écran de boot infini.
  useEffect(() => {
    const t = setTimeout(() => setAppReady(true), 6000);
    return () => clearTimeout(t);
  }, []);

  if (!appReady) {
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
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                <Route path="/install-android" element={<InstallAndroid />} />
                <Route path="/newsletter" element={<NewsletterLayout />}>
                  <Route index element={<Newsletter />} />
                  <Route path=":slug" element={<NewsletterEditionPage />} />
                </Route>
                <Route
                  path="/quiz"
                  element={
                    <VisitorRoute>
                      <PublicAssessmentFlow />
                    </VisitorRoute>
                  }
                />
                <Route
                  path="/visitor"
                  element={
                    <VisitorRoute>
                      <VisitorLayout />
                    </VisitorRoute>
                  }
                >
                  <Route index element={<VisitorDashboard />} />
                  <Route path="report" element={<VisitorDeepDiveReport />} />
                </Route>
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AdminLayout>
                          <Suspense fallback={<PageLoader />}>
                            <Routes>
                              <Route path="/" element={<AdminOverview />} />
                              <Route path="/calls" element={<CallAuditDashboard />} />
                              <Route path="/habits" element={<HabitFactory />} />
                              <Route path="/users" element={<UserManagement />} />
                              <Route path="/insights" element={<AdminInsightsHub />} />
                              <Route
                                path="/analytics"
                                element={<AdminLegacyRedirect from="/admin/analytics" />}
                              />
                              <Route
                                path="/executive"
                                element={<AdminLegacyRedirect from="/admin/executive" />}
                              />
                              <Route path="/companies" element={<CompanyManagement />} />
                              <Route path="/toolbox" element={<AdminToolboxHub />} />
                              <Route
                                path="/toolbox-waiting-confirmation"
                                element={<AdminLegacyRedirect from="/admin/toolbox-waiting-confirmation" />}
                              />
                              <Route
                                path="/program-builder"
                                element={<AdminLegacyRedirect from="/admin/program-builder" />}
                              />
                              <Route path="/pulse" element={<AdminPulseHub />} />
                              <Route path="/places" element={<AdminPlacesHub />} />
                              <Route
                                path="/place-tags"
                                element={<AdminLegacyRedirect from="/admin/place-tags" />}
                              />
                              <Route
                                path="/user-places"
                                element={<AdminLegacyRedirect from="/admin/user-places" />}
                              />
                              <Route path="/video-library" element={<VideoLibraryAdmin />} />
                              <Route path="/decisions" element={<AdminDecisions />} />
                              <Route path="/messages" element={<AdminMessages />} />
                              <Route path="/scoreboard" element={<ScoreboardConfig />} />
                              <Route path="/notification-registry" element={<AdminNotificationRegistry />} />
                              <Route path="/assessments" element={<AdminAssessments />} />
                              <Route path="/alerts" element={<AdminAlertsPanel />} />
                              <Route path="/export" element={<AdminExport />} />
              <Route path="/deep-dive" element={<AdminDeepDiveHub />} />
              <Route path="/tao-portrait" element={<AdminTaoPortraitHub />} />
                              <Route
                                path="/deep-dive-sample"
                                element={<AdminLegacyRedirect from="/admin/deep-dive-sample" />}
                              />
                              <Route
                                path="/deep-dive-v2"
                                element={<AdminLegacyRedirect from="/admin/deep-dive-v2" />}
                              />
                              <Route path="/cartography" element={<CartographyManagement />} />
                              <Route path="/newsletter" element={<NewsletterManagement />} />
                              <Route path="/guest-preview" element={<AdminGuestPreview />} />
                              <Route path="/mobile-releases" element={<MobileReleases />} />
                            </Routes>
                          </Suspense>
                        </AdminLayout>
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/welcome"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <Welcome />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <Welcome />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <RequireSubscription>
                      <AppLayout>
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/persona" element={<Persona />} />
                            <Route path="/mood" element={<MoodTracker />} />
                            <Route path="/decisions" element={<DecisionLog />} />
                            <Route path="/habits" element={<HabitTracker />} />
                            <Route path="/journal" element={<Journal />} />
                            <Route path="/toolbox" element={<Toolbox />} />
                            <Route path="/pulse" element={<PulsePage />} />
                            <Route path="/bibliotheque" element={<Bibliotheque />} />
                            <Route path="/people" element={<PeopleBoard />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/install" element={<InstallApp />} />
                            <Route path="/calendar" element={<CalendarView />} />
                            <Route path="/onboarding/assessment" element={<AssessmentFlow />} />
                            <Route path="/onboarding/results" element={<AssessmentResults />} />
                            <Route path="/assessment/maisons" element={<Houses72Flow />} />
            <Route path="/deep-dive" element={<DeepDiveUserReport />} />
            <Route path="/deep-dive/scores" element={<DeepDiveScores />} />
            <Route path="/cartographie/:pole/:mode" element={<ArchetypeCartographyReport />} />
                            <Route path="/cartographie/:pole" element={<ArchetypeCartographyReport />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </AppLayout>
                      </RequireSubscription>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
            <AppUpdatePrompt />
            </AuthBootGate>
          </AuthProvider>
        </LanguageProvider>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

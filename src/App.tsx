import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AppLayout from "./components/AppLayout";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import MoodTracker from "./pages/MoodTracker";
import DecisionLog from "./pages/DecisionLog";
import HabitTracker from "./pages/HabitTracker";
import Toolbox from "./pages/Toolbox";
import PeopleBoard from "./pages/PeopleBoard";
import AuthPage from "./pages/AuthPage";
import CallAuditDashboard from "./pages/admin/CallAuditDashboard";
import HabitFactory from "./pages/admin/HabitFactory";
import UserManagement from "./pages/admin/UserManagement";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout>
                      <Routes>
                        <Route path="/" element={<CallAuditDashboard />} />
                        <Route path="/habits" element={<HabitFactory />} />
                        <Route path="/users" element={<UserManagement />} />
                      </Routes>
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
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/mood" element={<MoodTracker />} />
                      <Route path="/decisions" element={<DecisionLog />} />
                      <Route path="/habits" element={<HabitTracker />} />
                      <Route path="/toolbox" element={<Toolbox />} />
                      <Route path="/people" element={<PeopleBoard />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

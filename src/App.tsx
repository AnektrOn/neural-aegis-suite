import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import MoodTracker from "./pages/MoodTracker";
import DecisionLog from "./pages/DecisionLog";
import HabitTracker from "./pages/HabitTracker";
import Toolbox from "./pages/Toolbox";
import PeopleBoard from "./pages/PeopleBoard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mood" element={<MoodTracker />} />
            <Route path="/decisions" element={<DecisionLog />} />
            <Route path="/habits" element={<HabitTracker />} />
            <Route path="/toolbox" element={<Toolbox />} />
            <Route path="/people" element={<PeopleBoard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import SmoothScroll from "./components/SmoothScroll";
import EntranceLoader from "./components/EntranceLoader";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import HowWeWork from "./pages/HowWeWork";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <EntranceLoader />
        <SmoothScroll />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projekty" element={<Projects />} />
          <Route path="/projekty/:slug" element={<ProjectDetail />} />
          <Route path="/jak-to-delame" element={<HowWeWork />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/zasady-ochrany-osobnich-udaju" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import News from "./pages/News";
import Community from "./pages/Community";
import Search from "./pages/Search";
import Bookmarks from "./pages/Bookmarks";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Tools from "./pages/Tools";
import Learning from "./pages/Learning";
import Trends from "./pages/Trends";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vibenews-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/news" element={<News />} />
                <Route path="/community" element={<Community />} />
                <Route path="/search" element={<Search />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/learning" element={<Learning />} />
                <Route path="/trends" element={<Trends />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

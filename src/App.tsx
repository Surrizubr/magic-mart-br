import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { AuthGuard } from "@/components/AuthGuard";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { recalculateAllConsumptionRates } from "@/lib/consumptionCalculator";
import { refreshStockStatuses, syncLastPurchaseDates } from "@/lib/stockHelpers";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const runDailyRefresh = () => {
      syncLastPurchaseDates();
      recalculateAllConsumptionRates();
      refreshStockStatuses();
    };
    runDailyRefresh();
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const timer = setTimeout(() => {
      runDailyRefresh();
      setInterval(runDailyRefresh, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <PreferencesProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={
                    <AuthGuard>
                      <Index />
                    </AuthGuard>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </PreferencesProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

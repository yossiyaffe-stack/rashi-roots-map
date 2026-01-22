import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ScholarsOverlayProvider } from "@/contexts/ScholarsOverlayContext";
import { MapControlsProvider } from "@/contexts/MapControlsContext";
import { RelationshipFilterProvider } from "@/contexts/RelationshipFilterContext";
import Index from "./pages/Index";
import Scholars from "./pages/Scholars";
import Timeline from "./pages/Timeline";
import Network from "./pages/Network";
import WorksNetwork from "./pages/WorksNetwork";
import HistoricalContext from "./pages/HistoricalContext";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ScholarsOverlayProvider>
        <MapControlsProvider>
          <RelationshipFilterProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/scholars" element={<Scholars />} />
                  <Route path="/timeline" element={<Timeline />} />
                  <Route path="/network" element={<Network />} />
                  <Route path="/works" element={<WorksNetwork />} />
                  <Route path="/context" element={<HistoricalContext />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </RelationshipFilterProvider>
        </MapControlsProvider>
      </ScholarsOverlayProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

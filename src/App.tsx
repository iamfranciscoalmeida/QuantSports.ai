import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Notebook } from "./components/notebook/Notebook";
import { GalleryListing } from "./components/gallery/GalleryListing";
import { StrategyDetail } from "./components/gallery/StrategyDetail";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./components/ui/theme-provider";
import routes from "tempo-routes";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-quant-bg flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-quant-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-quant-text font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <Suspense
        fallback={
          <div className="min-h-screen bg-quant-bg flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-quant-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-quant-text font-mono">Loading...</p>
            </div>
          </div>
        }
      >
        <>
          <Routes>
            <Route path="/" element={user ? <Dashboard /> : <Home />} />
            <Route
              path="/dashboard"
              element={user ? <Dashboard /> : <Home />}
            />
            <Route path="/notebook" element={user ? <Notebook /> : <Home />} />
            <Route path="/gallery" element={<GalleryListing />} />
            <Route path="/gallery/:slug" element={<StrategyDetail />} />
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
          <Toaster />
        </>
      </Suspense>
    </ThemeProvider>
  );
}

export default App;

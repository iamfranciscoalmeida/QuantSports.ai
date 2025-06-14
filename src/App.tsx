import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import { Dashboard } from "./components/dashboard/Dashboard";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "./components/ui/toaster";
import routes from "tempo-routes";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={user ? <Dashboard /> : <Home />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Home />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        <Toaster />
      </>
    </Suspense>
  );
}

export default App;

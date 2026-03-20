import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Layout from "./components/Layout";
import { clearAuthSession, getAuthSession } from "./utils/authStorage";

export default function App() {
  const apiBaseUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_BASE_URL ||
    "http://localhost:5000"
  ).replace(/\/$/, "");
  const authApiBaseUrl = apiBaseUrl.endsWith("/api") ? apiBaseUrl : `${apiBaseUrl}/api`;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const session = getAuthSession();

      if (!session?.token) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        return;
      }

      try {
        const response = await fetch(`${authApiBaseUrl}/auth/admin/verify`, {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });

        const result = await response.json();
        const isValid = response.ok && result?.success;

        if (!isValid) {
          clearAuthSession();
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch {
        clearAuthSession();
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifySession();
  }, [authApiBaseUrl]);

  if (isCheckingAuth) return null;

  return (
    <Routes>
      {/* LOGIN PAGE */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login setIsAuthenticated={setIsAuthenticated} />}
      />
      
      {/* PROTECTED PAGES (Kailangan naka-login para makapasok) */}
      <Route path="/dashboard" element={isAuthenticated ? <Layout setIsAuthenticated={setIsAuthenticated}><Dashboard setIsAuthenticated={setIsAuthenticated} /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/inventory" element={isAuthenticated ? <Layout setIsAuthenticated={setIsAuthenticated}><Inventory setIsAuthenticated={setIsAuthenticated} /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/reports" element={isAuthenticated ? <Layout setIsAuthenticated={setIsAuthenticated}><Reports setIsAuthenticated={setIsAuthenticated} /></Layout> : <Navigate to="/login" replace />} />
      
      {/* DEFAULT ROUTE */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

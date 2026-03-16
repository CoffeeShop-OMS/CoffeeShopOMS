import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Layout from "./components/Layout";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Routes>
      {/* LOGIN PAGE */}
      <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
      
      {/* PROTECTED PAGES (Kailangan naka-login para makapasok) */}
      <Route path="/dashboard" element={isAuthenticated ? <Layout setIsAuthenticated={setIsAuthenticated}><Dashboard setIsAuthenticated={setIsAuthenticated} /></Layout> : <Navigate to="/login" />} />
      <Route path="/inventory" element={isAuthenticated ? <Layout setIsAuthenticated={setIsAuthenticated}><Inventory setIsAuthenticated={setIsAuthenticated} /></Layout> : <Navigate to="/login" />} />
      <Route path="/reports" element={isAuthenticated ? <Layout setIsAuthenticated={setIsAuthenticated}><Reports setIsAuthenticated={setIsAuthenticated} /></Layout> : <Navigate to="/login" />} />
      
      {/* DEFAULT ROUTE */}
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}
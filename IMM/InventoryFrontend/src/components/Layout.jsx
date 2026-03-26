import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ children, setIsAuthenticated }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#FBFBFA] font-sans overflow-hidden w-screen">
      <Sidebar 
        setIsAuthenticated={setIsAuthenticated} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main className="flex-1 flex flex-col overflow-hidden w-full transition-all duration-300">
        <Navbar collapsed={collapsed} setMobileOpen={setMobileOpen} />
        <div 
          key={location.pathname}
          className="flex-1 overflow-y-auto w-full animate-fadeIn"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
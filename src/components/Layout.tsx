import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../App";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Skills", path: "/skills" },
    { name: "Certificates", path: "/certificates" },
    { name: "Profile", path: "/profile" },
    { name: "Settings", path: "/settings" },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold" style={{ color: 'var(--primary-color)' }}>
              SkillTrack
            </Link>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm font-medium transition-all"
                style={{ 
                  color: location.pathname === item.path 
                    ? 'var(--primary-color)' 
                    : 'var(--muted-color)'
                }}
              >
                {item.name}
              </Link>
            ))}
            <button 
              onClick={logout}
              className="text-sm font-medium text-muted ml-4 btn btn-outline"
            >
              Logout
            </button>
          </nav>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="container py-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block py-2 text-sm font-medium"
                  style={{ 
                    color: location.pathname === item.path 
                      ? 'var(--primary-color)' 
                      : 'var(--muted-color)'
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="block w-full text-left py-2 text-sm font-medium text-muted"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>
      
      <main className="flex-1 container py-6">
        {children}
      </main>
      
      <footer className="bg-white border-t py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-muted">
            © 2023 SkillTrack. All rights reserved.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Link to="#" className="text-sm text-muted hover:text-primary">
              Terms
            </Link>
            <Link to="#" className="text-sm text-muted hover:text-primary">
              Privacy
            </Link>
            <Link to="#" className="text-sm text-muted hover:text-primary">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

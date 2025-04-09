import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Award, 
  User, 
  Settings, 
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  Layout,
  Shield,
  Users,
  LineChart,
  Database,
  CheckCircle,
  FileText,
  Code,
  Trophy
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';

// Add this type definition
type NavItem = 
  | { path: string; label: string; icon: React.ReactNode } 
  | { divider: boolean };

const DashboardLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const { theme, setTheme } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Regular user navigation items
  const userNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Layout size={18} /> },
    { path: '/dashboard/skills', label: 'Skills', icon: <BarChart size={18} /> },
    { path: '/dashboard/certificates', label: 'Certificates', icon: <Award size={18} /> },
    { path: '/dashboard/achievements', label: 'Achievements', icon: <Trophy size={18} /> },
    { path: '/dashboard/profile', label: 'Profile', icon: <User size={18} /> },
    { path: '/dashboard/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  // Admin-specific navigation items
  const adminNavItems = [
    { path: '/admin', label: 'Admin Dashboard', icon: <Shield size={18} /> },
    { path: '/admin/users', label: 'User Management', icon: <Users size={18} /> },
    { path: '/admin/system', label: 'System Settings', icon: <Settings size={18} /> },
    { path: '/admin/certificates', label: 'Certificate Management', icon: <Award size={18} /> },
    { path: '/admin/skills', label: 'Skill Management', icon: <BarChart size={18} /> },
    { path: '/admin/verification', label: 'Verification Settings', icon: <CheckCircle size={18} /> },
    { path: '/admin/content', label: 'Content Management', icon: <FileText size={18} /> },
    { path: '/admin/api', label: 'API Management', icon: <Code size={18} /> },
    { path: '/admin/logs', label: 'System Logs', icon: <Database size={18} /> },
  ];

  // Then update the navItems array declaration
  const navItems: NavItem[] = user?.isAdmin 
    ? adminNavItems
    : userNavItems;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow fixed top-0 left-0 right-0 z-50">
        <div className="h-16 flex items-center justify-between pl-8 pr-4">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-700 focus:outline-none md:hidden mr-2"
            >
              <Menu size={24} />
            </button>
            <Link to={user?.isAdmin ? "/admin" : "/dashboard"} className="text-xl font-bold text-gray-800 relative z-50">
              Skillify
            </Link>
            <div className="w-4"></div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user?.isAdmin && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Admin
              </span>
            )}
            <button 
              onClick={toggleTheme} 
              className="text-gray-500 hover:text-gray-700 focus:outline-none p-2 rounded-full"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 focus:outline-none flex items-center space-x-1"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 md:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 z-30 transition duration-200 ease-in-out w-64 bg-white border-r border-gray-200 mt-16`}>
        <div className="h-full flex flex-col justify-between">
          <div className="px-4 py-6">
            <div className="md:hidden flex justify-end">
              <button 
                onClick={closeSidebar}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gray-300 overflow-hidden mb-2">
                <img 
                  src={user?.profileImage || '/placeholder.svg'} 
                  alt={user?.name || 'User'} 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-lg font-medium">{user?.name}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              {user?.isAdmin && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium mt-1 px-2.5 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
            
            <nav className="space-y-1">
              {navItems.map((item, index) => (
                item.divider ? (
                  <div key={`divider-${index}`} className="my-4 border-t border-gray-200"></div>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebar}
                    className={({ isActive }) => 
                      `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </NavLink>
                )
              ))}
            </nav>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 pt-20 pb-6 px-4">
        <div className="max-w-7xl mx-auto mt-6 ml-0 md:ml-64">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 
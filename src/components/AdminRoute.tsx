import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Check if user is an admin (either by role or isAdmin property)
  const isUserAdmin = user && (user.role === 'admin' || (user as any).isAdmin === true);

  useEffect(() => {
    // Debug the admin check
    console.log('AdminRoute check:', { 
      isAuthenticated, 
      userRole: user?.role,
      isAdmin: (user as any)?.isAdmin,
      isUserAdmin,
      user
    });
    
    if (!loading && isAuthenticated && user && !isUserAdmin) {
      toast.error('You need admin privileges to access this page');
      console.error('Admin access denied:', user);
    }
  }, [isAuthenticated, loading, user, isUserAdmin]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // First check if user is authenticated
  if (!isAuthenticated) {
    console.log('Admin route rejected: Not authenticated');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Then check if user has admin privileges
  if (!isUserAdmin) {
    console.log('Admin route rejected: Not admin', user);
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // Render children if authenticated and admin
  console.log('Admin route accepted: User is admin');
  return <>{children}</>;
};

export default AdminRoute; 
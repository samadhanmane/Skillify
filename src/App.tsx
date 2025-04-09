import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./hooks/useAuth";
import { AppProvider } from "./context/AppContext";
import type { ReactNode } from "react";

// Import our backend setup function
import { setupBackend } from './setupBackend';

// Pages
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import SkillsPage from "./pages/SkillsPage";
import CertificatesPage from "./pages/CertificatesPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import VerificationPage from "./pages/VerificationPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import AchievementsPage from "./pages/AchievementsPage";
import SharedCertificatePage from "./pages/SharedCertificatePage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import SystemSettings from "./pages/admin/SystemSettings";
import SystemLogs from "./pages/admin/SystemLogs";
import CertificateManagement from "./pages/admin/CertificateManagement";
import SkillManagement from "./pages/admin/SkillManagement";
import VerificationSettings from "./pages/admin/VerificationSettings";
import ContentManagement from "./pages/admin/ContentManagement";
import ApiManagement from "./pages/admin/ApiManagement";
import SimpleAdminTest from "./pages/admin/SimpleAdminTest";

// Layout components
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import DashboardLayout from "./components/DashboardLayout";

const App: React.FC = () => {
  useEffect(() => {
    // Initialize backend connection when app loads
    setupBackend()
      .then(result => {
        console.log('Backend setup complete:', result);
      })
      .catch(error => {
        console.error('Backend setup failed:', error);
      });
  }, []);

  return (
    <AuthProvider>
      <AppProvider>
        <Toaster position="top-right" />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify" element={<VerificationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile/:email" element={<PublicProfilePage />} />
            <Route path="/certificate/:email/:certificateId" element={<SharedCertificatePage />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="skills" element={<SkillsPage />} />
              <Route path="certificates" element={<CertificatesPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="achievements" element={<AchievementsPage />} />
            </Route>
            
            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <DashboardLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="system" element={<SystemSettings />} />
              <Route path="logs" element={<SystemLogs />} />
              <Route path="certificates" element={<CertificateManagement />} />
              <Route path="skills" element={<SkillManagement />} />
              <Route path="verification" element={<VerificationSettings />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="api" element={<ApiManagement />} />
              <Route path="test" element={<SimpleAdminTest />} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;

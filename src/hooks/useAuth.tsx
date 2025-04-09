import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import apiClient from '../lib/axios';

// Define the API base URL
const API_URL = 'http://localhost:4000/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<string>;
  updatePassword: (token: string, newPassword: string) => Promise<void>;
  loading: boolean;
  setUser: (user: UserData) => void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  links?: any[];
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check auth status function that can be reused
  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('skillify_token');
    
    if (!token) {
      console.log('No token found in localStorage');
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }
    
    console.log('Token found in localStorage:', token.substring(0, 15) + '...');
    
    try {
      // Token exists in localStorage, check if it's valid
      console.log('Validating token with /auth/me endpoint...');
      const response = await apiClient.get('/auth/me');
      
      console.log('Auth validation response:', response.data);
      
      if (response.data.success && response.data.user) {
        console.log('Token validation successful, user authenticated:', response.data.user.name);
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        // Token is invalid, clear it
        console.log('Token validation failed - no user data returned');
        localStorage.removeItem('skillify_token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      
      // Clear invalid token
      console.log('Clearing invalid token from localStorage');
      localStorage.removeItem('skillify_token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for existing token on mount
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        await checkAuthStatus();
      } catch (error) {
        console.error('Initial auth check error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [checkAuthStatus]);

  // Set up a periodic token validation (every 15 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 15 * 60 * 1000); // Check every 15 minutes
    
    return () => clearInterval(interval);
  }, [isAuthenticated, checkAuthStatus]);

  // Login function
  const login = async (email: string, password: string) => {
    if (!email || !password) {
      toast.error('Please provide both email and password');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', { email, password });
      
      // Debug the login response
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        // Save token with proper JSON validation
        localStorage.setItem('skillify_token', response.data.token);
        
        // Set user data from response
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        // Debug user data
        console.log('User data after login:', response.data.user);
        console.log('Admin status:', 
          'role =', response.data.user.role, 
          'isAdmin =', response.data.user.isAdmin,
          'admin access =', (response.data.user.role === 'admin' || response.data.user.isAdmin === true)
        );
        
        toast.success('Logged in successfully');
        return response.data.user; // Return user data on success
      } else {
        // Handle successful response but with error
        toast.error(response.data.message || 'Failed to login');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle network errors vs server errors
      const errorMessage = error.response?.data?.message || 
                          (error.request ? 'Network error. Please check your connection.' : 'Failed to login');
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (email: string, password: string, name: string) => {
    if (!email || !password || !name) {
      toast.error('Please provide all required information');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/register', { email, password, name });
      
      if (response.data.success) {
        // Save token with proper JSON validation
        localStorage.setItem('skillify_token', response.data.token);
        
        // Set user data from response
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        toast.success('Account created successfully');
        return; // Success case returns early
      } else {
        // Handle successful response but with error
        toast.error(response.data.message || 'Failed to create account');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle network errors vs server errors
      const errorMessage = error.response?.data?.message || 
                          (error.request ? 'Network error. Please check your connection.' : 'Failed to create account');
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('skillify_token');
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to login page (optional, mostly handled by ProtectedRoute)
    window.location.href = '/login';
    
    toast.info('Logged out successfully');
  };

  // Request password reset OTP function
  const resetPassword = async (email: string) => {
    if (!email) {
      toast.error('Please provide your email address');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        toast.success(`OTP sent to ${email}`);
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send OTP';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP function
  const verifyOTP = async (email: string, otp: string) => {
    if (!email || !otp) {
      toast.error('Please provide email and OTP');
      throw new Error('Please provide email and OTP');
    }
    
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/verify-otp', { email, otp });
      
      if (response.data.success) {
        toast.success('OTP verified successfully');
        return response.data.resetToken;
      } else {
        toast.error(response.data.message || 'Failed to verify OTP');
        throw new Error(response.data.message || 'Failed to verify OTP');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to verify OTP';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update password function
  const updatePassword = async (token: string, newPassword: string) => {
    if (!token || !newPassword) {
      toast.error('Invalid token or password');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.put(`/auth/reset-password/${token}`, {
        password: newPassword
      });
      
      if (response.data.success) {
        toast.success('Password updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update password');
      }
    } catch (error: any) {
      console.error('Password update error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update password';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    signup,
    logout,
    resetPassword,
    verifyOTP,
    updatePassword,
    loading,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

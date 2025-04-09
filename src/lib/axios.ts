import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

// Get the backend URL from environment variables or use a default
const getApiBaseUrl = () => {
  // Production environment
  if (import.meta.env.PROD) {
    // Try to get the API URL from environment variables
    const apiUrl = import.meta.env.VITE_API_URL;
    
    if (apiUrl) {
      // If it's a full URL, use it as is
      if (apiUrl.startsWith('http')) {
        console.log('Using production API URL:', apiUrl);
        return apiUrl;
      }
      // If it's a relative path like '/api', use it relative to the current host
      console.log('Using relative API path:', apiUrl);
      return apiUrl;
    }
    
    // Default to relative path if no env var is set
    console.log('No API URL specified, defaulting to /api');
    return '/api';
  }
  
  // Development environment - use localhost with configurable port
  const apiPort = import.meta.env.VITE_BACKEND_PORT || '4000';
  const devUrl = `http://localhost:${apiPort}/api`;
  console.log('Using development API URL:', devUrl);
  return devUrl;
};

// Log the API URL being used
console.log(`🔗 Using API URL: ${getApiBaseUrl()}`);

// Create an axios instance with custom config
const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
});

// Configure retry settings
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay with promise
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add custom properties to InternalAxiosRequestConfig
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    retryCount?: number;
  }
}

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Initialize retry count
    config.retryCount = config.retryCount || 0;
    
    // Get the token from localStorage
    const token = localStorage.getItem('skillify_token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`Adding token to ${config.url} request:`, 
                  `Bearer ${token.substring(0, 15)}...`);
    } else {
      console.log(`No auth token for request to ${config.url}`);
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    
    // Check if we should retry the request
    const shouldRetry = 
      config && 
      config.retryCount < MAX_RETRIES && 
      // Network errors or specific server errors should be retried
      (
        !error.response || 
        error.response.status >= 500 || 
        error.code === 'ECONNABORTED' || 
        error.code === 'ECONNRESET' ||
        (error.response?.data?.retryable === true)
      );
    
    if (shouldRetry) {
      config.retryCount += 1;
      
      // Wait before retrying
      await wait(RETRY_DELAY * config.retryCount);
      
      console.log(`Retrying request (${config.retryCount}/${MAX_RETRIES}): ${config.url}`);
      
      // Return the retry request
      return api(config);
    }
    
    // Handle common errors
    if (error.response) {
      // Server responded with an error status code
      const { status, data } = error.response;
      const errorMessage = data?.message || 'An error occurred';
      
      console.error(`API Error ${status}: ${errorMessage}`, error.response.data);
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('skillify_token');
        
        // If not already on login page, redirect
        if (window.location.pathname !== '/login') {
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
        }
      } else if (status === 403) {
        toast.error('You do not have permission to perform this action');
      } else if (status === 404) {
        toast.error('Resource not found');
      } else if (status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(errorMessage);
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('Network error:', error.request);
      
      // If we've already retried the maximum times, show error
      if (!shouldRetry) {
        toast.error('Network error. Please check your connection and try again.');
      }
    } else {
      // Something else happened while setting up the request
      console.error('API error:', error.message);
      toast.error('An error occurred. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

export default api; 
/**
 * This file is used to trigger backend setup when the application starts
 * It sends a request to make sure MongoDB is properly connected
 */

import axios from 'axios';
import { toast } from 'sonner';

// Helper function to get the backend URL (keep in sync with axios.ts)
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

/**
 * Trigger backend setup and check MongoDB connection
 */
export const setupBackend = async () => {
  try {
    console.log('Connecting to backend server...');
    // Make a request to the setup endpoint of the backend
    const response = await axios.get(`${getApiBaseUrl()}/setup`);
    
    // If we got a successful response, log it
    if (response.status === 200) {
      console.log('Connected to backend server successfully 🚀');
      console.log('MongoDB connection:', response.data.message);
      return true;
    }
    
    // If we didn't get a 200, but it didn't throw an error, log a warning
    console.warn('Backend responded with unexpected status:', response.status);
    return false;
  } catch (error: any) {
    // If we got a 401 or 404, it means the server is running but we're either
    // not authenticated or the endpoint doesn't exist
    if (error.response?.status === 401 || error.response?.status === 404) {
      console.log(`Backend server is running (status: ${error.response.status})`);
      return true;
    }
    
    // Otherwise, we probably couldn't connect to the backend
    console.error('Failed to connect to backend server:', error.message);
    toast.error('Failed to connect to the backend server. Please ensure it is running.');
    return false;
  }
};

// Run setup when the app starts
setupBackend();

export default setupBackend; 
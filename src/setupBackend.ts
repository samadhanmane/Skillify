/**
 * This file is used to trigger backend setup when the application starts
 * It sends a request to make sure MongoDB is properly connected
 */

import { toast } from 'sonner';

// This file is special as it's used to check if the backend is running
// We can't use apiClient here because this file is used to set up the connection
// that apiClient will use. So we keep the direct axios import in this file only.
import axios from 'axios';

// Function to get the API base URL from environment variables
export const getApiBaseUrl = (): string => {
  // Use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:5000';
};

/**
 * Trigger backend setup and check MongoDB connection
 */
export const setupBackend = async (): Promise<boolean> => {
  try {
    // This is a special case where we need to use axios directly
    // because apiClient might not be set up yet
    const response = await axios.get(`${getApiBaseUrl()}/setup`);
    
    if (response.data && response.data.success) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Backend connection error:', error);
    toast.error('Failed to connect to the backend server. Please try again later.');
    return false;
  }
};

// Run setup when the app starts
setupBackend();

export default setupBackend; 
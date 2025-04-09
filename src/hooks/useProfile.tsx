import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import apiClient from '../lib/axios';

// Define the API base URL
const API_URL = 'http://localhost:4000/api';

interface ProfileFormData {
  name?: string;
  bio?: string;
  location?: string;
  links?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    twitter?: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  links?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    twitter?: string;
  };
}

export const useProfile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Get user profile by ID (public)
  const getProfile = async (userId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/users/profile/${userId}`);
      
      if (response.data.success) {
        setProfile(response.data.user);
        return response.data.user;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to fetch user profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData: ProfileFormData) => {
    try {
      setLoading(true);
      const response = await apiClient.put('/users/profile', profileData);
      
      if (response.data.success) {
        // Update auth context with new user data
        if (user) {
          setUser({
            ...user,
            ...response.data.user
          });
        }
        
        toast.success('Profile updated successfully');
        return response.data.user;
      }
      return null;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Upload profile image
  const uploadProfileImage = async (imageData: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/users/profile/image', {
        image: imageData
      });
      
      if (response.data.success) {
        // Update auth context with new profile image
        if (user) {
          setUser({
            ...user,
            profileImage: response.data.profileImage
          });
        }
        
        toast.success('Profile image updated successfully');
        return response.data.profileImage;
      }
      return null;
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      toast.error(error.response?.data?.message || 'Failed to upload profile image');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    profile,
    getProfile,
    updateProfile,
    uploadProfileImage
  };
};

export default useProfile; 
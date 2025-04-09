import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile, Education } from '@/lib/types';
import apiClient from '@/lib/axios';

// Type definitions
type Theme = 'light' | 'dark' | 'system';

// Add gamification types
interface Badge {
  name: string;
  description: string;
  image?: string;
  earnedAt: string;
  type?: string;
}

interface Achievement {
  type: string;
  details: string;
  earnedAt: string;
}

interface LearningStreak {
  current: number;
  longest: number;
  lastActive: string;
}

interface GamificationData {
  points: number;
  level: number;
  pointsToNextLevel: number;
  badges: Badge[];
  achievements: Achievement[];
  learningStreak: LearningStreak;
  stats?: {
    totalCertificates: number;
    verifiedCertificates: number;
    skillsCount: number;
    avgSkillLevel: number;
  }
}

interface Skill {
  id: string;
  name: string;
  level: number;
  category: string;
}

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  skills: string[];
  category: string;
  imageUrl: string;
}

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  skills: Skill[];
  addSkill: (skill: Omit<Skill, 'id'>) => void;
  updateSkill: (skill: Skill) => void;
  deleteSkill: (id: string) => void;
  certificates: Certificate[];
  addCertificate: (certificate: Omit<Certificate, 'id'>) => void;
  updateCertificate: (certificate: Certificate) => void;
  deleteCertificate: (id: string) => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateProfileImage: (file: File) => Promise<string | null>;
  education: Education[];
  addEducation: (education: Omit<Education, 'id'>) => Promise<void>;
  updateEducation: (education: Education) => Promise<void>;
  deleteEducation: (id: string) => Promise<void>;
  generateResume: () => Promise<any>;
  gamification: GamificationData | null;
  updateStreak: () => Promise<void>;
  checkForBadges: () => Promise<void>;
  loading: {
    certificates: boolean;
    skills: boolean;
    profile: boolean;
    gamification: boolean;
    education: boolean;
    resume: boolean;
  };
  refreshData: () => Promise<void>;
  toggleCertificatePrivacy: (id: string, isPublic: boolean) => Promise<void>;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

// Context provider
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  // Get stored theme preference or default to system
  const initialTheme = localStorage.getItem('theme') as Theme || 'system';
  const [theme, setTheme] = useState<Theme>(initialTheme);

  // Loading states
  const [loading, setLoading] = useState({
    certificates: false,
    skills: false,
    profile: false,
    gamification: false,
    education: false,
    resume: false
  });

  // Gamification state
  const [gamification, setGamification] = useState<GamificationData | null>(null);

  // Skills state
  const [skills, setSkills] = useState<Skill[]>([]);

  // Certificates state
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // Education state
  const [education, setEducation] = useState<Education[]>([]);

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    title: '',
    bio: user?.bio || '',
    location: user?.location || '',
    avatarUrl: user?.profileImage || '/placeholder.svg',
    qrCodeUrl: '',
    education: [],
    socialLinks: {
      linkedin: user?.links?.linkedin || '',
      github: user?.links?.github || '',
      twitter: user?.links?.twitter || '',
      website: user?.links?.portfolio || '',
    },
  });

  // Fetch gamification data
  const fetchGamificationData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(prev => ({ ...prev, gamification: true }));
      const response = await apiClient.get('/gamification/profile');
      
      if (response.data.success) {
        setGamification(response.data.gamificationData);
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      // Don't show error toast to user to avoid annoyance, just log to console
    } finally {
      setLoading(prev => ({ ...prev, gamification: false }));
    }
  }, [isAuthenticated]);

  // Update user streak
  const updateStreak = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await apiClient.post('/gamification/update-streak');
      
      if (response.data.success) {
        // Refresh gamification data after streak update
        fetchGamificationData();
        return response.data.streak;
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  // Fetch all data from backend
  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    // Check if we've already fetched the data recently
    const lastFetchTimestamp = localStorage.getItem('last_data_fetch_timestamp');
    const currentTime = Date.now();
    const THRESHOLD_MS = 5000; // 5 seconds
    
    if (lastFetchTimestamp) {
      const timeSinceLastFetch = currentTime - parseInt(lastFetchTimestamp);
      // If we've fetched data recently, don't fetch again
      if (timeSinceLastFetch < THRESHOLD_MS) {
        console.log('Skipping data fetch - fetched recently');
        return;
      }
    }
    
    // Set the fetch timestamp before starting fetch
    localStorage.setItem('last_data_fetch_timestamp', currentTime.toString());
    
    try {
      // Fetch certificates
      setLoading(prev => ({ ...prev, certificates: true }));
      const certResponse = await apiClient.get('/certificates');
      if (certResponse.data.success) {
        // Log certificates for debugging
        console.log('Raw certificates data from API:', certResponse.data.certificates);
        
        // Map backend response to our Certificate interface
        const mappedCertificates = certResponse.data.certificates.map((cert: any) => ({
          id: cert._id,
          title: cert.title,
          issuer: cert.issuer,
          date: cert.issueDate,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          credentialId: cert.credentialID,
          credentialUrl: cert.credentialURL,
          certificateImage: cert.certificateImage || '',
          certificateFile: cert.certificateFile || '',
          fileType: cert.fileType || 'none',
          skills: cert.skills.map((s: any) => (typeof s === 'string' ? s : s.name || s)),
          category: cert.skills[0]?.category || 'Other',
          imageUrl: cert.certificateImage || '/placeholder.svg',
          isPublic: cert.isPublic !== false
        }));
        
        console.log('Mapped certificates with file data:', mappedCertificates.map(c => ({
          id: c.id,
          title: c.title,
          hasImage: Boolean(c.certificateImage),
          hasPdf: Boolean(c.certificateFile),
          fileType: c.fileType
        })));
        
        setCertificates(mappedCertificates);
      }
      setLoading(prev => ({ ...prev, certificates: false }));
      
      // Fetch skills
      setLoading(prev => ({ ...prev, skills: true }));
      try {
        const skillResponse = await apiClient.get('/skills/user-skills');
        if (skillResponse.data.success) {
          // Map backend response to our Skill interface
          const mappedSkills = skillResponse.data.userSkills.map((userSkill: any) => ({
            id: userSkill._id,
            name: userSkill.skill.name,
            level: userSkill.points,
            category: userSkill.skill.category || 'Other',
          }));
          setSkills(mappedSkills);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
        // Try alternative endpoint as fallback
        try {
          const altSkillResponse = await apiClient.get('/skills/user');
          if (altSkillResponse.data.success) {
            const mappedSkills = altSkillResponse.data.userSkills.map((userSkill: any) => ({
              id: userSkill._id,
              name: userSkill.skill.name,
              level: userSkill.points,
              category: userSkill.skill.category || 'Other',
            }));
            setSkills(mappedSkills);
          }
        } catch (fallbackError) {
          console.error('Error fetching skills (fallback):', fallbackError);
          toast.error('Failed to load your skills. Please refresh and try again.');
        }
      }
      
      // Fetch user profile
      setLoading(prev => ({ ...prev, profile: true }));
      const profileResponse = await apiClient.get('/users/profile');
      if (profileResponse.data.success) {
        const userData = profileResponse.data.user;
        
        // Debug log for education data
        console.log('Education data from profile response:', userData.education);
        
        // Explicitly fetch education data
        try {
          const educationResponse = await apiClient.get('/users/education');
          if (educationResponse.data.success) {
            console.log('Explicitly fetched education data:', educationResponse.data.education);
            // Use the explicitly fetched education data
            setEducation(educationResponse.data.education || []);
            
            // Update user profile with the fetched education data
            userData.education = educationResponse.data.education || [];
          }
        } catch (eduError) {
          console.error('Error fetching education data:', eduError);
        }
        
        setUserProfile({
          id: userData._id,
          name: userData.name,
          email: userData.email,
          title: userData.title || '',
          bio: userData.bio || '',
          location: userData.location || '',
          avatarUrl: userData.profileImage || '/placeholder.svg',
          qrCodeUrl: '',
          education: userData.education || [],
          socialLinks: {
            linkedin: userData.links?.linkedin || '',
            github: userData.links?.github || '',
            twitter: userData.links?.twitter || '',
            website: userData.links?.portfolio || '',
          },
        });
        
        // Set education state
        if (userData.education && Array.isArray(userData.education)) {
          console.log('Setting education state with data:', userData.education);
          setEducation(userData.education);
        } else {
          console.warn('Education data is not an array or is missing:', userData.education);
          setEducation([]);
        }
      }
      
      // Fetch gamification data
      await fetchGamificationData();
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load your data. Please refresh and try again.');
    } finally {
      // Ensure all loading states are reset
      setLoading({
        certificates: false,
        skills: false,
        profile: false,
        gamification: false,
        education: false,
        resume: false
      });
    }
  }, [isAuthenticated, user, fetchGamificationData]);

  // Fetch data when authentication status changes
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, isAuthenticated]);
  
  // Update streak on initial load
  useEffect(() => {
    if (isAuthenticated) {
      updateStreak();
    }
  }, [isAuthenticated]);

  // Update theme handler
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme to document with transition
    const root = document.documentElement;
    
    // Add transition class for smooth color changes
    root.classList.add('transition-colors');
    root.style.setProperty('transition', 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease');
    
    if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
      toast.success('Dark mode enabled', {
        duration: 2000,
        className: 'bg-slate-800 text-slate-200'
      });
    } else {
      root.classList.remove('dark');
      toast.success('Light mode enabled', {
        duration: 2000,
        className: 'bg-slate-100 text-slate-800'
      });
    }
    
    // Remove transition after it completes to avoid affecting other changes
    setTimeout(() => {
      root.style.removeProperty('transition');
      root.classList.remove('transition-colors');
    }, 500);
  };

  // Skill CRUD functions
  const addSkill = async (skill: Omit<Skill, 'id'>) => {
    try {
      // Check if skill already exists in the user's skills
      const existingSkill = skills.find(s => 
        s.name.toLowerCase() === skill.name.toLowerCase()
      );
      
      if (existingSkill) {
        toast.error(`You already have the skill "${skill.name}" in your profile`);
        return;
      }

      const response = await apiClient.post('/skills/user-skills', {
        name: skill.name,
        category: skill.category,
        level: skill.level
      });
      
      if (response.data.success) {
        const newSkill = {
          id: response.data.userSkill._id,
          name: response.data.userSkill.skill.name,
          level: response.data.userSkill.points,
          category: response.data.userSkill.skill.category,
        };
        setSkills([...skills, newSkill]);
        toast.success(`Added ${skill.name} to your skills`);
        
        // Check for badges after adding a skill
        checkForBadges();
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      // Check if it's a duplicate skill error from the backend
      if (error.response?.status === 400 && error.response?.data?.message === 'You already have this skill') {
        toast.error(`You already have the skill "${skill.name}" in your profile`);
      } else {
        toast.error('Failed to add skill. Please try again.');
      }
    }
  };

  const updateSkill = async (updatedSkill: Skill) => {
    try {
      const response = await apiClient.put(`/skills/user-skills/${updatedSkill.id}`, {
        points: updatedSkill.level,
      });
      
      if (response.data.success) {
        setSkills(
          skills.map((skill) => (skill.id === updatedSkill.id ? updatedSkill : skill))
        );
        toast.success(`Updated ${updatedSkill.name}`);
      }
    } catch (error) {
      console.error('Error updating skill:', error);
      toast.error('Failed to update skill. Please try again.');
    }
  };

  const deleteSkill = async (id: string) => {
    try {
      const skillToDelete = skills.find((skill) => skill.id === id);
      const response = await apiClient.delete(`/skills/user-skills/${id}`);
      
      if (response.data.success) {
        setSkills(skills.filter((skill) => skill.id !== id));
        if (skillToDelete) {
          toast.success(`Removed ${skillToDelete.name} from your skills`);
        }
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast.error('Failed to delete skill. Please try again.');
    }
  };

  // Certificate CRUD functions
  const addCertificate = async (certificate: any) => {
    try {
      console.log('Adding certificate with data:', { 
        hasImage: Boolean(certificate.certificateImage), 
        hasPdf: Boolean(certificate.certificateFile),
        title: certificate.title,
        fileType: certificate.certificateImage ? 'image' : certificate.certificateFile ? 'pdf' : 'url'
      });
      
      // Set a loading state toast to provide feedback
      const loadingToast = toast.loading('Uploading certificate...');
      
      const response = await apiClient.post('/certificates', {
        title: certificate.title,
        issuer: certificate.issuer,
        issueDate: certificate.date,
        expiryDate: certificate.expiryDate,
        credentialID: certificate.credentialId,
        credentialURL: certificate.credentialUrl,
        certificateImage: certificate.certificateImage, // Data URL for image
        certificateFile: certificate.certificateFile,   // Data URL for PDF
        isPublic: certificate.isPublic !== undefined ? certificate.isPublic : true,
        skills: certificate.skills.map((skill: any) => ({ name: typeof skill === 'string' ? skill : skill.name })),
        skipVerification: true // Skip AI verification for faster uploads
      });
      
      // Dismiss the loading toast
      toast.dismiss(loadingToast);
      
      if (response.data.success) {
        // Log the response data for debugging
        console.log('Certificate added successfully, server response:', {
          id: response.data.certificate._id,
          hasImage: Boolean(response.data.certificate.certificateImage),
          hasPdf: Boolean(response.data.certificate.certificateFile),
          imageUrl: response.data.certificate.certificateImage || null,
          fileUrl: response.data.certificate.certificateFile || null,
          fileType: response.data.certificate.fileType
        });
        
        // Create a new certificate object with the Cloudinary URLs from the server response
        const newCert = {
          id: response.data.certificate._id,
          title: response.data.certificate.title,
          issuer: response.data.certificate.issuer,
          date: response.data.certificate.issueDate,
          issueDate: response.data.certificate.issueDate,
          expiryDate: response.data.certificate.expiryDate,
          credentialId: response.data.certificate.credentialID,
          credentialUrl: response.data.certificate.credentialURL || response.data.certificate.credentialUrl,
          // Use the Cloudinary URLs returned by the server, not the data URLs
          certificateImage: response.data.certificate.certificateImage || '',
          certificateFile: response.data.certificate.certificateFile || '',
          skills: certificate.skills,
          category: certificate.category,
          // Set the imageUrl based on the Cloudinary URL
          imageUrl: response.data.certificate.certificateImage || '/placeholder.svg',
          fileType: response.data.certificate.fileType || 'none',
          isPublic: response.data.certificate.isPublic
        };
        
        // Log the final certificate that will be added to state
        console.log('Adding certificate to state with URLs:', {
          certificateImage: newCert.certificateImage?.substring(0, 50) + '...',
          certificateFile: newCert.certificateFile?.substring(0, 50) + '...',
          fileType: newCert.fileType
        });
        
        setCertificates([...certificates, newCert]);
        toast.success(`Added ${certificate.title} certificate`);
        
        // Check for badges after adding a certificate
        checkForBadges();
      }
    } catch (error) {
      console.error('Error adding certificate:', error);
      toast.error('Failed to add certificate. Please try again.');
    }
  };

  const updateCertificate = async (updatedCertificate: Certificate) => {
    try {
      const response = await apiClient.put(`/certificates/${updatedCertificate.id}`, {
        title: updatedCertificate.title,
        issuer: updatedCertificate.issuer,
        issueDate: updatedCertificate.date,
        expiryDate: updatedCertificate.expiryDate,
        credentialID: updatedCertificate.credentialId,
        credentialURL: updatedCertificate.credentialUrl,
        certificateImage: updatedCertificate.imageUrl,
        skills: updatedCertificate.skills.map(skill => ({ name: skill }))
      });
      
      if (response.data.success) {
        setCertificates(
          certificates.map((cert) =>
            cert.id === updatedCertificate.id ? updatedCertificate : cert
          )
        );
        toast.success(`Updated ${updatedCertificate.title} certificate`);
      }
    } catch (error) {
      console.error('Error updating certificate:', error);
      toast.error('Failed to update certificate. Please try again.');
    }
  };

  const deleteCertificate = async (id: string) => {
    try {
      const certToDelete = certificates.find((cert) => cert.id === id);
      console.log(`Attempting to delete certificate with ID: ${id}`);
      
      if (!id) {
        console.error('Invalid certificate ID for deletion:', id);
        toast.error('Cannot delete certificate: Invalid ID');
        return;
      }
      
      const response = await apiClient.delete(`/certificates/${id}`);
      
      if (response.data.success) {
        console.log(`Successfully deleted certificate: ${id}`);
        setCertificates(certificates.filter((cert) => cert.id !== id));
        if (certToDelete) {
          toast.success(`Removed ${certToDelete.title} certificate`);
        }
      }
    } catch (error: any) {
      console.error('Error deleting certificate:', error);
      console.error('Certificate deletion error details:', {
        id,
        errorMessage: error.message,
        errorResponse: error.response?.data,
        errorStatus: error.response?.status
      });
      
      // Show more specific error message based on status code
      if (error.response?.status === 404) {
        toast.error('Certificate not found. It may have been already deleted.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to delete this certificate.');
      } else {
        toast.error(`Failed to delete certificate: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const toggleCertificatePrivacy = async (id: string, isPublic: boolean) => {
    try {
      const certificate = certificates.find(c => c.id === id);
      if (!certificate) {
        throw new Error('Certificate not found');
      }

      console.log(`Toggling privacy for certificate ${id} to ${isPublic}`);
      
      const response = await apiClient.put(`/certificates/${id}`, {
        title: certificate.title,
        issuer: certificate.issuer,
        issueDate: certificate.date,
        expiryDate: certificate.expiryDate,
        credentialID: certificate.credentialId,
        credentialURL: certificate.credentialUrl,
        certificateImage: certificate.imageUrl,
        isPublic
      });

      if (response.data.success) {
        setCertificates(prevCertificates =>
          prevCertificates.map(cert =>
            cert.id === id ? { ...cert, isPublic } : cert
          )
        );
        toast.success(`Certificate is now ${isPublic ? 'public' : 'private'}`);
      }
    } catch (error) {
      console.error('Error toggling certificate privacy:', error);
      toast.error('Failed to update certificate privacy');
    }
  };

  // User profile update function
  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    try {
      const response = await apiClient.put('/users/profile', {
        name: profile.name,
        bio: profile.bio,
        location: profile.location,
        title: profile.title,
        links: {
          linkedin: profile.socialLinks?.linkedin,
          github: profile.socialLinks?.github,
          portfolio: profile.socialLinks?.website,
          twitter: profile.socialLinks?.twitter
        }
      });
      
      if (response.data.success) {
        setUserProfile(prev => ({
          ...prev,
          ...profile,
        }));
        toast.success('Profile updated successfully');
        
        // Check for badges after updating profile
        checkForBadges();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  // Profile image update function
  const updateProfileImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      
      // Override content-type to ensure proper multipart/form-data handling
      const response = await apiClient.post('/users/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        const imageUrl = response.data.profileImage;
        setUserProfile(prev => ({
          ...prev,
          avatarUrl: imageUrl,
        }));
        toast.success('Profile image updated successfully');
        
        // Check for badges after updating profile image
        checkForBadges();
        
        return imageUrl;
      }
      return null;
    } catch (error) {
      console.error('Error updating profile image:', error);
      toast.error('Failed to update profile image. Please try again.');
      return null;
    }
  };

  // Function to manually refresh all data
  const refreshData = async () => {
    await fetchAllData();
    toast.success('Data refreshed successfully');
  };
  
  // Check for newly earned badges
  const checkForBadges = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await apiClient.post('/gamification/check-badges');
      
      if (response.data.success && response.data.badgesAwarded?.length > 0) {
        // Refresh gamification data after badges are awarded
        fetchGamificationData();
        
        // Notify user if any new badges were earned
        response.data.badgesAwarded.forEach((badge: Badge) => {
          toast.success(`🏆 New Badge Earned: ${badge.name}!`);
        });
      }
    } catch (error) {
      console.error('Error checking for badges:', error);
      // Don't show error toast to avoid annoyance
    }
  };

  // Education CRUD functions
  const addEducation = async (educationData: Omit<Education, 'id'>) => {
    try {
      console.log('Adding education with data:', educationData);
      setLoading(prev => ({ ...prev, education: true }));
      const response = await apiClient.post('/users/education', educationData);
      
      console.log('Add education response:', response.data);
      
      if (response.data.success) {
        // Update local state with education array from response
        console.log('Education data received from server:', response.data.education);
        setEducation(response.data.education);
        
        // Update user profile
        setUserProfile(prev => ({
          ...prev,
          education: response.data.education
        }));
        
        toast.success('Education added successfully');
      }
    } catch (error) {
      console.error('Error adding education:', error);
      toast.error('Failed to add education. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, education: false }));
    }
  };

  const updateEducation = async (educationData: Education) => {
    if (!educationData.id) {
      toast.error('Education ID is required for update');
      return;
    }
    
    try {
      console.log('Updating education with ID and data:', educationData.id, educationData);
      setLoading(prev => ({ ...prev, education: true }));
      const response = await apiClient.put(`/users/education/${educationData.id}`, {
        degree: educationData.degree,
        university: educationData.university,
        location: educationData.location,
        graduationYear: educationData.graduationYear,
        startYear: educationData.startYear
      });
      
      console.log('Update education response:', response.data);
      
      if (response.data.success) {
        // Update local state with education array from response
        console.log('Updated education data from server:', response.data.education);
        setEducation(response.data.education);
        
        // Update user profile
        setUserProfile(prev => ({
          ...prev,
          education: response.data.education
        }));
        
        toast.success('Education updated successfully');
      }
    } catch (error) {
      console.error('Error updating education:', error);
      toast.error('Failed to update education. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, education: false }));
    }
  };

  const deleteEducation = async (id: string) => {
    try {
      console.log('Deleting education with ID:', id);
      setLoading(prev => ({ ...prev, education: true }));
      const response = await apiClient.delete(`/users/education/${id}`);
      
      console.log('Delete education response:', response.data);
      
      if (response.data.success) {
        // Update local state with education array from response
        console.log('Remaining education data from server:', response.data.education);
        setEducation(response.data.education);
        
        // Update user profile
        setUserProfile(prev => ({
          ...prev,
          education: response.data.education
        }));
        
        toast.success('Education deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting education:', error);
      toast.error('Failed to delete education. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, education: false }));
    }
  };
  
  // Generate resume function
  const generateResume = async () => {
    try {
      setLoading(prev => ({ ...prev, resume: true }));
      const response = await apiClient.post('/users/generate-resume');
      
      if (response.data.success) {
        toast.success('Resume generated successfully');
        return response.data.resume;
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      toast.error('Failed to generate resume. Please try again.');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, resume: false }));
    }
  };

  // Context value
  const value = {
    theme,
    setTheme: handleThemeChange,
    skills,
    addSkill,
    updateSkill,
    deleteSkill,
    certificates,
    addCertificate,
    updateCertificate,
    deleteCertificate,
    userProfile,
    updateUserProfile,
    updateProfileImage,
    education,
    addEducation,
    updateEducation,
    deleteEducation,
    generateResume,
    gamification,
    updateStreak,
    checkForBadges,
    loading,
    refreshData,
    toggleCertificatePrivacy
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Export the renamed hook for backward compatibility
export const useAppContext = useApp;

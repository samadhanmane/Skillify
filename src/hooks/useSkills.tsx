import { useState } from 'react';
import { toast } from 'sonner';
import apiClient from '../lib/axios';

interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface UserSkill {
  id: string;
  skill: Skill;
  points: number;
  certificates: string[];
}

interface DashboardData {
  skillCount: number;
  chartData: {
    categories: {
      name: string;
      count: number;
      totalPoints: number;
      averagePoints: number;
    }[];
    topSkills: {
      id: string;
      name: string;
      points: number;
      certificateCount: number;
    }[];
    skillDistribution: {
      id: string;
      name: string;
      points: number;
      category: string;
    }[];
  };
  recentCertificates: any[];
}

export const useSkills = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Get all skills
  const getAllSkills = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/skills');
      
      if (response.data.success) {
        setSkills(response.data.skills);
        return response.data.skills;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching skills:', error);
      toast.error('Failed to fetch skills');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get user skills
  const getUserSkills = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/skills/user');
      
      if (response.data.success) {
        setUserSkills(response.data.userSkills);
        return response.data.userSkills;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching user skills:', error);
      toast.error('Failed to fetch your skills');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get dashboard data
  const getDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/skills/dashboard');
      
      if (response.data.success) {
        setDashboardData(response.data);
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get public user skills
  const getPublicUserSkills = async (userId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/skills/user/${userId}`);
      
      if (response.data.success) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching public user skills:', error);
      toast.error('Failed to fetch user skills');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    skills,
    userSkills,
    dashboardData,
    getAllSkills,
    getUserSkills,
    getDashboardData,
    getPublicUserSkills
  };
};

export default useSkills;
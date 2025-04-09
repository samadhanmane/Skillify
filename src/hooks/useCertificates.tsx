import { useState } from 'react';
import { toast } from 'sonner';
import apiClient from '../lib/axios';

// Define the API base URL
const API_URL = 'http://localhost:4000/api';

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialID?: string;
  credentialURL?: string;
  certificateImage?: string;
  skills: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  createdAt: string;
}

interface CertificateFormData {
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialID?: string;
  credentialURL?: string;
  certificateImage?: string;
  skills: Array<{
    name: string;
    category?: string;
    description?: string;
  }>;
}

export const useCertificates = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [currentCertificate, setCurrentCertificate] = useState<Certificate | null>(null);

  // Get all certificates
  const getCertificates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/certificates');
      
      if (response.data.success) {
        setCertificates(response.data.certificates);
        return response.data.certificates;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to fetch certificates');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get certificate by ID
  const getCertificate = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/certificates/${id}`);
      
      if (response.data.success) {
        setCurrentCertificate(response.data.certificate);
        return response.data.certificate;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching certificate:', error);
      toast.error('Failed to fetch certificate details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create certificate
  const createCertificate = async (certificateData: CertificateFormData) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/certificates', certificateData);
      
      if (response.data.success) {
        toast.success('Certificate added successfully');
        return response.data.certificate;
      }
      return null;
    } catch (error: any) {
      console.error('Error creating certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to add certificate');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update certificate
  const updateCertificate = async (id: string, certificateData: CertificateFormData) => {
    try {
      setLoading(true);
      const response = await apiClient.put(`/certificates/${id}`, certificateData);
      
      if (response.data.success) {
        toast.success('Certificate updated successfully');
        return response.data.certificate;
      }
      return null;
    } catch (error: any) {
      console.error('Error updating certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to update certificate');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete certificate
  const deleteCertificate = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiClient.delete(`/certificates/${id}`);
      
      if (response.data.success) {
        setCertificates(certificates.filter(cert => cert.id !== id));
        toast.success('Certificate deleted successfully');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error deleting certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to delete certificate');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    certificates,
    currentCertificate,
    getCertificates,
    getCertificate,
    createCertificate,
    updateCertificate,
    deleteCertificate
  };
};

export default useCertificates; 
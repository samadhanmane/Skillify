import apiClient from './axios';

// API key management
export const getApiKeys = async () => {
  const response = await apiClient.get('/admin/api-keys');
  return response.data;
};

export const createApiKey = async (keyData: {
  name: string;
  permissions: string[];
  rateLimit: number;
}) => {
  const response = await apiClient.post('/admin/api-keys', keyData);
  return response.data;
};

export const revokeApiKey = async (keyId: string) => {
  const response = await apiClient.put(`/admin/api-keys/${keyId}/revoke`);
  return response.data;
};

export const deleteApiKey = async (keyId: string) => {
  const response = await apiClient.delete(`/admin/api-keys/${keyId}`);
  return response.data;
};

// Content management
export const getContent = async (type?: string) => {
  const response = await apiClient.get('/admin/content', {
    params: { type }
  });
  return response.data;
};

export const createContent = async (contentData: {
  title?: string;
  question?: string;
  answer?: string;
  content?: string;
  contentType: 'page' | 'faq' | 'announcement';
  status: 'draft' | 'published';
  expiry?: string;
  slug?: string;
}) => {
  const response = await apiClient.post('/admin/content', contentData);
  return response.data;
};

export const updateContent = async (
  contentId: string,
  contentData: {
    title?: string;
    question?: string;
    answer?: string;
    content?: string;
    status?: 'draft' | 'published';
    expiry?: string;
    slug?: string;
  }
) => {
  const response = await apiClient.put(`/admin/content/${contentId}`, contentData);
  return response.data;
};

export const deleteContent = async (contentId: string) => {
  const response = await apiClient.delete(`/admin/content/${contentId}`);
  return response.data;
};

// User management
export const getUsers = async () => {
  const response = await apiClient.get('/admin/users');
  return response.data;
};

export const updateUser = async (
  userId: string,
  userData: {
    name?: string;
    email?: string;
    role?: string;
  }
) => {
  const response = await apiClient.put(`/admin/users/${userId}`, userData);
  return response.data;
};

export const deactivateUser = async (userId: string) => {
  const response = await apiClient.put(`/admin/users/${userId}/deactivate`);
  return response.data;
};

export const activateUser = async (userId: string) => {
  const response = await apiClient.put(`/admin/users/${userId}/activate`);
  return response.data;
};

// System logs
export const getSystemLogs = async (params?: {
  level?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  const response = await apiClient.get('/admin/logs', { params });
  return response.data;
};

// System stats
export const getSystemStats = async () => {
  const response = await apiClient.get('/admin/stats');
  return response.data;
};

// System settings
export const getSystemSettings = async (category?: string) => {
  const response = await apiClient.get('/admin/settings', {
    params: { category }
  });
  return response.data;
};

export const updateSystemSetting = async (
  category: string,
  key: string,
  data: {
    value: any;
    description?: string;
    isPublic?: boolean;
  }
) => {
  const response = await apiClient.put(`/admin/settings/${category}/${key}`, data);
  return response.data;
}; 
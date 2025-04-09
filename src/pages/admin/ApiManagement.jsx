import React, { useState, useEffect } from 'react';
import { RefreshCw, Key, Plus, Lock, Search, Download, Trash, Clock, CheckCircle, XCircle, Copy, Eye, EyeOff } from 'lucide-react';
import { getApiKeys, createApiKey, revokeApiKey, deleteApiKey } from '@/lib/adminApi';
import { toast } from 'sonner';

const ApiManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showApiKey, setShowApiKey] = useState({});
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newKey, setNewKey] = useState({
    name: '',
    permissions: [],
    rateLimit: 100
  });

  const availablePermissions = [
    { value: 'read:certificates', label: 'Read Certificates' },
    { value: 'write:certificates', label: 'Write Certificates' },
    { value: 'delete:certificates', label: 'Delete Certificates' },
    { value: 'read:skills', label: 'Read Skills' },
    { value: 'write:skills', label: 'Write Skills' },
    { value: 'read:profiles', label: 'Read Profiles' },
    { value: 'verify:certificates', label: 'Verify Certificates' }
  ];

  // Fetch API keys on component mount
  useEffect(() => {
    fetchApiKeys();
  }, []);

  // Function to fetch API keys
  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const data = await getApiKeys();
      setApiKeys(data);
      setError(null);
    } catch (err) {
      setError('Failed to load API keys');
      console.error('Error fetching API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculate how long ago a date was
  const timeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000; // seconds in a year
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000; // seconds in a month
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400; // seconds in a day
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600; // seconds in an hour
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60; // seconds in a minute
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  };

  // Handle permission toggle
  const handlePermissionToggle = (permission) => {
    if (newKey.permissions.includes(permission)) {
      setNewKey({...newKey, permissions: newKey.permissions.filter(p => p !== permission)});
    } else {
      setNewKey({...newKey, permissions: [...newKey.permissions, permission]});
    }
  };

  // Handle create new API key
  const handleCreateKey = async () => {
    try {
      const createdKey = await createApiKey(newKey);
      
      setApiKeys([...apiKeys, createdKey]);
      setNewKey({ name: '', permissions: [], rateLimit: 100 });
      setShowCreateForm(false);
      
      toast.success(`API key "${createdKey.name}" created successfully`);
    } catch (err) {
      toast.error('Failed to create API key');
      console.error('Error creating API key:', err);
    }
  };

  // Handle revoke API key
  const handleRevokeKey = async (keyId) => {
    if (window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      try {
        const updatedKey = await revokeApiKey(keyId);
        
        setApiKeys(
          apiKeys.map(key => 
            key._id === keyId 
              ? updatedKey
              : key
          )
        );
        
        toast.success('API key revoked successfully');
      } catch (err) {
        toast.error('Failed to revoke API key');
        console.error('Error revoking API key:', err);
      }
    }
  };

  // Handle delete API key
  const handleDeleteKey = async (keyId) => {
    if (window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      try {
        await deleteApiKey(keyId);
        
        setApiKeys(apiKeys.filter(key => key._id !== keyId));
        
        toast.success('API key deleted successfully');
      } catch (err) {
        toast.error('Failed to delete API key');
        console.error('Error deleting API key:', err);
      }
    }
  };

  // Handle copy API key
  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key)
      .then(() => {
        toast.success('API key copied to clipboard');
      })
      .catch(err => {
        toast.error('Could not copy API key');
        console.error('Could not copy text: ', err);
      });
  };

  // Toggle visibility of API key
  const toggleKeyVisibility = (keyId) => {
    setShowApiKey({...showApiKey, [keyId]: !showApiKey[keyId]});
  };

  // Filter API keys based on search term
  const filteredKeys = apiKeys.filter(key => 
    key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Key className="h-6 w-6 mr-2 text-blue-600" />
          <h1 className="text-2xl font-bold tracking-tight">API Management</h1>
        </div>
        <button 
          className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Create API Key
        </button>
      </div>
      
      {/* Search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input 
          type="text" 
          placeholder="Search API keys..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* API Keys table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Key</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredKeys.map((apiKey) => (
                <tr key={apiKey._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{apiKey.name}</div>
                    <div className="text-xs text-gray-500">{apiKey.permissions.join(', ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-500 font-mono">
                        {showApiKey[apiKey._id] 
                          ? apiKey.key 
                          : `${apiKey.key.substring(0, 8)}...${apiKey.key.substring(apiKey.key.length - 4)}`
                        }
                      </div>
                      <button 
                        onClick={() => toggleKeyVisibility(apiKey._id)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey[apiKey._id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button 
                        onClick={() => handleCopyKey(apiKey.key)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(apiKey.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {apiKey.lastUsed ? timeAgo(apiKey.lastUsed) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      apiKey.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {apiKey.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {apiKey.status === 'active' && (
                      <button 
                        onClick={() => handleRevokeKey(apiKey._id)}
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                      >
                        Revoke
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteKey(apiKey._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Empty state */}
        {filteredKeys.length === 0 && (
          <div className="text-center py-10">
            <Key className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? "Try adjusting your search to find what you're looking for."
                : 'Get started by creating a new API key.'}
            </p>
            <div className="mt-6">
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear search
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create API Key
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* API Documentation */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">API Documentation</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Learn how to use the Skillify API to integrate with your applications.
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-md font-medium text-gray-900">Base URL</h4>
              <div className="mt-1 bg-gray-50 p-2 rounded font-mono text-sm">
                https://api.skillify.com/v1
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900">Authentication</h4>
              <p className="mt-1 text-sm text-gray-500">
                All API requests must include your API key in the Authorization header.
              </p>
              <div className="mt-1 bg-gray-50 p-2 rounded font-mono text-sm">
                Authorization: Bearer YOUR_API_KEY
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900">Rate Limiting</h4>
              <p className="mt-1 text-sm text-gray-500">
                API requests are limited based on your plan. Current rate limits are displayed in the API key details.
              </p>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <a 
                href="/api-docs" 
                target="_blank" 
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                View full API documentation
                <svg className="ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Create API Key Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New API Key</h2>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="keyName" className="block text-sm font-medium text-gray-700">
                  Key Name
                </label>
                <input
                  type="text"
                  id="keyName"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g. Web Application"
                  value={newKey.name}
                  onChange={(e) => setNewKey({...newKey, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {availablePermissions.map((permission) => (
                    <div key={permission.value} className="flex items-center">
                      <input
                        id={permission.value}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={newKey.permissions.includes(permission.value)}
                        onChange={() => handlePermissionToggle(permission.value)}
                      />
                      <label htmlFor={permission.value} className="ml-2 block text-sm text-gray-900">
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label htmlFor="rateLimit" className="block text-sm font-medium text-gray-700">
                  Rate Limit (requests per minute)
                </label>
                <input
                  type="number"
                  id="rateLimit"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newKey.rateLimit}
                  onChange={(e) => setNewKey({...newKey, rateLimit: parseInt(e.target.value) || 0})}
                  min="1"
                  max="1000"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={!newKey.name || newKey.permissions.length === 0}
                className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  !newKey.name || newKey.permissions.length === 0
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Create API Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiManagement; 
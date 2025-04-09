import React, { useState, useEffect } from 'react';
import { Award, Search, Filter, RefreshCw, Plus, CheckCircle, XCircle, Loader, Eye, Edit2, Check, X, Trash2, Image, FileText, ExternalLinkIcon } from 'lucide-react';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';

const CertificateManagement = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view', 'edit', 'delete', 'approve', 'revoke'
  const [formData, setFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileViewerType, setFileViewerType] = useState(null); // 'image', 'pdf', 'url'
  const [isFileLoading, setIsFileLoading] = useState(false);
  
  useEffect(() => {
    fetchCertificates();
  }, []);
  
  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch certificates from MongoDB via API
      const response = await apiClient.get('/admin/certificates');
      
      if (response.data?.certificates) {
        // Transform data to match our UI needs
        const formattedCertificates = response.data.certificates.map(cert => ({
          id: cert._id || cert.id,
          title: cert.title,
          issuedTo: cert.user?.name || 'Unknown User',
          email: cert.user?.email || 'unknown@email.com',
          issueDate: new Date(cert.issueDate).toISOString().split('T')[0],
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : '-',
          status: getStatusFromDates(cert.issueDate, cert.expiryDate, cert.verificationStatus),
          issuer: cert.issuer,
          verified: cert.verificationStatus === 'verified',
          verificationStatus: cert.verificationStatus,
          verificationScore: cert.verificationScore,
          aiSuggestion: cert.aiSuggestion,
          // Add certificate file information
          certificateImage: cert.certificateImage || '',
          certificateFile: cert.certificateFile || '',
          credentialURL: cert.credentialURL || cert.credentialUrl || '',
          fileType: cert.fileType || 'none'
        }));
        
        setCertificates(formattedCertificates);
        console.log('Fetched certificates from MongoDB:', formattedCertificates);
      } else {
        setCertificates([]);
        setError('No certificates found');
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError('Failed to load certificates');
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to determine status based on dates
  const getStatusFromDates = (issueDate, expiryDate, verificationStatus) => {
    if (verificationStatus === 'pending') return 'pending';
    if (verificationStatus === 'rejected') return 'revoked';
    
    const now = new Date();
    const expiry = expiryDate ? new Date(expiryDate) : null;
    
    if (expiry && expiry < now) return 'expired';
    return 'active';
  };
  
  // Filter certificates based on status and search term
  const filteredCertificates = certificates.filter(cert => {
    const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;
    
    const matchesSearch = 
      cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.issuedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesStatus && matchesSearch;
  });
  
  // Action handlers
  const handleView = (cert) => {
    setSelectedCertificate(cert);
    setModalType('view');
    setModalOpen(true);
  };
  
  const handleEdit = (cert) => {
    setSelectedCertificate(cert);
    setFormData({
      title: cert.title,
      issuer: cert.issuer,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      status: cert.status,
    });
    setModalType('edit');
    setModalOpen(true);
  };
  
  const handleApprove = async (cert) => {
    try {
      setActionLoading(true);
      // In production, this would call the real API
      // await apiClient.put(`/admin/certificates/${cert.id}/verify`);
      
      // For demo purposes, update locally
      const updatedCertificates = certificates.map(c => 
        c.id === cert.id 
        ? { ...c, status: 'active', verified: true } 
        : c
      );
      setCertificates(updatedCertificates);
      
      toast.success(`Certificate ${cert.id} approved successfully`);
      
    } catch (error) {
      console.error('Error approving certificate:', error);
      toast.error('Failed to approve certificate');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleRevoke = async (cert) => {
    try {
      setActionLoading(true);
      // In production, this would call the real API
      // await apiClient.put(`/admin/certificates/${cert.id}/revoke`);
      
      // For demo purposes, update locally
      const updatedCertificates = certificates.map(c => 
        c.id === cert.id 
        ? { ...c, status: 'revoked', verified: false } 
        : c
      );
      setCertificates(updatedCertificates);
      
      toast.success(`Certificate ${cert.id} revoked successfully`);
      
    } catch (error) {
      console.error('Error revoking certificate:', error);
      toast.error('Failed to revoke certificate');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleDelete = async (cert) => {
    try {
      setActionLoading(true);
      // Call the admin API to delete the certificate
      await apiClient.delete(`/admin/certificates/${cert.id}`);
      
      // Update the UI after successful deletion
      const updatedCertificates = certificates.filter(c => c.id !== cert.id);
      setCertificates(updatedCertificates);
      
      toast.success(`Certificate ${cert.id} deleted successfully`);
      setModalOpen(false);
      
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast.error('Failed to delete certificate');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleSave = async () => {
    try {
      setActionLoading(true);
      // In production, this would call the real API
      // await apiClient.put(`/admin/certificates/${selectedCertificate.id}`, formData);
      
      // For demo purposes, update locally
      const updatedCertificates = certificates.map(c => 
        c.id === selectedCertificate.id 
        ? { ...c, ...formData } 
        : c
      );
      setCertificates(updatedCertificates);
      
      toast.success(`Certificate updated successfully`);
      setModalOpen(false);
      
    } catch (error) {
      console.error('Error updating certificate:', error);
      toast.error('Failed to update certificate');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Get appropriate badge color based on certificate status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'revoked': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // New function to handle viewing certificate files
  const handleViewCertificateFile = (fileType) => {
    setFileViewerType(fileType);
    setFileViewerOpen(true);
    if (fileType === 'pdf') {
      setIsFileLoading(true);
    }
  };
  
  // Helper function to extract file ID from URL
  const extractFileIdFromUrl = (url) => {
    try {
      if (!url) return '';
      
      // Handle Cloudinary raw URL format
      if (url.includes('/raw/upload/')) {
        const match = url.match(/\/raw\/upload\/(.+?)\/([^\/]+)$/);
        if (match && match[2]) {
          return match[2];
        }
      }
      
      // Handle regular Cloudinary image URL format
      if (url.includes('/image/upload/')) {
        const match = url.match(/\/[^\/]+\/upload\/[^\/]+\/([^\/]+)\.([^\.]+)$/);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      // Fallback to simple path extraction
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      // Remove any query parameters and file extension
      return filename.split('?')[0].split('.')[0];
    } catch (e) {
      console.error('Error extracting file ID from URL:', e);
      return '';
    }
  };
  
  // Helper function to get PDF view URL
  const getPdfViewUrl = (url) => {
    if (!url) return '';
    
    const fileId = extractFileIdFromUrl(url);
    
    // Get API base URL
    let apiBaseUrl = import.meta.env.VITE_API_URL || '';
    
    // If the URL doesn't contain 'http', assume it's relative and add the host
    if (!apiBaseUrl.startsWith('http')) {
      const port = import.meta.env.VITE_BACKEND_PORT || '4000';
      apiBaseUrl = `http://localhost:${port}${apiBaseUrl}`;
    }
    
    // Remove '/api' if it exists at the end of the URL
    if (apiBaseUrl.endsWith('/api')) {
      apiBaseUrl = apiBaseUrl.slice(0, -4);
    }
    
    // Build the final URL
    return `${apiBaseUrl}/api/certificates/download/${fileId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Award className="h-6 w-6 mr-2 text-blue-600" />
          <h1 className="text-2xl font-bold tracking-tight">Certificate Management</h1>
        </div>
        <button className="mt-2 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" />
          Add Certificate Template
        </button>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-grow">
          <input 
            type="text" 
            placeholder="Search by title, name, email, or ID"
            className="block w-full px-4 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <div className="relative">
            <select 
              className="block px-4 py-2 border border-gray-300 rounded-md appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Certificates</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          
          <button 
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={fetchCertificates}
            disabled={loading}
          >
            {loading ? (
              <Loader className="h-5 w-5 text-gray-500 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>
      
      {/* Loading and error states */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">Loading certificates...</span>
        </div>
      )}
      
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            className="text-sm underline mt-1"
            onClick={fetchCertificates}
          >
            Try again
          </button>
        </div>
      )}
      
      {/* Certificates table */}
      {!loading && !error && certificates.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
          <p className="text-lg font-medium">No certificates found</p>
          <p className="text-sm text-gray-500 mt-1">
            {searchTerm || filterStatus !== 'all' ? 
              'Try adjusting your search or filter criteria' : 
              'Create a new certificate to get started'}
          </p>
        </div>
      ) : !loading && !error && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cert.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{cert.title}</div>
                      <div className="text-xs text-gray-400">Issuer: {cert.issuer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{cert.issuedTo}</div>
                      <div className="text-xs">{cert.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cert.issueDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cert.expiryDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(cert.status)}`}>
                        {cert.status}
                      </span>
                      {cert.status === 'pending' && cert.verificationScore && (
                        <div className="mt-1 text-xs text-gray-500">
                          Score: {cert.verificationScore}%
                        </div>
                      )}
                      {cert.status === 'pending' && cert.aiSuggestion && (
                        <div className="mt-1">
                          <button 
                            className="text-xs text-blue-500 cursor-help"
                            title={cert.aiSuggestion}
                          >
                            AI Suggestion ℹ️
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cert.verified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => handleView(cert)}
                        disabled={actionLoading}
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View
                      </button>
                      <button 
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => handleEdit(cert)}
                        disabled={actionLoading}
                      >
                        <Edit2 className="h-4 w-4 inline mr-1" />
                        Edit
                      </button>
                      {cert.status === 'active' ? (
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleRevoke(cert)}
                          disabled={actionLoading}
                        >
                          <X className="h-4 w-4 inline mr-1" />
                          Revoke
                        </button>
                      ) : cert.status === 'pending' ? (
                        <button 
                          className="text-green-600 hover:text-green-900"
                          onClick={() => handleApprove(cert)}
                          disabled={actionLoading}
                        >
                          <Check className="h-4 w-4 inline mr-1" />
                          Approve
                        </button>
                      ) : (
                        <button 
                          className="text-gray-600 hover:text-gray-900"
                          onClick={() => {
                            setSelectedCertificate(cert);
                            setModalType('delete');
                            setModalOpen(true);
                          }}
                          disabled={actionLoading}
                        >
                          <Trash2 className="h-4 w-4 inline mr-1" />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredCertificates.length}</span> of <span className="font-medium">{filteredCertificates.length}</span> certificates
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for View/Edit/Delete */}
      {modalOpen && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {modalType === 'view' && 'Certificate Details'}
                {modalType === 'edit' && 'Edit Certificate'}
                {modalType === 'delete' && 'Confirm Deletion'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            {modalType === 'view' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Certificate ID</p>
                  <p className="font-medium">{selectedCertificate.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Title</p>
                  <p className="font-medium">{selectedCertificate.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Issuer</p>
                  <p className="font-medium">{selectedCertificate.issuer}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Issue Date</p>
                    <p className="font-medium">{selectedCertificate.issueDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expiry Date</p>
                    <p className="font-medium">{selectedCertificate.expiryDate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recipient</p>
                  <p className="font-medium">{selectedCertificate.issuedTo}</p>
                  <p className="text-sm text-gray-500">{selectedCertificate.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(selectedCertificate.status)}`}>
                    {selectedCertificate.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Verification</p>
                  <p className="font-medium flex items-center">
                    {selectedCertificate.verified ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500 mr-1" />
                        Not Verified
                      </>
                    )}
                  </p>
                </div>
                
                {/* Certificate file viewer section */}
                <div className="border-t pt-4 mt-2">
                  <p className="text-sm text-gray-500 mb-2">Certificate File</p>
                  <div className="flex flex-wrap gap-2">
                    {/* Show View Image button if certificate has an image */}
                    {selectedCertificate.certificateImage && (
                      <div>
                        <button 
                          onClick={() => handleViewCertificateFile('image')}
                          className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 text-sm rounded hover:bg-purple-100"
                        >
                          <Image className="h-4 w-4 mr-1.5" />
                          View Image
                        </button>
                      </div>
                    )}
                    
                    {/* Show View PDF button if certificate has a PDF */}
                    {selectedCertificate.certificateFile && (
                      <div>
                        <button 
                          onClick={() => handleViewCertificateFile('pdf')}
                          className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 text-sm rounded hover:bg-red-100"
                        >
                          <FileText className="h-4 w-4 mr-1.5" />
                          View PDF
                        </button>
                      </div>
                    )}
                    
                    {/* Show View Link button if certificate has a URL */}
                    {(selectedCertificate.credentialURL || selectedCertificate.credentialUrl) && (
                      <div>
                        <button 
                          onClick={() => handleViewCertificateFile('url')}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded hover:bg-blue-100"
                        >
                          <ExternalLinkIcon className="h-4 w-4 mr-1.5" />
                          View Link
                        </button>
                      </div>
                    )}
                    
                    {/* If no file is available */}
                    {!selectedCertificate.certificateImage && 
                     !selectedCertificate.certificateFile && 
                     !selectedCertificate.credentialURL && 
                     !selectedCertificate.credentialUrl && (
                      <p className="text-sm text-gray-500 italic">No certificate file available</p>
                    )}
                  </div>
                </div>
                
                {selectedCertificate.status === 'pending' && (
                  <>
                    {selectedCertificate.verificationScore && (
                      <div>
                        <p className="text-sm text-gray-500">AI Verification Score</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                          <div 
                            className={`h-2.5 rounded-full ${
                              selectedCertificate.verificationScore >= 80 ? 'bg-green-500' : 
                              selectedCertificate.verificationScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} 
                            style={{ width: `${selectedCertificate.verificationScore}%` }}
                          ></div>
                        </div>
                        <p className="text-sm mt-1">{selectedCertificate.verificationScore}%</p>
                      </div>
                    )}
                    {selectedCertificate.aiSuggestion && (
                      <div>
                        <p className="text-sm text-gray-500">AI Analysis</p>
                        <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          {selectedCertificate.aiSuggestion}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {modalType === 'edit' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleFormChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="issuer" className="block text-sm font-medium text-gray-700">Issuer</label>
                  <input
                    type="text"
                    id="issuer"
                    name="issuer"
                    value={formData.issuer || ''}
                    onChange={handleFormChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">Issue Date</label>
                    <input
                      type="date"
                      id="issueDate"
                      name="issueDate"
                      value={formData.issueDate || ''}
                      onChange={handleFormChange}
                      className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">Expiry Date</label>
                    <input
                      type="date"
                      id="expiryDate"
                      name="expiryDate"
                      value={formData.expiryDate || ''}
                      onChange={handleFormChange}
                      className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status || ''}
                    onChange={handleFormChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>
              </div>
            )}
            
            {modalType === 'delete' && (
              <div className="text-center space-y-4">
                <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                <p className="text-lg font-medium">Are you sure you want to delete this certificate?</p>
                <p className="text-sm text-gray-500">
                  This action cannot be undone. The certificate {selectedCertificate.title} for {selectedCertificate.issuedTo} will be permanently removed.
                </p>
              </div>
            )}
            
            {/* Modal Footer */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                disabled={actionLoading}
              >
                Cancel
              </button>
              
              {modalType === 'edit' && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
              
              {modalType === 'delete' && (
                <button
                  onClick={() => handleDelete(selectedCertificate)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Deleting...' : 'Delete Certificate'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* File viewer modal */}
      {fileViewerOpen && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-2 w-full max-w-4xl h-[80vh] mx-4 flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-2 px-4 py-2 border-b">
              <h3 className="text-lg font-medium">
                {fileViewerType === 'image' && 'Certificate Image'}
                {fileViewerType === 'pdf' && 'Certificate PDF'}
                {fileViewerType === 'url' && 'Certificate Link'}
              </h3>
              <button 
                onClick={() => {
                  setFileViewerOpen(false);
                  setFileViewerType(null);
                  setIsFileLoading(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-auto">
              {fileViewerType === 'image' && selectedCertificate.certificateImage && (
                <div className="flex justify-center items-center h-full">
                  <img 
                    src={selectedCertificate.certificateImage} 
                    alt={selectedCertificate.title} 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              
              {fileViewerType === 'pdf' && selectedCertificate.certificateFile && (
                <div className="h-full relative">
                  {isFileLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-70 z-10">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-500">Loading PDF...</p>
                      </div>
                    </div>
                  )}
                  <iframe 
                    src={getPdfViewUrl(selectedCertificate.certificateFile)} 
                    className="w-full h-full" 
                    title={selectedCertificate.title} 
                    onError={(e) => {
                      console.error('PDF iframe loading error:', e);
                      setIsFileLoading(false);
                    }}
                    onLoad={() => {
                      setIsFileLoading(false);
                    }}
                  />
                </div>
              )}
              
              {fileViewerType === 'url' && (selectedCertificate.credentialURL || selectedCertificate.credentialUrl) && (
                <div className="h-full flex flex-col items-center justify-center">
                  <p className="text-xl mb-4">
                    External Certificate Link
                  </p>
                  <a 
                    href={selectedCertificate.credentialURL || selectedCertificate.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center"
                  >
                    <ExternalLinkIcon className="h-5 w-5 mr-2" />
                    Open Certificate Link
                  </a>
                  <p className="mt-4 text-sm text-gray-500 max-w-md text-center">
                    {selectedCertificate.credentialURL || selectedCertificate.credentialUrl}
                  </p>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="mt-2 border-t pt-2 px-4 flex justify-end">
              <button
                onClick={() => {
                  setFileViewerOpen(false);
                  setFileViewerType(null);
                  setIsFileLoading(false);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                Close
              </button>
              
              {fileViewerType === 'image' && selectedCertificate.certificateImage && (
                <a 
                  href={selectedCertificate.certificateImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center"
                >
                  <ExternalLinkIcon className="h-4 w-4 mr-1" />
                  Open in New Tab
                </a>
              )}
              
              {fileViewerType === 'pdf' && selectedCertificate.certificateFile && (
                <a 
                  href={getPdfViewUrl(selectedCertificate.certificateFile)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center"
                >
                  <ExternalLinkIcon className="h-4 w-4 mr-1" />
                  Open in New Tab
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateManagement; 
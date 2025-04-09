import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Plus, Edit, Trash, Eye, Save } from 'lucide-react';
import { getContent, createContent, updateContent, deleteContent } from '@/lib/adminApi';
import { toast } from 'sonner';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('pages');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [currentContent, setCurrentContent] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch content on component mount and when activeTab changes
  useEffect(() => {
    fetchContent();
  }, [activeTab]);
  
  // Function to fetch content based on active tab
  const fetchContent = async () => {
    try {
      setLoading(true);
      const contentType = activeTab === 'pages' ? 'page' : 
                         activeTab === 'faqs' ? 'faq' : 'announcement';
      
      const data = await getContent(contentType);
      setContents(data);
      setError(null);
    } catch (err) {
      setError(`Failed to load ${activeTab}`);
      console.error(`Error fetching ${activeTab}:`, err);
    } finally {
      setLoading(false);
    }
  };
  
  // Determine which content to display based on filters
  const getFilteredContent = () => {
    return contents.filter(item => {
      const matchesSearch = 
        (item.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.question?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  };
  
  const handleEdit = (item) => {
    setCurrentContent(item);
    setShowEditor(true);
  };
  
  const handleSave = async () => {
    try {
      const formElement = document.querySelector('form');
      const formData = new FormData(formElement);
      
      // Convert FormData to plain object
      const contentData = {};
      formData.forEach((value, key) => {
        contentData[key] = value;
      });
      
      // Add content type
      contentData.contentType = activeTab === 'pages' ? 'page' : 
                              activeTab === 'faqs' ? 'faq' : 'announcement';
      
      let savedContent;
      
      if (currentContent._id) {
        // Update existing content
        savedContent = await updateContent(currentContent._id, contentData);
        
        // Update local state
        setContents(contents.map(item => 
          item._id === savedContent._id ? savedContent : item
        ));
        
        toast.success(`${activeTab.slice(0, -1)} updated successfully`);
      } else {
        // Create new content
        savedContent = await createContent(contentData);
        
        // Add to local state
        setContents([...contents, savedContent]);
        
        toast.success(`${activeTab.slice(0, -1)} created successfully`);
      }
      
      setShowEditor(false);
      setCurrentContent(null);
    } catch (err) {
      toast.error(`Failed to save ${activeTab.slice(0, -1)}`);
      console.error('Error saving content:', err);
    }
  };
  
  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) {
      try {
        await deleteContent(id);
        
        // Remove from local state
        setContents(contents.filter(item => item._id !== id));
        
        toast.success(`${activeTab.slice(0, -1)} deleted successfully`);
      } catch (err) {
        toast.error(`Failed to delete ${activeTab.slice(0, -1)}`);
        console.error('Error deleting content:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="h-6 w-6 mr-2 text-blue-600" />
          <h1 className="text-2xl font-bold tracking-tight">Content Management</h1>
        </div>
        <button 
          className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          onClick={() => {
            setCurrentContent({});
            setShowEditor(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add New {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
        </button>
      </div>
      
      {/* Tabs navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['pages', 'faqs', 'announcements'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Display loading or error state */}
      {loading && <div className="text-center py-10">Loading...</div>}
      {error && <div className="text-center py-10 text-red-500">{error}</div>}
      
      {/* Content list with search and filter */}
      {!loading && !error && !showEditor && (
        <>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select 
                className="block pl-10 pr-10 py-2 border border-gray-300 rounded-md appearance-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          
          {/* Content table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {activeTab === 'faqs' ? 'Question' : 'Title'}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                    {activeTab === 'announcements' && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    )}
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredContent().map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.title || item.question}</div>
                        <div className="text-xs text-gray-500">{item._id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.author?.name || 'Admin'}
                      </td>
                      {activeTab === 'announcements' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.expiry ? new Date(item.expiry).toLocaleDateString() : 'No expiry'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => window.open(`/preview/${item._id}`, '_blank')}
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDelete(item._id)}
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Empty state */}
            {getFilteredContent().length === 0 && (
              <div className="text-center py-10">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab} found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterStatus !== 'all' 
                    ? "Try adjusting your search or filter to find what you're looking for."
                    : `Get started by creating a new ${activeTab.slice(0, -1)}.`}
                </p>
                <div className="mt-6">
                  {searchTerm || filterStatus !== 'all' ? (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Clear filters
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCurrentContent({});
                        setShowEditor(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      New {activeTab.slice(0, -1)}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Content editor */}
      {showEditor && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <form>
            <div className="p-6 space-y-6">
              <div className="border-b border-gray-200 pb-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {currentContent._id ? 'Edit' : 'Create'} {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
                </h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    {activeTab === 'faqs' ? 'Question' : 'Title'}
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name={activeTab === 'faqs' ? 'question' : 'title'}
                      id={activeTab === 'faqs' ? 'question' : 'title'}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder={activeTab === 'faqs' ? 'Enter question here' : 'Enter title here'}
                      defaultValue={currentContent.title || currentContent.question || ''}
                      required
                    />
                  </div>
                </div>
                
                {activeTab === 'faqs' && (
                  <div>
                    <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
                      Answer
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="answer"
                        name="answer"
                        rows={4}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Enter answer here"
                        defaultValue={currentContent.answer || ""}
                        required
                      />
                    </div>
                  </div>
                )}
                
                {(activeTab === 'pages' || activeTab === 'announcements') && (
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="content"
                        name="content"
                        rows={8}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Enter content here"
                        defaultValue={currentContent.content || ""}
                        required
                      />
                    </div>
                  </div>
                )}
                
                {activeTab === 'announcements' && (
                  <div>
                    <label htmlFor="expiry" className="block text-sm font-medium text-gray-700">
                      Expiry Date
                    </label>
                    <div className="mt-1">
                      <input
                        type="date"
                        name="expiry"
                        id="expiry"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        defaultValue={currentContent.expiry ? new Date(currentContent.expiry).toISOString().split('T')[0] : ''}
                        required={activeTab === 'announcements'}
                      />
                    </div>
                  </div>
                )}
                
                {activeTab === 'pages' && (
                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                      Slug (URL path)
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="slug"
                        id="slug"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g. about-us"
                        defaultValue={currentContent.slug || ""}
                        required={activeTab === 'pages'}
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    defaultValue={currentContent.status || 'draft'}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Editor actions */}
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  setShowEditor(false);
                  setCurrentContent(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ContentManagement; 
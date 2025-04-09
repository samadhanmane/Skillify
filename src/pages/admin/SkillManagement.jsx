import React, { useState } from 'react';
import { Sparkles, Search, Filter, RefreshCw, Plus, Edit, Trash } from 'lucide-react';

const SkillManagement = () => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data - in a real app this would come from an API
  const skills = [
    { 
      id: 'SKILL-001', 
      name: 'JavaScript', 
      category: 'Programming', 
      description: 'JavaScript is a programming language that conforms to the ECMAScript specification.',
      userCount: 156,
      verified: true,
      createdAt: '2023-01-15',
      icon: '💻'
    },
    { 
      id: 'SKILL-002', 
      name: 'React', 
      category: 'Frontend', 
      description: 'React is a free and open-source front-end JavaScript library for building user interfaces.',
      userCount: 124,
      verified: true,
      createdAt: '2023-01-20',
      icon: '⚛️'
    },
    { 
      id: 'SKILL-003', 
      name: 'Node.js', 
      category: 'Backend', 
      description: 'Node.js is an open-source, cross-platform, back-end JavaScript runtime environment.',
      userCount: 98,
      verified: true,
      createdAt: '2023-01-25',
      icon: '🚀'
    },
    { 
      id: 'SKILL-004', 
      name: 'MongoDB', 
      category: 'Database', 
      description: 'MongoDB is a source-available cross-platform document-oriented database program.',
      userCount: 87,
      verified: true,
      createdAt: '2023-02-01',
      icon: '🗃️'
    },
    { 
      id: 'SKILL-005', 
      name: 'AWS', 
      category: 'Cloud', 
      description: 'Amazon Web Services offers reliable, scalable, and inexpensive cloud computing services.',
      userCount: 76,
      verified: false,
      createdAt: '2023-02-05',
      icon: '☁️'
    },
    { 
      id: 'SKILL-006', 
      name: 'UI/UX Design', 
      category: 'Design', 
      description: 'Design of user interfaces for machines and software with focus on maximizing usability.',
      userCount: 65,
      verified: true,
      createdAt: '2023-02-10',
      icon: '🎨'
    },
    { 
      id: 'SKILL-007', 
      name: 'Git', 
      category: 'DevOps', 
      description: 'Git is a distributed version-control system for tracking changes in source code.',
      userCount: 140,
      verified: true,
      createdAt: '2023-02-15',
      icon: '🔄'
    }
  ];
  
  // Get unique categories for filter
  const categories = ['all', ...new Set(skills.map(skill => skill.category))];
  
  // Filter skills based on category and search term
  const filteredSkills = skills.filter(skill => {
    const matchesCategory = filterCategory === 'all' || skill.category === filterCategory;
    
    const matchesSearch = 
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Sparkles className="h-6 w-6 mr-2 text-blue-600" />
          <h1 className="text-2xl font-bold tracking-tight">Skill Management</h1>
        </div>
        <button className="mt-2 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" />
          Add New Skill
        </button>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search skills by name or description"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select 
              className="block pl-10 pr-10 py-2 border border-gray-300 rounded-md appearance-none"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <RefreshCw className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>
      
      {/* Skills grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map((skill) => (
          <div key={skill.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{skill.icon}</span>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{skill.name}</h3>
                    <p className="text-sm text-gray-500">{skill.category}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="text-gray-400 hover:text-blue-500">
                    <Edit className="h-5 w-5" />
                  </button>
                  <button className="text-gray-400 hover:text-red-500">
                    <Trash className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{skill.description}</p>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {skill.userCount} users
                  </span>
                  {skill.verified && (
                    <span className="ml-2 flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">Added: {skill.createdAt}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button className="text-sm text-blue-600 hover:text-blue-800">View Details</button>
                {!skill.verified && (
                  <button className="text-sm text-green-600 hover:text-green-800">Verify</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty state if no skills match filter */}
      {filteredSkills.length === 0 && (
        <div className="text-center py-10 bg-white shadow rounded-lg">
          <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No skills found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you{"'"}re looking for.</p>
          <div className="mt-6">
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
              }}
            >
              Clear filters
            </button>
          </div>
        </div>
      )}
      
      {/* Pagination for larger datasets */}
      {filteredSkills.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 sm:px-6 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredSkills.length}</span> of <span className="font-medium">{filteredSkills.length}</span> skills
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
      )}
    </div>
  );
};

export default SkillManagement; 
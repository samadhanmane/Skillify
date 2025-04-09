
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const Dashboard = () => {
  // Mock data for demonstration
  const recentSkills = [
    { id: 1, name: 'React', level: 'Advanced', category: 'Frontend' },
    { id: 2, name: 'Node.js', level: 'Intermediate', category: 'Backend' },
    { id: 3, name: 'Python', level: 'Beginner', category: 'Programming' },
  ];

  const recentCertificates = [
    { id: 1, name: 'AWS Certified Solutions Architect', issuer: 'Amazon', date: '2023-05-15' },
    { id: 2, name: 'React Developer Certification', issuer: 'Meta', date: '2023-03-22' },
    { id: 3, name: 'Fullstack JavaScript', issuer: 'Udemy', date: '2023-01-10' },
  ];

  // Simple chart using HTML/CSS
  const skillCategories = [
    { name: 'Frontend', count: 5 },
    { name: 'Backend', count: 3 },
    { name: 'Database', count: 2 },
    { name: 'DevOps', count: 1 },
  ];

  const maxCount = Math.max(...skillCategories.map(c => c.count));

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted">Track your skills and certifications</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Link to="/skills/add" className="btn btn-primary">
              Add Skill
            </Link>
            <Link to="/certificates/add" className="btn btn-outline">
              Add Certificate
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Skills Overview */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Skills Overview</h2>
              <Link to="/skills" className="text-sm text-primary">View All</Link>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Skills by Category</h3>
              <div className="space-y-3">
                {skillCategories.map((category) => (
                  <div key={category.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{category.name}</span>
                      <span className="text-muted">{category.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full" 
                        style={{
                          width: `${(category.count / maxCount) * 100}%`,
                          backgroundColor: 'var(--primary-color)'
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-2">Recent Skills</h3>
            <div className="space-y-3">
              {recentSkills.map((skill) => (
                <div key={skill.id} className="p-3 border rounded-lg flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{skill.name}</h4>
                    <div className="text-sm text-muted">{skill.category}</div>
                  </div>
                  <span className="badge badge-primary">{skill.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certificates Overview */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Certificates</h2>
              <Link to="/certificates" className="text-sm text-primary">View All</Link>
            </div>
            
            <div className="space-y-4">
              {recentCertificates.map((cert) => (
                <div key={cert.id} className="p-4 border rounded-lg">
                  <h4 className="font-medium">{cert.name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted">Issued by {cert.issuer}</span>
                    <span className="text-sm badge badge-success">
                      {formatDate(cert.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Completion */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Completion</h2>
          <div className="w-full bg-gray-100 rounded-full h-4 mb-4">
            <div 
              className="h-4 rounded-full" 
              style={{
                width: '75%',
                backgroundColor: 'var(--success-color)'
              }}
            ></div>
          </div>
          <div className="flex justify-between text-sm">
            <span>75% Complete</span>
            <Link to="/profile" className="text-primary">Complete Profile</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success-color)' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Basic Information</span>
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success-color)' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Skills Added</span>
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success-color)' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Certificates Added</span>
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted-color)' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span>Profile Picture</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

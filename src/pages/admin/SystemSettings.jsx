import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    securitySettings: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      },
      accountLockout: {
        maxAttempts: 5,
        lockoutDuration: 30,
      },
      sessionTimeout: 60,
      allowedIPs: []
    },
    emailSettings: {
      smtpServer: 'smtp.example.com',
      smtpPort: 587,
      smtpUsername: 'notifications@skillify.com',
      smtpPassword: '********',
      senderEmail: 'notifications@skillify.com',
      senderName: 'Skillify Credentials Hub',
      enableSSL: true
    },
    apiSettings: {
      rateLimit: 100,
      tokenExpiration: 1440 // 24 hours in minutes
    },
    systemNotifications: {
      emailAdminsOnError: true,
      emailUsersOnVerification: true,
      emailUsersOnPasswordReset: true
    }
  });

  const [activeTab, setActiveTab] = useState('security');

  const handleChange = (section, subsection, field, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        ...(subsection 
          ? {
              [subsection]: {
                ...prevSettings[section][subsection],
                [field]: value
              }
            }
          : { [field]: value }
        )
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, this would save settings to the server
    alert('Settings saved!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Settings className="h-6 w-6 mr-2 text-blue-600" />
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
      </div>
      
      {/* Tabs navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['security', 'email', 'api', 'notifications'].map((tab) => (
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
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Security Settings Tab */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="bg-white p-6 shadow rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Password Policy</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Length</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={settings.securitySettings.passwordPolicy.minLength}
                    onChange={(e) => handleChange('securitySettings', 'passwordPolicy', 'minLength', parseInt(e.target.value))}
                    min="6"
                    max="24"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    id="requireUppercase"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={settings.securitySettings.passwordPolicy.requireUppercase}
                    onChange={(e) => handleChange('securitySettings', 'passwordPolicy', 'requireUppercase', e.target.checked)}
                  />
                  <label htmlFor="requireUppercase" className="ml-2 block text-sm text-gray-900">
                    Require Uppercase Letters
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="requireLowercase"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={settings.securitySettings.passwordPolicy.requireLowercase}
                    onChange={(e) => handleChange('securitySettings', 'passwordPolicy', 'requireLowercase', e.target.checked)}
                  />
                  <label htmlFor="requireLowercase" className="ml-2 block text-sm text-gray-900">
                    Require Lowercase Letters
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="requireNumbers"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={settings.securitySettings.passwordPolicy.requireNumbers}
                    onChange={(e) => handleChange('securitySettings', 'passwordPolicy', 'requireNumbers', e.target.checked)}
                  />
                  <label htmlFor="requireNumbers" className="ml-2 block text-sm text-gray-900">
                    Require Numbers
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="requireSpecialChars"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={settings.securitySettings.passwordPolicy.requireSpecialChars}
                    onChange={(e) => handleChange('securitySettings', 'passwordPolicy', 'requireSpecialChars', e.target.checked)}
                  />
                  <label htmlFor="requireSpecialChars" className="ml-2 block text-sm text-gray-900">
                    Require Special Characters
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 shadow rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Account Lockout</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Maximum Failed Attempts</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={settings.securitySettings.accountLockout.maxAttempts}
                    onChange={(e) => handleChange('securitySettings', 'accountLockout', 'maxAttempts', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lockout Duration (minutes)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={settings.securitySettings.accountLockout.lockoutDuration}
                    onChange={(e) => handleChange('securitySettings', 'accountLockout', 'lockoutDuration', parseInt(e.target.value))}
                    min="5"
                    max="1440"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 shadow rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Session Management</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                <input
                  type="number"
                  className="mt-1 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={settings.securitySettings.sessionTimeout}
                  onChange={(e) => handleChange('securitySettings', null, 'sessionTimeout', parseInt(e.target.value))}
                  min="5"
                  max="1440"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Email Settings Tab */}
        {activeTab === 'email' && (
          <div className="bg-white p-6 shadow rounded-lg space-y-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Email Configuration</h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Server</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={settings.emailSettings.smtpServer}
                  onChange={(e) => handleChange('emailSettings', null, 'smtpServer', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={settings.emailSettings.smtpPort}
                  onChange={(e) => handleChange('emailSettings', null, 'smtpPort', parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Username</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={settings.emailSettings.smtpUsername}
                  onChange={(e) => handleChange('emailSettings', null, 'smtpUsername', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Password</label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={settings.emailSettings.smtpPassword}
                  onChange={(e) => handleChange('emailSettings', null, 'smtpPassword', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Sender Email</label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={settings.emailSettings.senderEmail}
                  onChange={(e) => handleChange('emailSettings', null, 'senderEmail', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Sender Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={settings.emailSettings.senderName}
                  onChange={(e) => handleChange('emailSettings', null, 'senderName', e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                id="enableSSL"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={settings.emailSettings.enableSSL}
                onChange={(e) => handleChange('emailSettings', null, 'enableSSL', e.target.checked)}
              />
              <label htmlFor="enableSSL" className="ml-2 block text-sm text-gray-900">
                Enable SSL/TLS
              </label>
            </div>
            
            <div className="pt-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Test Email Connection
              </button>
            </div>
          </div>
        )}
        
        {/* API Settings Tab */}
        {activeTab === 'api' && (
          <div className="bg-white p-6 shadow rounded-lg space-y-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rate Limit (requests per minute)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={settings.apiSettings.rateLimit}
                  onChange={(e) => handleChange('apiSettings', null, 'rateLimit', parseInt(e.target.value))}
                  min="10"
                  max="1000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Token Expiration (minutes)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={settings.apiSettings.tokenExpiration}
                  onChange={(e) => handleChange('apiSettings', null, 'tokenExpiration', parseInt(e.target.value))}
                  min="5"
                  max="10080"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {Math.floor(settings.apiSettings.tokenExpiration / 60)} hours {settings.apiSettings.tokenExpiration % 60} minutes
                </p>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Regenerate API Keys
              </button>
            </div>
          </div>
        )}
        
        {/* Notifications Settings Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white p-6 shadow rounded-lg space-y-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">System Notifications</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="emailAdminsOnError"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={settings.systemNotifications.emailAdminsOnError}
                  onChange={(e) => handleChange('systemNotifications', null, 'emailAdminsOnError', e.target.checked)}
                />
                <label htmlFor="emailAdminsOnError" className="ml-2 block text-sm text-gray-900">
                  Email administrators when system errors occur
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="emailUsersOnVerification"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={settings.systemNotifications.emailUsersOnVerification}
                  onChange={(e) => handleChange('systemNotifications', null, 'emailUsersOnVerification', e.target.checked)}
                />
                <label htmlFor="emailUsersOnVerification" className="ml-2 block text-sm text-gray-900">
                  Email users when certificates are verified
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="emailUsersOnPasswordReset"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={settings.systemNotifications.emailUsersOnPasswordReset}
                  onChange={(e) => handleChange('systemNotifications', null, 'emailUsersOnPasswordReset', e.target.checked)}
                />
                <label htmlFor="emailUsersOnPasswordReset" className="ml-2 block text-sm text-gray-900">
                  Email users when password is reset
                </label>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings; 
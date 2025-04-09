import React, { useState } from 'react';
import { CheckCircle, Save, RefreshCw, HelpCircle } from 'lucide-react';

const VerificationSettings = () => {
  const [settings, setSettings] = useState({
    verification: {
      autoVerification: true,
      verificationThreshold: 80, // percentage match required for auto verification
      requireImages: true,
      allowedFileTypes: ['pdf', 'jpg', 'png'],
      maxFileSize: 5, // in MB
    },
    expiration: {
      enforceExpiration: true,
      notifyBeforeExpiration: true,
      notificationDays: 30, // notify days before expiration
      allowRenewal: true,
      gracePeriod: 15, // days after expiration for renewal
    },
    blockchain: {
      enableBlockchain: false,
      blockchain: 'ethereum',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      apiKey: '********',
    },
    notifications: {
      emailOnVerification: true,
      emailOnRejection: true,
      emailOnExpiration: true,
    }
  });

  const [activeTab, setActiveTab] = useState('verification');

  const handleChange = (section, field, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        [field]: value
      }
    }));
  };

  const handleArrayChange = (section, field, value, checked) => {
    setSettings(prevSettings => {
      const currentArray = [...prevSettings[section][field]];
      
      if (checked) {
        // Add to array if checked and not already included
        if (!currentArray.includes(value)) {
          currentArray.push(value);
        }
      } else {
        // Remove from array if unchecked
        const index = currentArray.indexOf(value);
        if (index > -1) {
          currentArray.splice(index, 1);
        }
      }
      
      return {
        ...prevSettings,
        [section]: {
          ...prevSettings[section],
          [field]: currentArray
        }
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, this would save settings to the server
    alert('Verification settings saved!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <CheckCircle className="h-6 w-6 mr-2 text-blue-600" />
        <h1 className="text-2xl font-bold tracking-tight">Verification Settings</h1>
      </div>
      
      {/* Tabs navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['verification', 'expiration', 'blockchain', 'notifications'].map((tab) => (
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
        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div className="bg-white p-6 shadow rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Certificate Verification</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="autoVerification"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={settings.verification.autoVerification}
                      onChange={(e) => handleChange('verification', 'autoVerification', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="autoVerification" className="font-medium text-gray-700">Enable automatic verification</label>
                    <p className="text-gray-500">System will automatically verify certificates when they meet the threshold criteria</p>
                  </div>
                </div>
                
                {settings.verification.autoVerification && (
                  <div>
                    <label htmlFor="verificationThreshold" className="block text-sm font-medium text-gray-700">
                      Verification Threshold ({settings.verification.verificationThreshold}%)
                    </label>
                    <div className="mt-1 flex items-center">
                      <input
                        id="verificationThreshold"
                        type="range"
                        min="50"
                        max="100"
                        step="5"
                        className="block w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={settings.verification.verificationThreshold}
                        onChange={(e) => handleChange('verification', 'verificationThreshold', parseInt(e.target.value))}
                      />
                      <span className="ml-2 text-sm text-gray-500 w-10">{settings.verification.verificationThreshold}%</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Minimum percentage match required for automatic verification</p>
                  </div>
                )}
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="requireImages"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={settings.verification.requireImages}
                      onChange={(e) => handleChange('verification', 'requireImages', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="requireImages" className="font-medium text-gray-700">Require certificate images</label>
                    <p className="text-gray-500">Users must upload an image of their certificate for verification</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Allowed File Types</label>
                  <div className="mt-2 space-y-2">
                    {['pdf', 'jpg', 'png', 'gif', 'tiff'].map((type) => (
                      <div key={type} className="flex items-center">
                        <input
                          id={`filetype-${type}`}
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={settings.verification.allowedFileTypes.includes(type)}
                          onChange={(e) => handleArrayChange('verification', 'allowedFileTypes', type, e.target.checked)}
                        />
                        <label htmlFor={`filetype-${type}`} className="ml-3 text-sm text-gray-700">.{type}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="maxFileSize" className="block text-sm font-medium text-gray-700">
                    Maximum File Size (MB)
                  </label>
                  <div className="mt-1">
                    <input
                      id="maxFileSize"
                      type="number"
                      className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={settings.verification.maxFileSize}
                      onChange={(e) => handleChange('verification', 'maxFileSize', parseInt(e.target.value))}
                      min="1"
                      max="20"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Maximum file size for certificate uploads</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Expiration Tab */}
        {activeTab === 'expiration' && (
          <div className="space-y-6">
            <div className="bg-white p-6 shadow rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Certificate Expiration</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="enforceExpiration"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={settings.expiration.enforceExpiration}
                      onChange={(e) => handleChange('expiration', 'enforceExpiration', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="enforceExpiration" className="font-medium text-gray-700">Enforce certificate expiration</label>
                    <p className="text-gray-500">Certificates will be marked as expired after their expiration date</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notifyBeforeExpiration"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={settings.expiration.notifyBeforeExpiration}
                      onChange={(e) => handleChange('expiration', 'notifyBeforeExpiration', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="notifyBeforeExpiration" className="font-medium text-gray-700">Send expiration notifications</label>
                    <p className="text-gray-500">Notify users before their certificates expire</p>
                  </div>
                </div>
                
                {settings.expiration.notifyBeforeExpiration && (
                  <div>
                    <label htmlFor="notificationDays" className="block text-sm font-medium text-gray-700">
                      Notification Days Before Expiration
                    </label>
                    <div className="mt-1">
                      <input
                        id="notificationDays"
                        type="number"
                        className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={settings.expiration.notificationDays}
                        onChange={(e) => handleChange('expiration', 'notificationDays', parseInt(e.target.value))}
                        min="1"
                        max="90"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">How many days before expiration to send notifications</p>
                  </div>
                )}
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="allowRenewal"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={settings.expiration.allowRenewal}
                      onChange={(e) => handleChange('expiration', 'allowRenewal', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="allowRenewal" className="font-medium text-gray-700">Allow certificate renewal</label>
                    <p className="text-gray-500">Users can renew expired certificates within the grace period</p>
                  </div>
                </div>
                
                {settings.expiration.allowRenewal && (
                  <div>
                    <label htmlFor="gracePeriod" className="block text-sm font-medium text-gray-700">
                      Renewal Grace Period (days)
                    </label>
                    <div className="mt-1">
                      <input
                        id="gracePeriod"
                        type="number"
                        className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={settings.expiration.gracePeriod}
                        onChange={(e) => handleChange('expiration', 'gracePeriod', parseInt(e.target.value))}
                        min="0"
                        max="90"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">How many days after expiration users can still renew</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Blockchain Tab */}
        {activeTab === 'blockchain' && (
          <div className="space-y-6">
            <div className="bg-white p-6 shadow rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-medium text-gray-900">Blockchain Verification</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Beta Feature
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="enableBlockchain"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={settings.blockchain.enableBlockchain}
                      onChange={(e) => handleChange('blockchain', 'enableBlockchain', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="enableBlockchain" className="font-medium text-gray-700">Enable blockchain verification</label>
                    <p className="text-gray-500">Store certificate verification records on the blockchain</p>
                  </div>
                </div>
                
                {settings.blockchain.enableBlockchain && (
                  <>
                    <div>
                      <label htmlFor="blockchain" className="block text-sm font-medium text-gray-700">
                        Blockchain Network
                      </label>
                      <select
                        id="blockchain"
                        className="mt-1 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={settings.blockchain.blockchain}
                        onChange={(e) => handleChange('blockchain', 'blockchain', e.target.value)}
                      >
                        <option value="ethereum">Ethereum</option>
                        <option value="polygon">Polygon</option>
                        <option value="solana">Solana</option>
                        <option value="arbitrum">Arbitrum</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="contractAddress" className="block text-sm font-medium text-gray-700">
                        Smart Contract Address
                      </label>
                      <div className="mt-1">
                        <input
                          id="contractAddress"
                          type="text"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={settings.blockchain.contractAddress}
                          onChange={(e) => handleChange('blockchain', 'contractAddress', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                        Blockchain API Key
                      </label>
                      <div className="mt-1">
                        <input
                          id="apiKey"
                          type="password"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={settings.blockchain.apiKey}
                          onChange={(e) => handleChange('blockchain', 'apiKey', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-4">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Test Connection
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Documentation
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white p-6 shadow rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="emailOnVerification"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={settings.notifications.emailOnVerification}
                      onChange={(e) => handleChange('notifications', 'emailOnVerification', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="emailOnVerification" className="font-medium text-gray-700">Email on verification</label>
                    <p className="text-gray-500">Send email to users when their certificates are verified</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="emailOnRejection"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={settings.notifications.emailOnRejection}
                      onChange={(e) => handleChange('notifications', 'emailOnRejection', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="emailOnRejection" className="font-medium text-gray-700">Email on rejection</label>
                    <p className="text-gray-500">Send email to users when their certificates are rejected</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="emailOnExpiration"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={settings.notifications.emailOnExpiration}
                      onChange={(e) => handleChange('notifications', 'emailOnExpiration', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="emailOnExpiration" className="font-medium text-gray-700">Email on expiration</label>
                    <p className="text-gray-500">Send email to users when their certificates expire</p>
                  </div>
                </div>
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

export default VerificationSettings; 
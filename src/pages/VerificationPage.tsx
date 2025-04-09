import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdvancedVerification from '@/components/certificates/AdvancedVerification';

const VerificationPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Certificate Verification</h1>
        <p className="text-center text-gray-600 mb-8">
          Verify the authenticity of certificates using our advanced AI-powered system
        </p>
        
        <AdvancedVerification />
        
        <div className="text-center mt-8">
          <button 
            onClick={() => navigate('/')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage; 
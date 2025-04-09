import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const SimpleAdminTest: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Admin Test Page</h1>
      
      <div className="bg-green-100 p-4 rounded-lg mb-4">
        <p>If you can see this page, you have admin access!</p>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">User Details:</h2>
        <pre className="bg-white p-2 rounded overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default SimpleAdminTest; 
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/axios';

const AuthDebugPage = () => {
  const { isAuthenticated, user, login, logout } = useAuth();
  const [testResult, setTestResult] = useState<string>('No tests run yet');
  const [isLoading, setIsLoading] = useState(false);

  const testAuth = async () => {
    setIsLoading(true);
    setTestResult('Testing authentication...');
    
    try {
      // Test auth/me endpoint
      const response = await apiClient.get('/auth/me');
      setTestResult(`Auth test successful!\n${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      setTestResult(`Auth test failed!\n${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testUserProfile = async () => {
    setIsLoading(true);
    setTestResult('Testing user profile endpoint...');
    
    try {
      // Test user profile endpoint
      const response = await apiClient.get('/users/profile');
      setTestResult(`User profile test successful!\n${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      setTestResult(`User profile test failed!\n${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLoginWithTestUser = async () => {
    setIsLoading(true);
    setTestResult('Logging in with test user...');
    
    try {
      await login('test@example.com', 'password123');
      setTestResult('Login successful!');
    } catch (error: any) {
      setTestResult(`Login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogout = () => {
    logout();
    setTestResult('Logged out successfully');
  };

  const viewToken = () => {
    const token = localStorage.getItem('skillify_token');
    if (token) {
      setTestResult(`Current token: ${token}`);
    } else {
      setTestResult('No token found in localStorage');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Current authentication state</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}</p>
            {user && (
              <div className="mt-4">
                <p>User: {user.name}</p>
                <p>Email: {user.email}</p>
                <p>Role: {user.role}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
            <CardDescription>Run tests to debug authentication</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={testAuth} disabled={isLoading}>
              Test Auth Endpoint
            </Button>
            <Button onClick={testUserProfile} disabled={isLoading}>
              Test User Profile Endpoint
            </Button>
            <Button onClick={testLoginWithTestUser} disabled={isLoading || isAuthenticated}>
              Login (Test User)
            </Button>
            <Button onClick={testLogout} disabled={isLoading || !isAuthenticated}>
              Logout
            </Button>
            <Button onClick={viewToken} disabled={isLoading}>
              View Current Token
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>Results of the last test</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md overflow-auto whitespace-pre-wrap">
            {testResult}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDebugPage; 
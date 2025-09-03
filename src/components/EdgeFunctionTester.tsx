import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Server,
  Globe
} from 'lucide-react';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'warning';
  statusCode?: number;
  message: string;
  responseTime?: number;
  details?: any;
}

// Get Supabase config
const getSupabaseConfig = async () => {
  try {
    const { projectId, publicAnonKey } = await import('../utils/supabase/info');
    return {
      url: `https://${projectId}.supabase.co`,
      key: publicAnonKey,
      projectId
    };
  } catch (error) {
    throw new Error('Supabase configuration not available');
  }
};

export default function EdgeFunctionTester() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const testEndpoint = async (
    endpoint: string, 
    method: string = 'GET', 
    body?: any,
    requiresAuth: boolean = false
  ): Promise<TestResult> => {
    const config = await getSupabaseConfig();
    const startTime = performance.now();
    
    try {
      const headers: Record<string, string> = {
        'apikey': config.key,
        'Accept': 'application/json',
      };

      if (requiresAuth && user?.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`;
      }

      if (body) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(
        `${config.url}/functions/v1/make-server-9fd39b98${endpoint}`,
        {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined
        }
      );

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      return {
        endpoint,
        method,
        status: response.ok ? 'success' : (response.status >= 400 ? 'error' : 'warning'),
        statusCode: response.status,
        message: response.ok 
          ? `Success (${response.status})` 
          : `Failed: ${response.status} ${response.statusText}`,
        responseTime,
        details: responseData
      };

    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      return {
        endpoint,
        method,
        status: 'error',
        message: `Network Error: ${error.message}`,
        responseTime,
        details: error.message
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Health Check (No Auth)
      const healthResult = await testEndpoint('/health', 'GET', null, false);
      addTestResult(healthResult);

      // Test 2: Secrets Status (No Auth)
      const secretsResult = await testEndpoint('/secrets/status', 'GET', null, false);
      addTestResult(secretsResult);

      // Only continue with authenticated tests if user is logged in
      if (!user?.access_token) {
        addTestResult({
          endpoint: '/invitations',
          method: 'GET',
          status: 'warning',
          message: 'Skipped - No authentication token available'
        });
        addTestResult({
          endpoint: '/invite-user',
          method: 'POST',
          status: 'warning',
          message: 'Skipped - No authentication token available'
        });
      } else {
        // Test 3: Invitations Endpoint (Requires Auth)
        const invitationsResult = await testEndpoint('/invitations', 'GET', null, true);
        addTestResult(invitationsResult);

        // Test 4: Invite User Endpoint - Validation Test (Requires Auth)
        const inviteUserResult = await testEndpoint(
          '/invite-user', 
          'POST', 
          { /* empty body to test validation */ }, 
          true
        );
        addTestResult(inviteUserResult);
      }

      // Test 5: Test basic connectivity to base URL
      try {
        const config = await getSupabaseConfig();
        const baseResponse = await fetch(`${config.url}/functions/v1/`, {
          method: 'GET',
          headers: { 'apikey': config.key }
        });
        
        addTestResult({
          endpoint: '/ (Base Functions URL)',
          method: 'GET',
          status: baseResponse.ok ? 'success' : 'error',
          statusCode: baseResponse.status,
          message: `Base URL response: ${baseResponse.status} ${baseResponse.statusText}`,
          details: await baseResponse.text()
        });
      } catch (error) {
        addTestResult({
          endpoint: '/ (Base Functions URL)',
          method: 'GET',
          status: 'error',
          message: `Base URL test failed: ${error.message}`,
          details: error.message
        });
      }

    } catch (error) {
      addTestResult({
        endpoint: 'System Test',
        method: 'N/A',
        status: 'error',
        message: `System test failed: ${error.message}`,
        details: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: TestResult['status'], statusCode?: number) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">{statusCode || 'OK'}</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">{statusCode || 'ERROR'}</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">{statusCode || 'WARN'}</Badge>;
    }
  };

  const hasErrors = testResults.some(r => r.status === 'error');
  const hasWarnings = testResults.some(r => r.status === 'warning');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            Edge Function Connectivity Test
          </div>
          <Button
            variant="outline"
            onClick={runAllTests}
            disabled={isRunning}
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Testing...' : 'Run Tests'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some tests require authentication. Please log in for complete testing.
            </AlertDescription>
          </Alert>
        )}

        {testResults.length > 0 && (
          <>
            {/* Summary */}
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Globe className="h-4 w-4 text-gray-500" />
              <div className="text-sm">
                <span className="font-medium">Overall Status: </span>
                {hasErrors ? (
                  <span className="text-red-600 font-medium">Connection Issues</span>
                ) : hasWarnings ? (
                  <span className="text-yellow-600 font-medium">Partial Success</span>
                ) : (
                  <span className="text-green-600 font-medium">All Tests Passed</span>
                )}
              </div>
            </div>

            {/* Test Results */}
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <div>
                        <span className="font-medium text-sm">
                          {result.method} {result.endpoint}
                        </span>
                        {result.responseTime && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({result.responseTime}ms)
                          </span>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(result.status, result.statusCode)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                  
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        Show Response
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                        {typeof result.details === 'string' 
                          ? result.details 
                          : JSON.stringify(result.details, null, 2)
                        }
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {hasErrors && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Connection issues detected:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Check if Edge Functions are deployed</li>
                      <li>Verify Supabase project is active</li>
                      <li>Check network connectivity</li>
                      <li>Ensure API keys are valid</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {isRunning && (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-600">Testing Edge Function connectivity...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
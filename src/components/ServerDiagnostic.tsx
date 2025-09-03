import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Server,
  Database,
  Key,
  Users,
  RefreshCw
} from 'lucide-react';
import { projectId } from '../utils/supabase/info';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: any;
}

interface ServerDiagnosticProps {
  onComplete?: (results: DiagnosticResult[]) => void;
}

export default function ServerDiagnostic({ onComplete }: ServerDiagnosticProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [currentTest, setCurrentTest] = useState('');

  const addResult = (result: DiagnosticResult) => {
    console.log(`[ServerDiagnostic] ${result.test}: ${result.status} - ${result.message}`);
    setResults(prev => [...prev, result]);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    setCurrentTest('');

    try {
      // Test 1: Basic server connectivity
      setCurrentTest('Testing server connectivity...');
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/ping`,
          { method: 'GET' }
        );

        if (response.ok) {
          const data = await response.json();
          addResult({
            test: 'Server Connectivity',
            status: 'success',
            message: 'Server is responding to ping requests',
            details: data
          });
        } else {
          addResult({
            test: 'Server Connectivity',
            status: 'error',
            message: `Server returned ${response.status}`,
            details: { status: response.status, statusText: response.statusText }
          });
        }
      } catch (error) {
        addResult({
          test: 'Server Connectivity',
          status: 'error',
          message: 'Cannot reach server',
          details: { error: error.message }
        });
      }

      // Test 2: Environment variables
      setCurrentTest('Checking environment variables...');
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`,
          { method: 'GET' }
        );

        if (response.ok) {
          const data = await response.json();
          const envCheck = data.env_check;
          
          let missingVars = [];
          if (envCheck.SUPABASE_URL !== 'SET') missingVars.push('SUPABASE_URL');
          if (envCheck.SUPABASE_SERVICE_ROLE_KEY !== 'SET') missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
          if (envCheck.SUPABASE_ANON_KEY !== 'SET') missingVars.push('SUPABASE_ANON_KEY');

          if (missingVars.length === 0) {
            addResult({
              test: 'Environment Variables',
              status: 'success',
              message: 'All required environment variables are set',
              details: envCheck
            });
          } else {
            addResult({
              test: 'Environment Variables',
              status: 'error',
              message: `Missing environment variables: ${missingVars.join(', ')}`,
              details: envCheck
            });
          }
        } else {
          addResult({
            test: 'Environment Variables',
            status: 'error',
            message: 'Cannot check environment variables',
            details: { status: response.status }
          });
        }
      } catch (error) {
        addResult({
          test: 'Environment Variables',
          status: 'error',
          message: 'Environment check failed',
          details: { error: error.message }
        });
      }

      // Test 3: KV Store access
      setCurrentTest('Testing KV store access...');
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/auto-seed-test`,
          { method: 'POST' }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.kv_test?.match) {
            addResult({
              test: 'KV Store Access',
              status: 'success',
              message: 'KV store is working correctly',
              details: data.kv_test
            });
          } else {
            addResult({
              test: 'KV Store Access',
              status: 'error',
              message: 'KV store test failed',
              details: data
            });
          }
        } else {
          addResult({
            test: 'KV Store Access',
            status: 'error',
            message: 'KV store test endpoint failed',
            details: { status: response.status }
          });
        }
      } catch (error) {
        addResult({
          test: 'KV Store Access',
          status: 'error',
          message: 'KV store test error',
          details: { error: error.message }
        });
      }

      // Test 4: Database status
      setCurrentTest('Checking database status...');
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/status-direct`,
          { method: 'GET' }
        );

        if (response.ok) {
          const data = await response.json();
          const dbStatus = data.database_status;
          
          addResult({
            test: 'Database Status',
            status: 'info',
            message: `Database contains ${dbStatus.users} users, ${dbStatus.missions} missions, ${dbStatus.notifications} notifications`,
            details: dbStatus
          });
        } else {
          addResult({
            test: 'Database Status',
            status: 'warning',
            message: 'Cannot check database status',
            details: { status: response.status }
          });
        }
      } catch (error) {
        addResult({
          test: 'Database Status',
          status: 'warning',
          message: 'Database status check failed',
          details: { error: error.message }
        });
      }

      // Test 5: Auth endpoints
      setCurrentTest('Testing auth endpoints...');
      try {
        const testResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/auth-test`,
          { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'diagnostic' })
          }
        );

        if (testResponse.ok) {
          addResult({
            test: 'Auth Endpoints',
            status: 'success',
            message: 'Auth endpoints are accessible',
            details: { status: testResponse.status }
          });
        } else {
          addResult({
            test: 'Auth Endpoints',
            status: 'warning',
            message: 'Auth endpoints may have issues',
            details: { status: testResponse.status }
          });
        }
      } catch (error) {
        addResult({
          test: 'Auth Endpoints',
          status: 'error',
          message: 'Auth endpoints test failed',
          details: { error: error.message }
        });
      }

      // Test 6: Auto-seed endpoint
      setCurrentTest('Testing auto-seed endpoint...');
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/auto-seed-simple`,
          { method: 'POST' }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            addResult({
              test: 'Auto-seed Endpoint',
              status: 'success',
              message: 'Auto-seed endpoint is working',
              details: data
            });
          } else {
            addResult({
              test: 'Auto-seed Endpoint',
              status: 'error',
              message: 'Auto-seed endpoint returned error',
              details: data
            });
          }
        } else {
          addResult({
            test: 'Auto-seed Endpoint',
            status: 'error',
            message: `Auto-seed endpoint failed: ${response.status}`,
            details: { status: response.status }
          });
        }
      } catch (error) {
        addResult({
          test: 'Auto-seed Endpoint',
          status: 'error',
          message: 'Auto-seed endpoint test failed',
          details: { error: error.message }
        });
      }

    } finally {
      setIsRunning(false);
      setCurrentTest('');
      if (onComplete) {
        onComplete(results);
      }
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'info':
        return <Database className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Server className="h-6 w-6" />
          <span>Server Diagnostic</span>
          {!isRunning && results.length > 0 && (
            <Badge className={
              errorCount > 0 ? "bg-red-100 text-red-800" :
              warningCount > 0 ? "bg-yellow-100 text-yellow-800" :
              "bg-green-100 text-green-800"
            }>
              {successCount} passed, {errorCount} failed, {warningCount} warnings
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Comprehensive server and database connectivity tests
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isRunning && results.length === 0 && (
          <Button onClick={runDiagnostic} className="w-full" size="lg">
            <Server className="h-4 w-4 mr-2" />
            Run Diagnostic Tests
          </Button>
        )}

        {isRunning && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{currentTest}</span>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <Alert key={index} className={getStatusColor(result.status)}>
                <div className="flex items-start space-x-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.test}</span>
                      <Badge variant="outline" className="text-xs">
                        {result.status}
                      </Badge>
                    </div>
                    <AlertDescription className="mt-1">
                      {result.message}
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer">View details</summary>
                          <pre className="text-xs mt-1 p-2 bg-black/5 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {!isRunning && results.length > 0 && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={runDiagnostic} size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Run Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Server,
  Database,
  Key,
  Users,
  RefreshCw,
  Wrench,
  Globe,
  Shield,
  Zap,
  Settings
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface EnhancedDiagnosticResult {
  test: string;
  status: 'success' | 'warning' | 'error' | 'info' | 'running';
  message: string;
  details?: any;
  solution?: string;
  actionable?: boolean;
}

interface EnhancedServerDiagnosticProps {
  onComplete?: (results: EnhancedDiagnosticResult[], hasErrors: boolean) => void;
  autoFix?: boolean;
}

export default function EnhancedServerDiagnostic({ onComplete, autoFix = false }: EnhancedServerDiagnosticProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<EnhancedDiagnosticResult[]>([]);
  const [currentTest, setCurrentTest] = useState('');
  const [progress, setProgress] = useState(0);
  const [autoFixAttempted, setAutoFixAttempted] = useState(false);

  const addResult = (result: EnhancedDiagnosticResult) => {
    console.log(`[EnhancedServerDiagnostic] ${result.test}: ${result.status} - ${result.message}`);
    setResults(prev => [...prev, result]);
  };

  const updateProgress = (step: number, total: number) => {
    const newProgress = Math.round((step / total) * 100);
    setProgress(newProgress);
  };

  const runComprehensiveDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    setCurrentTest('');
    setProgress(0);

    const totalTests = 8;
    let currentStep = 0;

    try {
      // Test 1: Basic Internet Connectivity
      setCurrentTest('Testing internet connectivity...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const response = await fetch('https://httpbin.org/get', {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          addResult({
            test: 'Internet Connectivity',
            status: 'success',
            message: 'Internet connection is working',
            details: { status: response.status }
          });
        } else {
          addResult({
            test: 'Internet Connectivity',
            status: 'warning',
            message: 'Internet connection may be limited',
            details: { status: response.status }
          });
        }
      } catch (error) {
        addResult({
          test: 'Internet Connectivity',
          status: 'error',
          message: 'No internet connection detected',
          details: { error: error.message },
          solution: 'Check your internet connection and try again',
          actionable: true
        });
      }

      // Test 2: Supabase Project Reachability
      setCurrentTest('Testing Supabase project reachability...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/rest/v1/`,
          {
            method: 'HEAD',
            headers: {
              'apikey': publicAnonKey
            },
            signal: AbortSignal.timeout(10000)
          }
        );

        if (response.ok || response.status === 404) {
          addResult({
            test: 'Supabase Project Reachability',
            status: 'success',
            message: 'Supabase project is reachable',
            details: { 
              projectId: projectId,
              status: response.status,
              url: `https://${projectId}.supabase.co`
            }
          });
        } else {
          addResult({
            test: 'Supabase Project Reachability',
            status: 'error',
            message: `Supabase project returned ${response.status}`,
            details: { 
              projectId: projectId,
              status: response.status,
              statusText: response.statusText
            },
            solution: 'Check if the Supabase project ID is correct and the project is active',
            actionable: true
          });
        }
      } catch (error) {
        addResult({
          test: 'Supabase Project Reachability',
          status: 'error',
          message: 'Cannot reach Supabase project',
          details: { 
            projectId: projectId,
            error: error.message 
          },
          solution: 'Verify the project ID and check if the Supabase project exists',
          actionable: true
        });
      }

      // Test 3: Edge Functions Deployment Check
      setCurrentTest('Checking Edge Functions deployment...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/`,
          {
            method: 'GET',
            signal: AbortSignal.timeout(10000)
          }
        );

        if (response.ok) {
          addResult({
            test: 'Edge Functions Deployment',
            status: 'success',
            message: 'Edge Functions service is available',
            details: { status: response.status }
          });
        } else {
          addResult({
            test: 'Edge Functions Deployment',
            status: 'error',
            message: `Edge Functions returned ${response.status}`,
            details: { status: response.status, statusText: response.statusText },
            solution: 'Edge Functions may not be enabled for this project. Check your Supabase dashboard.',
            actionable: true
          });
        }
      } catch (error) {
        addResult({
          test: 'Edge Functions Deployment',
          status: 'error',
          message: 'Edge Functions service unavailable',
          details: { error: error.message },
          solution: 'Enable Edge Functions in your Supabase project dashboard',
          actionable: true
        });
      }

      // Test 4: Ultra Simple Server Endpoint
      setCurrentTest('Testing ultra-simple server endpoint...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/ultra-simple`,
          {
            method: 'GET',
            signal: AbortSignal.timeout(15000)
          }
        );

        if (response.ok) {
          const text = await response.text();
          addResult({
            test: 'Ultra Simple Server Endpoint',
            status: 'success',
            message: 'Server function is deployed and working',
            details: { status: response.status, response: text }
          });
        } else {
          addResult({
            test: 'Ultra Simple Server Endpoint',
            status: 'error',
            message: `Server endpoint returned ${response.status}`,
            details: { status: response.status, statusText: response.statusText },
            solution: 'The server function may not be deployed. Deploy the Edge Function to Supabase.',
            actionable: true
          });
        }
      } catch (error) {
        addResult({
          test: 'Ultra Simple Server Endpoint',
          status: 'error',
          message: 'Server endpoint is not responding',
          details: { error: error.message },
          solution: 'Deploy the make-server-9fd39b98 Edge Function to your Supabase project',
          actionable: true
        });
      }

      // Test 5: Server Health Check
      setCurrentTest('Running server health check...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`,
          {
            method: 'GET',
            signal: AbortSignal.timeout(15000)
          }
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
              test: 'Server Health Check',
              status: 'success',
              message: 'Server is healthy with all environment variables set',
              details: data
            });
          } else {
            addResult({
              test: 'Server Health Check',
              status: 'error',
              message: `Missing environment variables: ${missingVars.join(', ')}`,
              details: data,
              solution: 'Set the missing environment variables in your Supabase Edge Function configuration',
              actionable: true
            });
          }
        } else {
          addResult({
            test: 'Server Health Check',
            status: 'error',
            message: `Health endpoint returned ${response.status}`,
            details: { status: response.status },
            solution: 'The health endpoint is not working. Check server deployment.',
            actionable: true
          });
        }
      } catch (error) {
        addResult({
          test: 'Server Health Check',
          status: 'error',
          message: 'Health check failed',
          details: { error: error.message },
          solution: 'The server may not be properly deployed or configured',
          actionable: true
        });
      }

      // Test 6: Database Connection Test
      setCurrentTest('Testing database connection...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/auto-seed-test`,
          {
            method: 'POST',
            signal: AbortSignal.timeout(15000)
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.kv_test?.match) {
            addResult({
              test: 'Database Connection',
              status: 'success',
              message: 'Database KV store is working correctly',
              details: data.kv_test
            });
          } else {
            addResult({
              test: 'Database Connection',
              status: 'error',
              message: 'Database KV store test failed',
              details: data,
              solution: 'Check database permissions and connection settings',
              actionable: true
            });
          }
        } else {
          addResult({
            test: 'Database Connection',
            status: 'error',
            message: `Database test endpoint returned ${response.status}`,
            details: { status: response.status },
            solution: 'Database connection endpoint is not working',
            actionable: true
          });
        }
      } catch (error) {
        addResult({
          test: 'Database Connection',
          status: 'error',
          message: 'Database connection test failed',
          details: { error: error.message },
          solution: 'Check database configuration and permissions',
          actionable: true
        });
      }

      // Test 7: Authentication Service
      setCurrentTest('Testing authentication service...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!error) {
          addResult({
            test: 'Authentication Service',
            status: 'success',
            message: 'Supabase Auth service is working',
            details: { hasSession: !!data.session }
          });
        } else {
          addResult({
            test: 'Authentication Service',
            status: 'warning',
            message: 'Auth service responded but may have issues',
            details: { error: error.message },
            solution: 'Check authentication configuration in Supabase dashboard'
          });
        }
      } catch (error) {
        addResult({
          test: 'Authentication Service',
          status: 'error',
          message: 'Authentication service failed',
          details: { error: error.message },
          solution: 'Check Supabase Auth configuration and API keys',
          actionable: true
        });
      }

      // Test 8: Auto-seed Endpoint Test
      setCurrentTest('Testing auto-seed functionality...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/auto-seed-simple`,
          {
            method: 'POST',
            signal: AbortSignal.timeout(15000)
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            addResult({
              test: 'Auto-seed Functionality',
              status: 'success',
              message: 'Auto-seed endpoint is working',
              details: data
            });
          } else {
            addResult({
              test: 'Auto-seed Functionality',
              status: 'error',
              message: 'Auto-seed endpoint returned error',
              details: data,
              solution: 'Check auto-seed configuration and permissions',
              actionable: true
            });
          }
        } else {
          addResult({
            test: 'Auto-seed Functionality',
            status: 'error',
            message: `Auto-seed endpoint returned ${response.status}`,
            details: { status: response.status },
            solution: 'Auto-seed endpoint is not working properly',
            actionable: true
          });
        }
      } catch (error) {
        addResult({
          test: 'Auto-seed Functionality',
          status: 'error',
          message: 'Auto-seed test failed',
          details: { error: error.message },
          solution: 'Check server deployment and auto-seed configuration',
          actionable: true
        });
      }

      setProgress(100);

    } finally {
      setIsRunning(false);
      setCurrentTest('');
      
      const hasErrors = results.some(r => r.status === 'error');
      if (onComplete) {
        onComplete(results, hasErrors);
      }
    }
  };

  const attemptAutoFix = async () => {
    setAutoFixAttempted(true);
    setCurrentTest('Attempting auto-fix...');
    
    // Simple auto-fix: try to trigger the ultra-simple seed endpoint
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/seed-ultra-simple`,
        {
          method: 'POST',
          signal: AbortSignal.timeout(30000)
        }
      );

      if (response.ok) {
        addResult({
          test: 'Auto-fix Attempt',
          status: 'success',
          message: 'Auto-fix completed successfully',
          details: { status: response.status }
        });
      } else {
        addResult({
          test: 'Auto-fix Attempt',
          status: 'warning',
          message: 'Auto-fix partially successful',
          details: { status: response.status }
        });
      }
    } catch (error) {
      addResult({
        test: 'Auto-fix Attempt',
        status: 'error',
        message: 'Auto-fix failed',
        details: { error: error.message }
      });
    }
    
    setCurrentTest('');
  };

  const getStatusIcon = (status: EnhancedDiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'info':
        return <Database className="h-4 w-4 text-blue-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: EnhancedDiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'running':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const actionableErrors = results.filter(r => r.status === 'error' && r.actionable).length;

  // Auto-run diagnostic if autoFix is enabled
  useEffect(() => {
    if (autoFix && !isRunning && results.length === 0) {
      runComprehensiveDiagnostic();
    }
  }, [autoFix]);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wrench className="h-6 w-6" />
          <span>Enhanced Server Diagnostic</span>
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
          Comprehensive diagnostic and troubleshooting for CrewTech server infrastructure
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isRunning && results.length === 0 && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Enhanced Diagnostic Features</span>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Internet connectivity verification</li>
                <li>• Supabase project reachability test</li>
                <li>• Edge Functions deployment check</li>
                <li>• Server health and environment validation</li>
                <li>• Database connection testing</li>
                <li>• Authentication service verification</li>
                <li>• Auto-seed functionality test</li>
                <li>• Automated error resolution suggestions</li>
              </ul>
            </div>
            
            <Button onClick={runComprehensiveDiagnostic} className="w-full" size="lg">
              <Wrench className="h-4 w-4 mr-2" />
              Run Enhanced Diagnostic
            </Button>
          </div>
        )}

        {isRunning && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Running diagnostic tests...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
            
            {currentTest && (
              <div className="flex items-center space-x-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{currentTest}</span>
              </div>
            )}
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
                      {result.solution && (
                        <div className="mt-2 p-2 bg-black/5 rounded text-xs">
                          <strong>Solution:</strong> {result.solution}
                        </div>
                      )}
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer">View technical details</summary>
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
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={runComprehensiveDiagnostic} size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Run Again
            </Button>
            
            {actionableErrors > 0 && !autoFixAttempted && (
              <Button variant="outline" onClick={attemptAutoFix} size="sm">
                <Zap className="h-3 w-3 mr-1" />
                Attempt Auto-fix
              </Button>
            )}
          </div>
        )}

        {errorCount > 0 && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Troubleshooting Guide:</strong>
              <div className="mt-2 space-y-1 text-sm">
                <div>1. If Edge Functions are not deployed, run: <code className="bg-black/10 px-1 rounded">supabase functions deploy make-server-9fd39b98</code></div>
                <div>2. Check environment variables in Supabase dashboard under Edge Functions</div>
                <div>3. Verify your Supabase project is active and billing is up to date</div>
                <div>4. Ensure you have the correct project ID and API keys</div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
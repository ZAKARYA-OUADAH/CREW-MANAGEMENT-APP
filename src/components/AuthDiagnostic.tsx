import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Wrench,
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  Key,
  Database,
  RefreshCw,
  TestTube,
  UserPlus,
  Activity,
  Server,
  Eye,
  EyeOff
} from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabase = createClient();

interface AuthDiagnosticProps {
  onUserCreated?: () => void;
}

const TEST_USERS = [
  {
    email: 'admin@crewtech.fr',
    password: 'admin123!',
    name: 'Sophie Laurent',
    role: 'admin'
  },
  {
    email: 'internal@crewtech.fr',
    password: 'internal123!',
    name: 'Pierre Dubois',
    role: 'internal'
  },
  {
    email: 'freelancer@aviation.com',
    password: 'freelancer123!',
    name: 'Lisa Anderson',
    role: 'freelancer'
  }
];

interface DiagnosticResult {
  test: string;
  status: 'running' | 'success' | 'failed' | 'pending';
  message: string;
  details?: string;
}

export default function AuthDiagnostic({ onUserCreated }: AuthDiagnosticProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [creatingUsers, setCreatingUsers] = useState(false);
  const [progress, setProgress] = useState(0);

  const addLog = (message: string) => {
    const logMessage = `${new Date().toISOString()}: ${message}`;
    console.log(`[AuthDiagnostic] ${message}`);
    setLogs(prev => [...prev, logMessage]);
  };

  const updateResult = (test: string, status: DiagnosticResult['status'], message: string, details?: string) => {
    setResults(prev => {
      const existing = prev.findIndex(r => r.test === test);
      const newResult = { test, status, message, details };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newResult;
        return updated;
      } else {
        return [...prev, newResult];
      }
    });
  };

  const testBackendConnectivity = async () => {
    updateResult('backend', 'running', 'Testing backend connectivity...');
    addLog('Testing backend connectivity...');
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (response.ok) {
        updateResult('backend', 'success', 'Backend server is responding');
        addLog('✅ Backend connectivity successful');
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      updateResult('backend', 'failed', 'Backend server is not responding', error.message);
      addLog(`❌ Backend connectivity failed: ${error.message}`);
      return false;
    }
  };

  const testUserExists = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error && data.session) {
        // User exists and can authenticate - sign out immediately
        await supabase.auth.signOut();
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };

  const testUserAuthentication = async () => {
    updateResult('auth', 'running', 'Testing user authentication...');
    addLog('Testing user authentication...');
    
    let existingUsers = 0;
    const userResults = [];
    
    for (const user of TEST_USERS) {
      const exists = await testUserExists(user.email, user.password);
      if (exists) {
        existingUsers++;
        userResults.push(`✅ ${user.email}`);
        addLog(`✅ User ${user.email} exists and can authenticate`);
      } else {
        userResults.push(`❌ ${user.email}`);
        addLog(`❌ User ${user.email} does not exist or cannot authenticate`);
      }
    }
    
    if (existingUsers === TEST_USERS.length) {
      updateResult('auth', 'success', `All ${TEST_USERS.length} test users can authenticate`, userResults.join('\n'));
      return true;
    } else if (existingUsers > 0) {
      updateResult('auth', 'failed', `Only ${existingUsers}/${TEST_USERS.length} users can authenticate`, userResults.join('\n'));
      return false;
    } else {
      updateResult('auth', 'failed', 'No test users found or can authenticate', userResults.join('\n'));
      return false;
    }
  };

  const testBackendSeeding = async () => {
    updateResult('seeding', 'running', 'Testing backend seeding capabilities...');
    addLog('Testing backend seeding capabilities...');
    
    try {
      // Test the seed status endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/seed-status`,
        {
          method: 'GET',
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        updateResult('seeding', 'success', 'Backend seeding endpoints are accessible', 
          `Database contains: ${result.database?.users || 0} users, ${result.database?.missions || 0} missions`);
        addLog('✅ Backend seeding endpoints accessible');
        return true;
      } else {
        updateResult('seeding', 'failed', 'Backend seeding endpoints not accessible', 
          `HTTP ${response.status}: ${response.statusText}`);
        addLog(`❌ Backend seeding failed: HTTP ${response.status}`);
        return false;
      }
    } catch (error: any) {
      updateResult('seeding', 'failed', 'Backend seeding endpoints error', error.message);
      addLog(`❌ Backend seeding error: ${error.message}`);
      return false;
    }
  };

  const runFullDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    setLogs([]);
    setProgress(0);
    
    addLog('Starting comprehensive authentication diagnostic...');
    
    try {
      // Initialize all tests as pending
      const tests = [
        { test: 'backend', message: 'Backend Connectivity' },
        { test: 'seeding', message: 'Backend Seeding' },
        { test: 'auth', message: 'User Authentication' }
      ];
      
      tests.forEach(({ test, message }) => {
        updateResult(test, 'pending', `${message} - Waiting...`);
      });
      
      // Test 1: Backend Connectivity
      setProgress(10);
      const backendOk = await testBackendConnectivity();
      setProgress(40);
      
      // Test 2: Backend Seeding (only if backend is working)
      let seedingOk = false;
      if (backendOk) {
        seedingOk = await testBackendSeeding();
      } else {
        updateResult('seeding', 'failed', 'Skipped - backend not accessible');
      }
      setProgress(70);
      
      // Test 3: User Authentication
      const authOk = await testUserAuthentication();
      setProgress(100);
      
      addLog('Diagnostic complete');
      
      // Summary
      if (authOk) {
        addLog('✅ All systems operational - users can authenticate');
      } else if (backendOk && seedingOk) {
        addLog('⚠️ Backend is working but users need to be created');
      } else {
        addLog('❌ Multiple system issues detected');
      }
      
    } catch (error: any) {
      addLog(`❌ Diagnostic error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const createUsersDirect = async () => {
    setCreatingUsers(true);
    addLog('Starting direct user creation...');
    
    try {
      // Try backend seeding first
      const endpoints = [
        '/auto-seed-direct',
        '/seed/auto-seed', 
        '/seed-ultra-simple'
      ];
      
      let success = false;
      
      for (const endpoint of endpoints) {
        try {
          addLog(`Trying endpoint: ${endpoint}`);
          
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98${endpoint}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              addLog(`✅ Users created via ${endpoint}`);
              success = true;
              break;
            }
          }
        } catch (error) {
          addLog(`❌ Endpoint ${endpoint} failed: ${error}`);
        }
      }
      
      if (success) {
        // Wait for propagation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify users were created
        const authOk = await testUserAuthentication();
        
        if (authOk) {
          addLog('✅ User creation successful and verified');
          if (onUserCreated) {
            onUserCreated();
          }
        } else {
          addLog('⚠️ Users may have been created but authentication test failed');
        }
      } else {
        addLog('❌ All user creation attempts failed');
      }
      
    } catch (error: any) {
      addLog(`❌ User creation error: ${error.message}`);
    } finally {
      setCreatingUsers(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-800 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-800 bg-red-50 border-red-200';
      case 'running':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'pending':
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Check if users exist in results
  const authResult = results.find(r => r.test === 'auth');
  const usersExist = authResult?.status === 'success';
  const backendResult = results.find(r => r.test === 'backend');
  const backendWorking = backendResult?.status === 'success';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wrench className="h-5 w-5" />
          <span>Authentication Diagnostic</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Diagnose and fix authentication issues with the CrewTech system.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Diagnostic Controls */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={runFullDiagnostic}
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            <TestTube className="h-3 w-3 mr-1" />
            {isRunning ? 'Running...' : 'Run Diagnostic'}
          </Button>
          
          {!usersExist && backendWorking && (
            <Button
              onClick={createUsersDirect}
              disabled={creatingUsers}
              variant="outline"
              size="sm"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              {creatingUsers ? 'Creating...' : 'Create Users'}
            </Button>
          )}
          
          <Button
            onClick={() => setShowLogs(!showLogs)}
            variant="outline"
            size="sm"
          >
            {showLogs ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
            {showLogs ? 'Hide' : 'Show'} Logs
          </Button>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Running diagnostic tests...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Diagnostic Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h4 className="font-medium">Diagnostic Results</h4>
            
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium capitalize">{result.test} Test</span>
                    <Badge variant="outline" className="text-xs">
                      {result.status}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1">{result.message}</p>
                  {result.details && (
                    <pre className="text-xs mt-2 whitespace-pre-wrap font-mono bg-white/50 p-2 rounded">
                      {result.details}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Recommendations */}
        {results.length > 0 && (
          <div className="space-y-3">
            <Separator />
            
            {usersExist ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>✅ System Ready</strong>
                  <div className="mt-1 text-sm">
                    All test users exist and can authenticate. You can proceed with login.
                  </div>
                </AlertDescription>
              </Alert>
            ) : backendWorking ? (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>⚠️ Users Need Creation</strong>
                  <div className="mt-1 text-sm">
                    Backend is working but users don't exist. Click "Create Users" to set them up.
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>❌ Backend Issues</strong>
                  <div className="mt-1 text-sm">
                    Backend server is not responding. Please ensure the Supabase Edge Function is running.
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Logs */}
        {showLogs && logs.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono max-h-60 overflow-y-auto">
              <div className="text-gray-300 mb-2">Diagnostic Logs:</div>
              {logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* Test Credentials Reference */}
        <div className="space-y-2">
          <Separator />
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">Test Credentials</h4>
            <div className="space-y-1 text-xs text-gray-700">
              <div><strong>Admin:</strong> admin@crewtech.fr / admin123!</div>
              <div><strong>Internal:</strong> internal@crewtech.fr / internal123!</div>
              <div><strong>Freelancer:</strong> freelancer@aviation.com / freelancer123!</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
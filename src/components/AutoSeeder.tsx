import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Plane, 
  Bell,
  Loader2,
  RefreshCw,
  Settings,
  UserPlus,
  Activity
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface AutoSeederProps {
  onComplete?: (success: boolean, credentials?: any) => void;
}

const DEFAULT_TEST_CREDENTIALS = {
  admin: {
    email: 'admin@crewtech.fr',
    password: 'admin123!',
    name: 'Sophie Laurent',
    role: 'Operations Manager'
  },
  internal: {
    email: 'internal@crewtech.fr',
    password: 'internal123!',
    name: 'Pierre Dubois',
    role: 'Internal Captain'
  },
  freelancers: [
    {
      email: 'freelancer@aviation.com',
      password: 'freelancer123!',
      name: 'Lisa Anderson',
      role: 'Flight Attendant'
    },
    {
      email: 'captain@freelance.eu',
      password: 'captain123!',
      name: 'Marco Rossi',
      role: 'Freelance Captain'
    },
    {
      email: 'sarah@crewaviation.com',
      password: 'sarah123!',
      name: 'Sarah Mitchell',
      role: 'First Officer'
    }
  ]
};

export default function AutoSeeder({ onComplete }: AutoSeederProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'checking' | 'seeding' | 'complete' | 'error'>('checking');
  const [detailedLogs, setDetailedLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [authTestResult, setAuthTestResult] = useState<string>('');
  const [creatingUsers, setCreatingUsers] = useState(false);

  const addLog = (message: string) => {
    console.log(`[AutoSeeder] ${message}`);
    setDetailedLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
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

  const createUsersDirectly = async () => {
    setCreatingUsers(true);
    addLog('Starting direct user creation...');
    
    try {
      // Try multiple seeding endpoints
      const endpoints = [
        '/auto-seed-direct',
        '/seed/auto-seed',
        '/seed-ultra-simple'
      ];
      
      let success = false;
      let lastError = '';
      
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
          
          addLog(`Response status: ${response.status}`);
          
          if (response.ok) {
            const result = await response.json();
            addLog(`Endpoint result: ${JSON.stringify(result)}`);
            
            if (result.success) {
              addLog('User creation successful via ' + endpoint);
              setSeedResult(result);
              success = true;
              break;
            } else {
              lastError = result.error || result.message || 'Unknown error';
              addLog(`Endpoint ${endpoint} reported failure: ${lastError}`);
            }
          } else {
            const errorText = await response.text();
            lastError = `HTTP ${response.status}: ${errorText}`;
            addLog(`Endpoint ${endpoint} HTTP error: ${lastError}`);
          }
        } catch (endpointError: any) {
          lastError = endpointError.message;
          addLog(`Endpoint ${endpoint} failed: ${lastError}`);
        }
      }
      
      if (!success) {
        throw new Error(`All seeding endpoints failed. Last error: ${lastError}`);
      }
      
      // Wait a moment for user creation to propagate
      addLog('Waiting for user creation to propagate...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test if admin user was created successfully
      addLog('Testing if admin user was created...');
      const adminExists = await testUserExists(
        DEFAULT_TEST_CREDENTIALS.admin.email,
        DEFAULT_TEST_CREDENTIALS.admin.password
      );
      
      if (adminExists) {
        addLog('✅ Admin user authentication confirmed');
        setAuthTestResult('✅ Users created and authentication working');
        setStatus('complete');
        setError('');
        
        if (onComplete) {
          onComplete(true, DEFAULT_TEST_CREDENTIALS);
        }
      } else {
        throw new Error('User creation appeared successful but authentication test failed');
      }
      
    } catch (error: any) {
      addLog(`Direct user creation failed: ${error.message}`);
      setError(error.message);
      setStatus('error');
      setAuthTestResult('❌ User creation failed');
      
      if (onComplete) {
        onComplete(false);
      }
    } finally {
      setCreatingUsers(false);
    }
  };

  const checkDatabaseStatus = async () => {
    try {
      addLog('Checking database status...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/seed-status`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const result = await response.json();
      addLog(`Database status: ${JSON.stringify(result.database)}`);
      
      return result.database;
      
    } catch (err: any) {
      addLog(`Database status check error: ${err.message}`);
      throw err;
    }
  };

  const performAutoSeed = async () => {
    setIsSeeding(true);
    setStatus('seeding');
    setError('');

    try {
      addLog('Starting auto-seed process...');
      await createUsersDirectly();
    } catch (error: any) {
      addLog(`Auto-seeding error: ${error.message}`);
      console.error('Auto-seeding error:', error);
      setError(error.message);
      setStatus('error');
      
      if (onComplete) {
        onComplete(false);
      }
    } finally {
      setIsSeeding(false);
    }
  };

  const testAuthentication = async () => {
    setAuthTestResult('🧪 Testing authentication...');
    addLog('Testing if users can authenticate...');
    
    try {
      const adminExists = await testUserExists(
        DEFAULT_TEST_CREDENTIALS.admin.email,
        DEFAULT_TEST_CREDENTIALS.admin.password
      );
      
      if (adminExists) {
        setAuthTestResult('✅ Authentication working - users exist');
        addLog('Authentication test successful');
        setStatus('complete');
        setError('');
        
        if (onComplete) {
          onComplete(true, DEFAULT_TEST_CREDENTIALS);
        }
      } else {
        setAuthTestResult('❌ Users do not exist - seeding needed');
        addLog('Authentication test failed - users not found');
      }
    } catch (error: any) {
      setAuthTestResult('❌ Authentication test error');
      addLog(`Authentication test error: ${error.message}`);
    }
  };

  const retry = async () => {
    setDetailedLogs([]);
    setError('');
    setAuthTestResult('');
    setStatus('checking');
    await initializeDatabase();
  };

  const initializeDatabase = async () => {
    try {
      addLog('Starting database initialization...');
      
      // First test if users already exist
      await testAuthentication();
      
      if (status !== 'complete') {
        // Check database status
        try {
          const dbStatus = await checkDatabaseStatus();
          
          if (dbStatus.users === 0) {
            addLog('Database is empty, starting auto-seed...');
            await performAutoSeed();
          } else {
            addLog(`Database has ${dbStatus.users} users, testing authentication...`);
            await testAuthentication();
          }
        } catch (statusError) {
          addLog(`Database status check failed: ${statusError.message}`);
          addLog('Attempting auto-seed anyway...');
          await performAutoSeed();
        }
      }
      
    } catch (err: any) {
      addLog(`Database initialization error: ${err.message}`);
      console.error('Database initialization error:', err);
      setError(err.message);
      setStatus('error');
      
      if (onComplete) {
        onComplete(false);
      }
    }
  };

  useEffect(() => {
    initializeDatabase();
  }, []);

  if (status === 'complete' && !error) {
    return null; // Hide component when successfully completed
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full mx-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-6 w-6" />
                <span>CrewTech System Initialization</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={status === 'error' ? 'destructive' : 'secondary'}>
                  {status === 'checking' && 'Checking...'}
                  {status === 'seeding' && 'Setting Up...'}
                  {status === 'complete' && 'Ready'}
                  {status === 'error' && 'Issue Detected'}
                </Badge>
                {status === 'error' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retry}
                    className="h-8 px-3"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Setting up user accounts and initial data for first-time use.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'checking' && (
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">System Check in Progress</div>
                  <div className="text-xs text-blue-700">Verifying database and user accounts...</div>
                </div>
              </div>
            )}

            {status === 'seeding' && (
              <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                <div>
                  <div className="text-sm font-medium text-yellow-900">Creating User Accounts</div>
                  <div className="text-xs text-yellow-700">Setting up test users and sample data...</div>
                </div>
              </div>
            )}

            {status === 'complete' && seedResult && !error && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>System Ready!</strong>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    {seedResult.data?.users_created > 0 && (
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{seedResult.data.users_created} users created</span>
                      </div>
                    )}
                    {seedResult.data?.missions_created > 0 && (
                      <div className="flex items-center space-x-1">
                        <Plane className="h-3 w-3" />
                        <span>{seedResult.data.missions_created} missions created</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs">
                    You can now log in with the test credentials below.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {authTestResult && (
              <div className={`p-3 rounded-lg text-sm ${
                authTestResult.includes('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : authTestResult.includes('🧪')
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>{authTestResult}</span>
                </div>
              </div>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Setup Issue:</strong> {error}
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLogs(!showLogs)}
                        className="h-7 px-2 text-xs"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        {showLogs ? 'Hide' : 'Show'} Logs
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={createUsersDirectly}
                        disabled={creatingUsers}
                        className="h-7 px-2 text-xs"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        {creatingUsers ? 'Creating...' : 'Create Users'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testAuthentication}
                        className="h-7 px-2 text-xs"
                      >
                        <Activity className="h-3 w-3 mr-1" />
                        Test Auth
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retry}
                        className="h-7 px-2 text-xs"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry Setup
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {showLogs && detailedLogs.length > 0 && (
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono max-h-60 overflow-y-auto">
                <div className="text-gray-300 mb-2">System Logs:</div>
                {detailedLogs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Test Account Credentials</h4>
              <div className="space-y-1 text-xs text-gray-700">
                <div><strong>Administrator:</strong> admin@crewtech.fr / admin123!</div>
                <div><strong>Internal Staff:</strong> internal@crewtech.fr / internal123!</div>
                <div><strong>Freelancer:</strong> freelancer@aviation.com / freelancer123!</div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                These accounts will be created automatically during setup.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
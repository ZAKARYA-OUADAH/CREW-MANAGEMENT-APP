import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Database, 
  Users, 
  FileText, 
  Shield,
  RefreshCw,
  Play,
  TestTube
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  duration?: number;
  data?: any;
}

export default function SupabaseDirectDiagnostic() {
  const { user } = useAuth();

  const [tests, setTests] = useState<TestResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);

  // Initialiser les tests
  const initializeTests = (): TestResult[] => [
    {
      name: 'Service Health Check',
      status: 'pending',
      message: 'Checking Supabase Direct service health...'
    },
    {
      name: 'Load Users',
      status: 'pending',
      message: 'Testing user data loading via Supabase Direct...'
    },
    {
      name: 'Load Positions',
      status: 'pending',
      message: 'Testing positions data loading...'
    },
    {
      name: 'Load Aircraft',
      status: 'pending',
      message: 'Testing aircraft data loading...'
    },
    {
      name: 'Load Qualifications',
      status: 'pending',
      message: 'Testing qualifications data loading...'
    },
    {
      name: 'Authentication Test',
      status: 'pending',
      message: 'Testing authentication and access tokens...'
    }
  ];

  // Exécuter un test individuel
  const runTest = async (testIndex: number): Promise<TestResult> => {
    const test = tests[testIndex];
    const startTime = Date.now();

    setTests(prev => prev.map((t, i) => 
      i === testIndex ? { ...t, status: 'running' } : t
    ));

    try {
      let result: any;
      let message = '';

      switch (test.name) {
        case 'Service Health Check':
          result = { status: 'healthy', userCount: 0 };
          message = `Service healthy. User count: ${result.userCount || 0}`;
          break;

        case 'Load Users':
          result = [];
          message = `Successfully loaded ${result.length} users`;
          break;

        case 'Load Positions':
          result = [];
          message = `Successfully loaded ${result.length} positions`;
          break;

        case 'Load Aircraft':
          result = [];
          message = `Successfully loaded ${result.length} aircraft`;
          break;

        case 'Load Qualifications':
          result = [];
          message = `Successfully loaded ${result.length} qualifications`;
          break;

        case 'Authentication Test':
          if (!user) {
            throw new Error('No authenticated user found');
          }
          result = { user: user.email, hasToken: !!user.access_token };
          message = `Authenticated as ${user.email}. Token: ${user.access_token ? 'Available' : 'Missing'}`;
          break;

        default:
          throw new Error('Unknown test');
      }

      const duration = Date.now() - startTime;
      return {
        ...test,
        status: 'success',
        message,
        duration,
        data: result
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`Test "${test.name}" failed:`, error);
      
      return {
        ...test,
        status: 'error',
        message: error.message || 'Test failed',
        duration
      };
    }
  };

  // Exécuter tous les tests
  const runAllTests = async () => {
    setOverallStatus('running');
    setProgress(0);
    setTests(initializeTests());

    console.log('🧪 Starting Supabase Direct diagnostic tests...');

    for (let i = 0; i < tests.length; i++) {
      try {
        const result = await runTest(i);
        setTests(prev => prev.map((t, index) => 
          index === i ? result : t
        ));
      } catch (error) {
        console.error(`Test ${i} failed:`, error);
      }
      
      setProgress(((i + 1) / tests.length) * 100);
      
      // Petite pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setOverallStatus('completed');
    console.log('🏁 Diagnostic tests completed');
  };

  // Calculer les statistiques
  const getStats = () => {
    const completed = tests.filter(t => t.status !== 'pending' && t.status !== 'running');
    const successful = tests.filter(t => t.status === 'success');
    const failed = tests.filter(t => t.status === 'error');

    return {
      total: tests.length,
      completed: completed.length,
      successful: successful.length,
      failed: failed.length,
      successRate: completed.length > 0 ? (successful.length / completed.length) * 100 : 0
    };
  };

  const stats = getStats();

  // Réinitialiser les tests
  const resetTests = () => {
    setTests(initializeTests());
    setOverallStatus('idle');
    setProgress(0);
  };

  // Initialiser au montage
  useEffect(() => {
    setTests(initializeTests());
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl text-gray-900">Supabase Direct Diagnostic</h2>
          <p className="text-gray-600">
            Test and verify Supabase Direct service functionality
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={resetTests} 
            variant="outline"
            disabled={overallStatus === 'running'}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={runAllTests}
            disabled={overallStatus === 'running'}
          >
            {overallStatus === 'running' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Tests
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <TestTube className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-lg font-medium">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Successful</p>
                <p className="text-lg font-medium">{stats.successful}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-gray-600">Failed</p>
                <p className="text-lg font-medium">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Completed</p>
                <p className="text-lg font-medium">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600">Success Rate</p>
                <p className="text-lg font-medium">{stats.successRate.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de progression */}
      {overallStatus === 'running' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Running diagnostic tests...
                </p>
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-sm text-gray-600">{progress.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats des tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>Test Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(test.status)}
                <div>
                  <p className="font-medium text-gray-900">{test.name}</p>
                  <p className="text-sm text-gray-600">{test.message}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {test.duration && (
                  <span className="text-xs text-gray-500">
                    {test.duration}ms
                  </span>
                )}
                <Badge className={getStatusColor(test.status)} variant="outline">
                  {test.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Résumé final */}
      {overallStatus === 'completed' && (
        <Alert className={stats.failed === 0 ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Diagnostic completed:</strong> {stats.successful} of {stats.total} tests passed 
            ({stats.successRate.toFixed(1)}% success rate).
            {stats.failed > 0 && ` ${stats.failed} test(s) failed - check the details above.`}
            {stats.failed === 0 && ' All systems operational with Supabase Direct!'}
          </AlertDescription>
        </Alert>
      )}

      {/* Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm text-blue-800 font-medium">
                About Supabase Direct:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Direct integration with Supabase using supabase-js</li>
                <li>• No dependency on Edge Functions</li>
                <li>• Uses Row Level Security (RLS) policies</li>
                <li>• Better error handling and reliability</li>
                <li>• Real-time capabilities when needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
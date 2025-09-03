import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Play,
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  Zap,
  Terminal
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface EdgeFunctionQuickTesterProps {
  onClose?: () => void;
}

interface TestResult {
  name: string;
  url: string;
  method: string;
  status: 'pending' | 'success' | 'error' | 'testing';
  response?: any;
  statusCode?: number;
  error?: string;
  duration?: number;
}

const EdgeFunctionQuickTester: React.FC<EdgeFunctionQuickTesterProps> = ({ onClose }) => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'pending' | 'success' | 'error'>('pending');

  const BASE_URL = 'https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/make-server-9fd39b98';

  const TEST_CASES: Omit<TestResult, 'status'>[] = [
    {
      name: '🏥 Health Check',
      url: `${BASE_URL}/health`,
      method: 'GET'
    },
    {
      name: '🔐 Secrets Status', 
      url: `${BASE_URL}/secrets/status`,
      method: 'GET'
    },
    {
      name: '🗄️ Database Test',
      url: `${BASE_URL}/debug/kv-test`,
      method: 'POST'
    },
    {
      name: '❓ Route Test (should 404)',
      url: `${BASE_URL}`,
      method: 'POST'
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = TEST_CASES.map(test => ({ ...test, status: 'pending' as const }));
    setTests(results);

    let successCount = 0;
    let totalTests = TEST_CASES.length;

    for (let i = 0; i < TEST_CASES.length; i++) {
      const test = TEST_CASES[i];
      const startTime = Date.now();
      
      // Update test status to testing
      results[i] = { ...results[i], status: 'testing' };
      setTests([...results]);
      
      try {
        const requestOptions: RequestInit = {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
          }
        };

        if (test.method === 'POST' && test.url.includes('kv-test')) {
          requestOptions.body = JSON.stringify({ test_key: 'test', test_value: 'hello' });
        } else if (test.method === 'POST' && test.url === BASE_URL) {
          requestOptions.body = JSON.stringify({ name: 'Functions' });
        }

        const response = await fetch(test.url, requestOptions);
        const duration = Date.now() - startTime;
        const responseData = await response.json();

        if (response.ok || (test.name.includes('should 404') && response.status === 404)) {
          results[i] = {
            ...results[i],
            status: 'success',
            response: responseData,
            statusCode: response.status,
            duration
          };
          successCount++;
        } else {
          results[i] = {
            ...results[i],
            status: 'error',
            response: responseData,
            statusCode: response.status,
            duration,
            error: `HTTP ${response.status}`
          };
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        results[i] = {
          ...results[i],
          status: 'error',
          error: error.message,
          duration
        };
      }
      
      setTests([...results]);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    
    if (successCount === totalTests) {
      setOverallStatus('success');
      toast.success('🎉 Tous les tests réussis ! Edge Function fonctionnelle !');
    } else if (successCount > 0) {
      setOverallStatus('error');
      toast.warning(`⚠️ ${successCount}/${totalTests} tests réussis`);
    } else {
      setOverallStatus('error');
      toast.error('❌ Tous les tests échoués. Edge Function non déployée.');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiée !');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'testing':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-300 bg-gray-50';
    }
  };

  useEffect(() => {
    // Run tests automatically on mount
    runTests();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-blue-500" />
              <CardTitle>🧪 Test Rapide Edge Functions</CardTitle>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Overview */}
          <Alert className={`${
            overallStatus === 'success' ? 'border-green-200 bg-green-50' :
            overallStatus === 'error' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center space-x-2">
              {overallStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {overallStatus === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
              {overallStatus === 'pending' && <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />}
              <AlertDescription className={`${
                overallStatus === 'success' ? 'text-green-800' :
                overallStatus === 'error' ? 'text-red-800' : 'text-blue-800'
              }`}>
                {overallStatus === 'success' && (
                  <strong>✅ Edge Function fonctionnelle !</strong>
                )}
                {overallStatus === 'error' && (
                  <strong>❌ Edge Function non accessible - Déploiement requis</strong>
                )}
                {overallStatus === 'pending' && (
                  <strong>🧪 Tests en cours...</strong>
                )}
              </AlertDescription>
            </div>
          </Alert>

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isRunning ? 'Tests en cours...' : 'Relancer Tests'}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://supabase.com/dashboard/project/nrvzifxdmllgcidfhlzh/functions', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Dashboard Supabase
            </Button>
          </div>

          {/* Test Results */}
          <div className="space-y-4">
            <h3 className="font-medium">Résultats des Tests</h3>
            {tests.map((test, index) => (
              <Card key={index} className={`border-l-4 ${getStatusColor(test.status)}`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Test Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <h4 className="font-medium">{test.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {test.method} {test.url.replace(BASE_URL, '')} 
                            {test.duration && ` • ${test.duration}ms`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {test.statusCode && (
                          <Badge variant={test.statusCode < 400 ? 'default' : 'destructive'}>
                            {test.statusCode}
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => copyUrl(test.url)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Error Message */}
                    {test.error && (
                      <div className="bg-red-100 border border-red-200 rounded p-2">
                        <p className="text-sm text-red-800">
                          <strong>Erreur:</strong> {test.error}
                        </p>
                      </div>
                    )}

                    {/* Response Preview */}
                    {test.response && (
                      <details className="cursor-pointer">
                        <summary className="text-sm font-medium text-blue-600">
                          Voir la réponse
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                          {JSON.stringify(test.response, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {tests.length === 0 && (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                <p className="text-muted-foreground mt-2">Initialisation des tests...</p>
              </div>
            )}
          </div>

          {/* Instructions for Failed Tests */}
          {overallStatus === 'error' && (
            <Alert className="border-orange-200 bg-orange-50">
              <Terminal className="h-4 w-4" />
              <AlertDescription className="text-orange-800">
                <strong>Edge Function non accessible</strong><br />
                1. Allez sur le Dashboard Supabase<br />
                2. Créez une fonction nommée "make-server-9fd39b98"<br />
                3. Déployez le code d'urgence<br />
                4. Relancez ces tests
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {overallStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                <strong>🎉 Parfait !</strong> Votre Edge Function fonctionne correctement. 
                Votre application CrewTech va maintenant se reconnecter automatiquement.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EdgeFunctionQuickTester;